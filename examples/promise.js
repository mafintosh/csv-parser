var parseCSV = require('../promise')
var path = require('path')
var fs = require('fs')

parseCSV(fs.createReadStream(path.join(__dirname, '../test/data/dummy.csv')))
  .then(console.log)

parseCSV(`a,b,c
1,2,3
`)
  .then(console.log)
