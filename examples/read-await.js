const parse = require('../')
const path = require('path')
const fs = require('fs')

void (async () => {
  const s = fs.createReadStream(path.join(__dirname, '../test/data/dummy.csv')).pipe(parse())
  const rows = []
  for await (const row of s) rows.push(row)
  console.log(rows)
})()
  .catch(console.error)
