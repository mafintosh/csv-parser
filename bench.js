const fs = require('fs')
const csv = require('./')

const now = Date.now()
let rows = 0

fs.createReadStream(process.argv[2] || '/tmp/tmp.csv')
  .pipe(csv())
  .on('data', (line) => {
    rows++
  })
  .on('end', () => {
    console.log(`parsed ${rows} rows in ${Date.now() - now} ms`)
  })
