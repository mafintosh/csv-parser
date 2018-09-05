var csv = require('..')
var fs = require('fs')

fs.createReadStream('example/some-csv-file.csv')
  .pipe(csv())
  .on('data', function (data) {
    console.log('Name: %s Age: %s', data.NAME, data.AGE)
  })
