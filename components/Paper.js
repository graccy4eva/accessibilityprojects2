import React from "react";

import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Typography from "@mui/material/Typography";

import { highlight, FilterType } from "../utils/filter";

// Convert lines or an array of strings into lines separated by <br />.
function lines(query, lines) {
  const splitLines = (Array.isArray(lines) ? lines: [String(lines)])
    .flatMap((l) => l.split("\n")).map((l) => l.trim());
  const last = splitLines.length - 1;
  return splitLines.flatMap((l, i) => [
    highlight(query, l), i === last ? null : <br key={i} />
  ]);
}

function formatField(query, type, value) {
  switch(type) {
    case FilterType.NUMBER:
    case FilterType.STRING:
      return lines(query, value || "N/A");
    case FilterType.LIST:
      if (value.length > 0) {
        return lines(query, value.map((v) => '- ' + v));
      }
      return "None";
    case FilterType.BOOLEAN:
      return value ? "True" : "False";
    default:
      return null;
  }
}

function Paper(props) {
  const { metadata, query, handleClose, open, paper } = props;

  if (paper === null) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="dialog-title"
    >
      <DialogTitle id="dialog-title">
        {highlight(query, paper[metadata[1].title])}
      </DialogTitle>
      <DialogContent>
        {metadata[1].displayPopup.map((column) => {
          if (column === metadata[1].title) return null;
          if (column === metadata[1].doi) return null;

          const type = metadata[0][column].type;

          // Only highlight if the field is searchable.
          const queryGuarded = metadata[0][column].searchable && query;

          return (
            <React.Fragment key={column}>
              <Typography variant="h6">
                {column}
              </Typography>
              <Typography variant="body1" gutterBottom>
                {formatField(queryGuarded, type, paper[column])}
              </Typography>
            </React.Fragment>
          );
        })}
      </DialogContent>
      <DialogActions>
        {metadata[1].doi && paper[metadata[1].doi] && <Button
          href={`https://doi.org/${paper[metadata[1].doi]}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          View Paper
        </Button>}
        <Button onClick={handleClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default Paper;
