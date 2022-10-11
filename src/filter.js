export const NONE = Symbol("none");
export const SEARCH = Symbol("search");

// Types of filters
export const FilterType = {
  BOOLEAN: 0,
  NUMBER: 1,
  STRING: 2, // deprecated
  TEXT: 2,
  LIST: 3,
}

export const UIControl = {
  NONE: 0,
  CHECKBOX: 1,
  SLIDER: 2,
  OPTION: 3,
  MULTIOPTION: 4,
}

export function highlight(query, text) {
  if (!query) return text;
  console.log(query);

  const fields = [];

  let unprocessed = text;
  let unprocessedLower = text.toLowerCase();
  const queryLower = query.toLowerCase();
  const queryLength = query.length;

  let index = unprocessedLower.indexOf(queryLower);
  let i = 0;
  for (; index >= 0; index = unprocessedLower.indexOf(queryLower)) {
    fields.push(unprocessed.substring(0, index));
    
    unprocessed = unprocessed.substring(index);
    fields.push(<span key={i++} style={{ backgroundColor: "yellow" }}>{unprocessed.substring(0, queryLength)}</span>);

    unprocessed = unprocessed.substring(queryLength);
    unprocessedLower = unprocessedLower.substring(index + queryLength);
  }
  fields.push(unprocessed);

  return fields;
}
