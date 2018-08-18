#!/usr/bin/env node

const { createReadStream } = require('fs')
const { basename } = require('path')
const globby = require('globby')
const chalk = require('chalk')
const table = require('text-table')
const strip = require('strip-ansi')

const csv = require('../')

const run = async () => {
  const paths = await globby(['test/data/*.csv'])
  const rows = []
  let rowsParsed = 0

  for (const path of paths) {
    await new Promise((resolve) => {
      const now = Date.now()
      createReadStream(path)
        .pipe(csv())
        .on('data', (line) => {
          rowsParsed++
        })
        .on('end', () => {
          const duration = Date.now() - now
          const color = duration <= 10 ? 'green' : (duration > 100 ? 'red' : 'yellow')
          const fileName = chalk.blue(basename(path))
          rows.push(['', fileName, rowsParsed, chalk[color](`${duration}ms`)])
          resolve()
        })
    })
  }

  rows.unshift(['', 'Filename', 'Rows Parsed', 'Duration'].map(h => chalk.dim.underline(h)))

  const results = table(rows, {
    align: [ 'l', 'l', 'r', 'r' ],
    stringLength (str) {
      return strip(str).length
    }
  })

  console.log(`\n${results}`)
}

run()
