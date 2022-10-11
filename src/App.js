import logo from './logo.svg';
import './App.css';
import React, { useEffect, useMemo, useState } from "react";
import { csv } from "d3-fetch";
import { debounce } from 'debounce';
//import { Masonry } from '@mui/lab';
import Masonry from "@mui/lab/Masonry";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import Typography from "@mui/material/Typography";
import { Link as RouterLink, useLocation } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Button from "@mui/material/Button";
//import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
//import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LaunchIcon from '@mui/icons-material/Launch';
import { makeStyles } from "@mui/styles";

import {
  NumberFilter,
  StringFilter,
  OptionFilter,
  KeywordFilter,
  CheckboxFilter,
} from "./Filters";
import Paper from "./Paper";
import { highlight, FilterType, UIControl, NONE, SEARCH } from "./filter";
import Navbar from './Navbar';

const DATA_URL = "https://raw.githubusercontent.com/graccy4eva/ResearchPapersRepository/main/public/Untitled%20spreadsheet%20-%20Dataassistivetech.csv";
const METADATA_URL = "https://raw.githubusercontent.com/graccy4eva/ResearchPapersRepository/main/public/Untitled%20spreadsheet%20-%20Metadataassitiveupdated.csv";

//function location(){

//}

function defaultMetadata() {

  return [{}, {
    doi: "",
    title: "",
    sliders: [],
    options: [],
    multioptions: [],
    checkboxes: [],
    searchable: [],
    displayTable: [],
    displayPopup: [],
  }];
}

function isNullish(value) {
  if (value === undefined || value === null) return true;
  const val = String(value).trim().toLowerCase();
  return val === 'none' || val === 'None' || val === 'null' || val === '';
}

function parseMetadata(data) {
  const p = new Promise((resolve, reject) => {
  const expectedColumns = ["Column Name", "Filter Label", "Explanation", "Role", "Type",
    "UI Control", "Searchable", "Display in Table", "Display in Popup"];
    
    const missingColumns = expectedColumns.filter((col) => !data.columns.includes(col));
    if (missingColumns.length > 0) {
      reject("Missing columns: " + missingColumns.join(", "));
      return;
    }

    const metadata = defaultMetadata();
    const [colData, options] = metadata;

    data.forEach((row) => {
      const col = row["Column Name"];
      const type = FilterType[row["Type"]];
      const control = UIControl[row["UI Control"]];

      const rowMeta = {
        label: row["Filter Label"],
        explanation: row["Explanation"],
        type,
        control,
        searchable: false,
      };

      switch (row["UI Control"]) {
        case "SLIDER":
          if (type !== FilterType.NUMBER) {
            reject(col + ": SLIDER control only works with NUMBER type.");
            return;
          }
          options.sliders.push(col);
          break;
        case "OPTION":
          options.options.push(col);
          rowMeta.type = FilterType.TEXT;
          break;
        case "MULTIOPTION":
          if (type !== FilterType.LIST) {
            reject(col + ": MULTIOPTION control only works with LIST type.");
            return;
          }
          options.multioptions.push(col);
          break;
        case "CHECKBOX":
          if (type !== FilterType.BOOLEAN) {
            reject(col + ": CHECKBOX control only works with BOOLEAN type.");
            return;
          }
          options.checkboxes.push(col);
          break;
        default:
          rowMeta.type = FilterType.TEXT;
          break;
      }

      if (row["Searchable"] === "YES") {
        options.searchable.push(col);
        rowMeta.searchable = true;
      }

      if (row["Display in Table"] === "YES" && row["Role"] !== "DOI") {
        options.displayTable.push(col);
      }

      if (row["Display in Popup"] === "YES") {
        options.displayPopup.push(col);
      }

      colData[col] = rowMeta;
      switch (row["Role"]) {
        case "DOI":
          options.doi = col;
          break;
        case "TITLE":
          options.title = col;
          break;
        default:
          break;
      }
    });

    resolve(metadata);
  });

  return p;
}

function setTypes(papers, metadata) {
  return new Promise((resolve, reject) => {
    const missingMetadata = papers.columns.filter((column) => metadata[0][column] === undefined);
    if (missingMetadata.length > 0) {
      reject("Columns missing metadata: " + missingMetadata.join(", "));
      return;
    }

    const columns = papers.columns.map((column) => [column, metadata[0][column].type]);

    papers.forEach((paper, i) => {
      paper.id = i;
      columns.forEach(([column, type]) => {
        switch(type) {
          case FilterType.TEXT:
            if (isNullish(paper[column])) {
              paper[column] = null;
            } else {
              paper[column] = paper[column].trim();
            }
            break;
          case FilterType.LIST:
            if (isNullish(paper[column])) {
              paper[column] = [];
              break;
            }

            paper[column] = paper[column].split(",").map((k) => k.trim()).filter((k) => !isNullish(k));
            break;
          case FilterType.BOOLEAN: {
            if (isNullish(paper[column])) {
              paper[column] = false;
              break;
            }

            if (!isNaN(paper[column])) {
              paper[column] = parseInt(paper[column], 10) !== 0;
              break;
            }

            const val = String(paper[column]).toLowerCase().trim();
            if (val === 'false' || val === 'no') {
              paper[column] = false;
              break;
            }

            paper[column] = !!paper[column];
            break;
          }
          case FilterType.NUMBER: {
            if (isNullish(paper[column])) {
              paper[column] = null;
            } else {
              paper[column] = parseFloat(paper[column]);
              if (isNaN(paper[column])) paper[column] = null;
            }
            break;
          }
          default:
            break;
        }
      });
    });;

    const res = [...papers];
    res.columns = columns;
    resolve(res);
    return;
  });
}

const stringCleanStart = ['a ', 'an ', 'the '];

function cleanStringFilter(str) {
  let res = String(str).trim().toLowerCase();
  
  for (let start of stringCleanStart) {
    if (res.startsWith(start)) {
      res = res.substring(start.length);
    }
  }

  res = res.replace(/^[^a-z0-9]+/, '');
  
  return res;
}

function ascendingComparator(a, b, orderBy, type) {
  let x = a[orderBy];
  let y = b[orderBy];

  switch(type) {
    case FilterType.TEXT:
      x = cleanStringFilter(x);
      y = cleanStringFilter(y);
      break;
    case FilterType.LIST:
      const la = a[orderBy].map(cleanStringFilter).sort();
      const lb = b[orderBy].map(cleanStringFilter).sort();

      for (let i = 0;; i += 1) {
        if (!la[i]) {
          if (!lb[i]) return 0;
          return -1;
        }

        if (!lb[i]) return 1;

        if (la[i] < lb[i]) return -1;
        if (la[i] > lb[i]) return 1;
      }
    default:
      break;
  }

  if (x < y) return -1;
  if (x > y) return 1;
  return 0;
}

function getComparator(orderAsc, orderBy, metadata) {
  if (orderBy === null) return (_a, _b) => 0;

  const type = metadata[orderBy].type;
  return (a, b) => (orderAsc ? 1 : -1) * ascendingComparator(a, b, orderBy, type)
}

const useStyles = makeStyles({
  paperRow: {
    cursor: "pointer",
  },
});

function App() {
  
  const classes = useStyles();
  const [metadata, setMetadata] = useState(defaultMetadata());
  const [origPapers, setOrigPapers] = useState([]);
  const [papers, setPapers] = useState([]);
  const [filters, setFilters] = useState({});
  const [columns, setColumns] = useState([]);

  // Stores the index + 1 of the open paper, or -(index + 1) of the last open
  // paper if none are open.
  const [openPaper, setOpenPaper] = useState(-1);
  const [orderAsc, setOrderAsc] = React.useState(true);
  const [orderBy, setOrderBy] = React.useState(null);
  //const loc = useLocation();

  useEffect(() => {
    // csv("https://docs.google.com/spreadsheets/d/e/2PACX-1vQ5mZ_Gq0HXt73A9r5fHLpQh9Cr10Q5PTjqsEGcvxgYwDDWikARdzmgFjl9_zwLnA/pub?output=csv")
    csv(METADATA_URL)
      .then(parseMetadata)
      .then((metadata) => {
        setMetadata(metadata);
        
        csv(DATA_URL)
          .then((data) => setTypes(data, metadata))
          .then(setOrigPapers)
          .catch((err) => console.error(err));
      })
      .catch((err) => console.error(err));

  }, []);

  useEffect(() => {
    setColumns(origPapers.columns || []);
    setFilters({ [SEARCH]: "" });
  }, [origPapers]);

  useEffect(() => {
    setOpenPaper(-1);
    if (!origPapers) return;

    let stringMatchPapers = origPapers;
    if (!isNullish(filters[SEARCH])) {
      const search = filters[SEARCH].toLowerCase();

      stringMatchPapers = origPapers.filter((paper) => {
        const matchedColumn = metadata[1].searchable.find((column) => {
          switch (metadata[0][column].type) {
            case FilterType.TEXT:
              if (isNullish(paper[column])) return false;
              return String(paper[column]).toLowerCase().includes(search);

            case FilterType.LIST: {
              if (paper[column] === undefined || paper[column] === null) return false;
              if (paper[column].length === 0) return false;

              const arrayMatch = paper[column].find((f) => f.toLowerCase().includes(search));
              return arrayMatch !== undefined;
            }

            default: {
              return false;
            }
          }
        });

        return matchedColumn !== undefined;
      });
    }

    const newPapers = stringMatchPapers.filter((paper) => {
      const failedColumn = columns.find(([column, _]) => {
        const control = metadata[0][column].control;

        if (control === UIControl.NONE) return false;

        if (filters[column] === null || filters[column] === undefined) return false;

        if (filters[column] === NONE) {
          return paper[column] !== null;
        }

        switch (control) {
          case UIControl.SLIDER: {
            if (paper[column] === undefined || paper[column] === null) return false;
            return paper[column] < filters[column][0] || paper[column] > filters[column][1];
          }

          case UIControl.OPTION: {
            return String(paper[column]).toLowerCase() !== filters[column].toLowerCase();
          }

          case UIControl.MULTIOPTION: {
            if (filters[column].length === 0) return false;

            const arrayMatch = paper[column].find((f) =>
              filters[column].map((fil) => fil.toLowerCase()).includes(f.toLowerCase()));
            return arrayMatch === undefined;
          }

          case UIControl.CHECKBOX: {
            if (filters[column] === true) {
              return paper[column] !== true;
            }
            return false;
          }

          default: {
            return false;
          }
        }
      });

      return failedColumn === undefined;
    });

    setPapers(newPapers);
  }, [filters, origPapers, columns, metadata]);

  const setFiltersDebounced = useMemo(() => debounce(setFilters, 200), [setFilters]);

  const loaded = papers.length > 0;
  
  

  return (
   
    <>
    <AppBar
      position="static"
      color="inherit"
      sx={{
        flexGrow: 1,
        marginLeft:0,
        marginBottom: 3,
        padding: 0.5,
        boxShadow:"none",
        borderBottom: "1px solid #e0e0e0",
      }}
    >
      <Toolbar variant="dense">
        <Link
      
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              '& *': { mr: 1, my: 0.5 },
            }}
          >
            
            <Typography variant="h6" sx={{marginLeft:-3, color:"black"}}>
            Accessibility Research Project
            </Typography>
          </Box>
        </Link>
        
      </Toolbar>
      <div className="App">
        <Button sx={{color:"black", fontFamily:"monospace", fontSize:"15px", fontWeight:"bold"}}>Home
        </Button>
        <Button sx={{color:"black", fontFamily:"monospace", fontSize:"15px", fontWeight:"bold"}}>Conferences
        </Button>
        <Button sx={{color:"black", fontFamily:"monospace", fontSize:"15px", fontWeight:"bold"}}> Guidelines
        </Button>
        <Button sx={{color:"black", fontFamily:"monospace", fontSize:"15px", fontWeight:"bold"}}>
          
      Contact
        </Button>
        </div>
    </AppBar>
      <Typography variant="h5" className='center' gutterBottom>
      Research Studies on Visualization Accessibility
      </Typography>
      <Typography variant="body" gutterBottom>
      We present a collection of papers published on visualization Accesibility for the past 
      20 years. These collections reflect on empirical, systematic literature reviews, user 
      studies research that have been published in top tier related conferences such as: CHI, 
      VIS, and significant others. We also present papers based on the target accessibility 
      users such as blind, low vision, visually impaired and sighted. You are welcome to explore.
      </Typography>
      <div style={{ height: 50, width: "85%", backgroundColor:"#FFFFFF" }}></div>
      {!loaded && <Box sx={{ display: 'flex', pt: 8}}  justifyContent="center">
        <CircularProgress />
      </Box>}
      {loaded && <>
        <Accordion TransitionProps={{ unmountOnExit: false }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            Filters
          </AccordionSummary>
          <AccordionDetails>
            <Masonry columns={{ xs: 1, md: 2 }} spacing={3}>
              {metadata[1].options.map((column) => (
                <OptionFilter
                  key={column}
                  papers={papers}
                  column={column}
                  setFilters={setFilters}
                />
              ))}
              {metadata[1].multioptions.map((column) => (
                <KeywordFilter
                  key={column}
                  papers={origPapers}
                  column={column}
                  setFilters={setFilters}
                />
              ))}
              {metadata[1].checkboxes.map((column) => (
                <CheckboxFilter
                  key={column}
                  column={column}
                  setFilters={setFilters}
                />
              ))}
              {metadata[1].sliders.map((column) => (
                <NumberFilter
                  key={column}
                  papers={origPapers}
                  column={column}
                  setFilters={setFiltersDebounced}
                />
              ))}
            </Masonry>
          </AccordionDetails>
        </Accordion>
        <Box sx={{ mx: 0, my: 2 }}>
          <StringFilter
            setFilters={setFiltersDebounced}
          />
        </Box>
        <Typography variant="hi6" gutterBottom sx={{color:"black", fontFamily:"monospace", fontSize:"20px", fontWeight:"bold"}}>
          Papers ({papers.length})
        </Typography>
        <Table sx={{color:"black", fontFamily:"monospace", fontSize:"20px", fontWeight:"150px"}}>
          <Paper 
            metadata={metadata}
            query={filters[SEARCH]}
            handleClose={() => setOpenPaper(openPaper * -1)}
            open={openPaper > 0}
            paper={papers[Math.abs(openPaper) - 1] ?? null}
          />
          <TableHead>
            <TableRow >
              {metadata[1].displayTable.map((column) => (<TableCell
                align="left"
                padding="normal"
                key={column}
                sx={{color:"black", fontFamily:"monospace", fontSize:"18px",fontWeight:"bold"}}
              >
                <TableSortLabel
                  active={orderBy === column}
                  direction={orderBy === column ? (orderAsc ? 'asc' : 'desc') : 'asc'}
                  onClick={() => {
                    setOrderBy((prevOrderBy) => {
                      if (prevOrderBy === column) {
                        setOrderAsc((prev) => !prev);
                      } else {
                        setOrderAsc(true);
                      }
                      return column;
                    });
                  }}
                >
                  {column}
                </TableSortLabel>
              </TableCell >))}
              <TableCell sx={{color:"black", fontFamily:"monospace", fontSize:"18px"}} />
            </TableRow>
          </TableHead>
          <TableBody sx={{color:"black", fontFamily:"monospace", fontSize:"18px"}} >
            {papers.sort(getComparator(orderAsc, orderBy, metadata[0])).map((paper, i) => (
              <TableRow
                hover
                key={paper.id}
                onClick={() => setOpenPaper(i + 1)}
                className={classes.paperRow}
                sx={{color:"black", fontFamily:"monospace"}}
              >
                {metadata[1].displayTable.map((column) => (<TableCell sx={{color:"black", fontFamily:"monospace", fontSize:"18px"}} key={column}>
                  {metadata[0][column].searchable
                    ? highlight(filters[SEARCH], String(paper[column]))
                    : paper[column]
                  }
                </TableCell>))}
                <TableCell>
                  {metadata[1].doi && paper[metadata[1].doi] && <IconButton
                    onClick={(e) => e.stopPropagation()}
                    aria-label='Open document in new tab'
                    sx={{color:"black", fontFamily:"monospace"}}
                    href={`https://doi.org/${paper[metadata[1].doi]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <LaunchIcon />
                  </IconButton>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </>}
    </>
  );
}



export default App;
