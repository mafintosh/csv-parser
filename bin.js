#!/usr/bin/env node

var minimist = require('minimist')
var ldjson = require('ldjson-stream')
var fs = require('fs')
var csv = require('./')

var argv = minimist(process.argv, {
  alias: {
    h: 'headers',
    v: 'version',
    o: 'output'
  },
  boolean: ['version']
})

var headers = argv.headers && argv.headers.toString().split(',')
var filename = argv._[2]

if (argv.version) {
  console.log(require('./package').version)
  process.exit(0)
}

if (!filename) {
  console.error(
    'Usage: csv-parser filename [options]\n\n'+
    '  Set filename to - to read from stdin\n\n'+
    '  --headers,-h   Explicitly specify csv headers as a comma separated list\n'+
    '  --output ,-o   Set output file. Defaults to stdout\n'+
    '  --version,-v   Print out the installed version\n'
  )
  process.exit(1)
}

var input
var output = (argv.output && argv.output !== '-') ? fs.createWriteStream(argv.output) : process.stdout

if (filename === '-') input = process.stdin
else if (fs.existsSync(filename)) input = fs.createReadStream(filename)
else {
  console.error('File: %s does not exist', filename)
  process.exit(2)
}

input.pipe(csv({headers:headers})).pipe(ldjson.serialize()).pipe(output)