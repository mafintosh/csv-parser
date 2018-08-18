#!/usr/bin/env node

const fs = require('fs')
const csv = require('../')

const now = Date.now()
const [,, fileName] = process.argv
let rows = 0

fs.createReadStream(fileName || '/tmp/tmp.csv')
  .pipe(csv())
  .on('data', (line) => {
    rows++
  })
  .on('end', () => {
    console.log(`${fileName}: parsed ${rows} rows in ${Date.now() - now} ms`)
  })
