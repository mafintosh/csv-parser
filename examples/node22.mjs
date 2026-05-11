import fs from 'node:fs'
import path from 'node:path'

import csv from '../index.js'

async function readCSV (file) {
  return Array.fromAsync(fs.createReadStream(file).pipe(csv()))
}

const results = await readCSV(path.join(import.meta.dirname, '../test/fixtures/basic.csv'))

console.log(results)
