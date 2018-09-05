/* eslint-disable no-unused-vars */
var csv = require('..')

/* start example */
var stream = csv({
  raw: false,     // do not decode to utf-8 strings
  separator: ',', // specify optional cell separator
  quote: '"',     // specify optional quote character
  escape: '"',    // specify optional escape character (defaults to quote value)
  newline: '\n',  // specify a newline character
  strict: true    // require column length match headers length
})
/* end example */
