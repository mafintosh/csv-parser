var csv = require('../..')
var fs = require('fs')

/* start example */
fs.createReadStream('example/some-csv-file.csv')
  .pipe(csv())
  .on('headers', function (headerList) {
    console.log('First header: %s', headerList[0])
  })
/* end example */
