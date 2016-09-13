#!/usr/bin/env node
require('exit-on-epipe')
var ArgumentParser = require('argparse').ArgumentParser
var csv = require('./')
var ndj = require('ndjson')
var packageInfo = require('./package')

var argparser = new ArgumentParser({
  addHelp: true,
  description: packageInfo.description + ' CSV is read from STDIN, formatted' +
  ' to JSON, and written to STDOUT.',
  version: packageInfo.version
})

argparser.addArgument(['-s', '--separator'], {
  help: "The separator character to use. Defaults to ','.",
  defaultValue: ','
})
argparser.addArgument(['-q', '--quote'], {
  help: "The quote character to use. Defaults to '\"'.",
  defaultValue: '"'
})
argparser.addArgument(['-e', '--escape'], {
  help: 'The escape character to use. Defaults to QUOTE.'
})
argparser.addArgument(['--headers'], {
  nargs: '+',
  help: 'The list of headers to use. If omitted, the keys of the first row ' +
  'written to STDIN will be used'
})
argparser.addArgument(['--remove'], {
  nargs: '+',
  help: 'The list of headers to remove from output. If omitted, all columns' +
  'will be parsed.'
})
argparser.addArgument(['--strict'], {
  action: 'storeTrue',
  help: 'Require that column length matches headers length.',
  defaultValue: false
})

var args = argparser.parseArgs()

if (args.escape === null) {
  args.escape = args.quote
}

var removedHeaders = args.remove
delete args.remove
if (removedHeaders) {
  args.mapHeaders = function (name, i) {
    return removedHeaders.indexOf(name) === -1 ? name : null
  }
}

process.stdin
  .pipe(csv(args))
  .pipe(ndj.serialize())
  .pipe(process.stdout)
