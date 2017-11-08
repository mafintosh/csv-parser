var parseCSV = require('../promise')
var path = require('path')
var fs = require('fs')

parseCSV(fs.createReadStream(path.join(__dirname, '../test/data/dummy.csv')))
  .then(console.log)
