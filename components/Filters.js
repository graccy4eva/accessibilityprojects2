import React, { useEffect, useMemo, useState } from "react";

import Autocomplete from "@mui/lab/Autocomplete";
import Checkbox from "@mui/material/Checkbox";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import InputAdornment from "@mui/material/InputAdornment";
import Slider from "@mui/material/Slider";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import SearchIcon from "@mui/icons-material/Search";

import { NONE, SEARCH } from "../utils/filter";

// Sort alphabetically, ignoring case.
function sortIKey([a, _a], [b, _b]) {
  return a.toLowerCase().localeCompare(b.toLowerCase());
}

export function NumberFilter(props) {
  const { papers, column, setFilters } = props;

  const minmax = useMemo(() => {
    const nonNullVals = papers
      .map((p) => p[column])
      .filter((p) => p !== null);

    return nonNullVals.reduce((minmax, val) => {
        if (val < minmax[0]) {
          minmax[0] = val;
        }

        if (val > minmax[1]) {
          minmax[1] = val;
        }

        return minmax;
    }, [nonNullVals[0], nonNullVals[1]])
  }, [papers, column]);

  const [value, setValue] = React.useState(minmax);

  useEffect(() => {
    setValue(minmax);
  }, [minmax]);

  return (
    <Grid container spacing={2}>
      <Grid item xs={3}>
        <Typography variant="body2">
          {column}
        </Typography>
      </Grid>
      <Grid item xs={1}>
        <Typography variant="body2">
          {minmax[0]}
        </Typography>
      </Grid>
      <Grid item xs={7}>
        <Slider
          getAriaLabel={() => column}
          value={value}
          min={minmax[0]}
          max={minmax[1]}
          onChange={(_ev, value) => {
            setValue(value);
            setFilters((f) => {
              if (f[column] && f[column].length === 2 && f[column][0] === value[0] && f[column][1] === value[1]) {
                return f;
              }

              return {...f, [column]: value};
            });
          }}
          valueLabelDisplay="auto"
        />
      </Grid>
      <Grid item xs={1}>
        <Typography variant="body2">
          {minmax[1]}
        </Typography>
      </Grid>
    </Grid>
  );
}

export function StringFilter(props) {
  const { setFilters, ...rest } = props;

  return <TextField
    {...rest}
    fullWidth
    label="Search"
    variant="outlined"
    InputProps={{
      startAdornment: <InputAdornment position="start">
        <SearchIcon />
      </InputAdornment>
    }}
    onChange={(ev) => {
      setFilters((f) => ({ ...f, [SEARCH]: ev.target.value }));
    }}
  />;
}

export function OptionFilter(props) {
  const { papers, column, setFilters } = props;
  
  const options = useMemo(() => {
    let nullCount = 0;
    const values = Object.values(papers.reduce((options, paper) => {
      if (paper[column] === null) {
        nullCount += 1;
        return options;
      }

      const key = paper[column].toLowerCase();
      const entry = options[key] || [paper[column], 0]
      entry[1] += 1;

      options[key] = entry;
      return options;
    }, {})).sort(sortIKey);

    if (nullCount > 0) values.push([NONE, nullCount]);
    return values;
  }, [papers, column]);

  return (
    <Autocomplete
      disablePortal
      autoHighlight
      clearOnEscape
      openOnFocus
      key={column}
      options={options}
      getOptionLabel={([option, freq]) => `${option === NONE ? "None" : option} (${freq})`}
      renderInput={(params) => <TextField {...params} variant="standard" label={column} />}
      onChange={(_ev, value) => {
        const v = (value ?? [null])[0];
        setFilters((f) => f[column] === v ? f : {...f, [column]: v});
      }}
    />
   );
}

export function KeywordFilter(props) {
  const { papers, column, setFilters } = props;

  const options = useMemo(() => {
    let nullCount = 0;

    const keywords = papers.flatMap((p) => p[column]);

    const values = Object.values(keywords.reduce((options, keyword) => {
      if (keyword === null) {
        nullCount += 1;
        return options;
      }

      const key = keyword.toLowerCase();
      const entry = options[key] || [keyword, 0]
      entry[1] += 1;

      options[key] = entry;
      return options;
    }, {})).sort(sortIKey);

    if (nullCount > 0) values.push([NONE, nullCount]);
    return values;
  }, [papers, column]);

  return (
    <Autocomplete
      disablePortal
      autoHighlight
      clearOnEscape
      openOnFocus
      multiple
      key={column}
      options={options}
      getOptionLabel={([option, freq]) => `${option === NONE ? "None" : option} (${freq})`}
      renderInput={(params) => <TextField {...params} variant="standard" label={column} />}
      onChange={(_ev, value) => {
        setFilters((f) => {
          if (f[column] && f[column].length === value.length) {
            return f;
          }
          return {...f, [column]: value.map(([o, _]) => o)}
        });
      }}
    />
  );
}

export function CheckboxFilter(props) {
  const { column, setFilters } = props;

  const [checkState, setCheckState] = useState(false);

  return (
    <FormGroup>
      <FormControlLabel control={<Checkbox
        checked={checkState}
        onClick={() => {
          setCheckState((prev) => {
            const check = !prev;
            setFilters((f) => ({ ...f, [column]: check ? true : null }));
            return check;
          });
        }}
      />} label={column} />
    </FormGroup>
  );
}
