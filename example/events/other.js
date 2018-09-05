var csv = require('../..')
var fs = require('fs')

/* start example */
fs.createReadStream('example/some-csv-file.csv')
  .pipe(csv())
  .on('data', function (data) {
    // Process row
    console.log('data event')
  })
  .on('end', function () {
    // We are done
    console.log('end event')
  })
/* end example */
