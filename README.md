# csv-parser

Streaming CSV parser that aims for maximum speed as well as compatibility with the [csv-spectrum](https://npmjs.org/csv-spectrum) CSV acid test suite

```
npm install csv-parser
```

[![build status](http://img.shields.io/travis/mafintosh/csv-parser.svg?style=flat)](http://travis-ci.org/mafintosh/csv-parser)
![dat](http://img.shields.io/badge/Development%20sponsored%20by-dat-green.svg?style=flat)

`csv-parser` can convert CSV into JSON at at rate of around 90,000 rows per second (perf varies with data, try `bench.js` with your data).

## Table Of Contents

- [Table Of Contents](#table-of-contents)
- [Usage](#usage)
- [Events](#events)
  * [data](#data)
  * [headers](#headers)
  * [Other Readable Stream Events](#other-readable-stream-events)
- [Command Line Tool](#command-line-tool)
  * [Options](#options)
- [Related](#related)
- [License](#license)

## Usage

Simply instantiate `csv` and pump a csv file to it and get the rows out as objects

You can use `csv-parser` in the browser with [browserify](http://browserify.org/)

Let's say that you have a CSV file ``some-csv-file.csv`` like this:

```csv
NAME,AGE
Daffy Duck,24
Bugs Bunny,22
```

You can parse it like this:

```js
var csv = require('csv-parser')
var fs = require('fs')

fs.createReadStream('example/some-csv-file.csv')
  .pipe(csv())
  .on('data', function (data) {
    console.log('Name: %s Age: %s', data.NAME, data.AGE)
  })
```

```
Name: Daffy Duck Age: 24
Name: Bugs Bunny Age: 22
```

The data emitted is a normalized JSON object. Each header is used as the property name of the object.

The csv constructor accepts the following options as well

```js
var stream = csv({
  raw: false,     // do not decode to utf-8 strings
  separator: ',', // specify optional cell separator
  quote: '"',     // specify optional quote character
  escape: '"',    // specify optional escape character (defaults to quote value)
  newline: '\n',  // specify a newline character
  strict: true    // require column length match headers length
})
```

It accepts too an array, that specifies the headers for the object returned:

```js
var stream = csv(['index', 'message'])

// Source from somewhere with format 12312,Hello World
origin.pipe(stream)
  .on('data', function (data) {
    console.log(data)
  })
```

```
Row { index: '12312', message: 'Hello World' }
```

or in the option object as well

```js
var stream = csv({
  raw: false,     // do not decode to utf-8 strings
  separator: ',', // specify optional cell separator
  quote: '"',     // specify optional quote character
  escape: '"',    // specify optional escape character (defaults to quote value)
  newline: '\n',  // specify a newline character
  headers: ['index', 'message'] // Specifying the headers
})
```

If you do not specify the headers, csv-parser will take the first line of the csv and treat it like the headers.

Another issue might be the encoding of the source file. Transcoding the source stream can be done neatly with something like [`iconv-lite`](https://www.npmjs.com/package/iconv-lite), Node bindings to [`iconv`](https://www.npmjs.com/package/iconv) or native [`iconv`](http://man7.org/linux/man-pages/man1/iconv.1.html) if part of a pipeline.

## Events

The following events are emitted during parsing.

### data

For each row parsed (except the header), this event is emitted. This is already discussed above.

### headers

After the header row is parsed this event is emitted. An array of header names is supplied as the payload.

```js
fs.createReadStream('example/some-csv-file.csv')
  .pipe(csv())
  .on('headers', function (headerList) {
    console.log('First header: %s', headerList[0])
  })
```

```
First header: NAME
```

### Other Readable Stream Events

The usual [Readable stream](https://nodejs.org/api/stream.html#stream_class_stream_readable) events are also emitted. Use the ``close`` event to detect the end of parsing.

```js
fs.createReadStream('example/some-csv-file.csv')
  .pipe(csv())
  .on('data', function (data) {
    // Process row
    console.log('data event')
  })
  .on('end', function () {
    // We are done
    console.log('end event')
  })
```

```
data event
data event
end event
```

## Command Line Tool

There is also a command line tool available. It will convert csv to line delimited JSON.

```
npm install -g csv-parser
```

Open a shell and run

```
$ csv-parser --help # prints all options
$ printf "a,b\nc,d\n" | csv-parser # parses input
```

### Options

You can specify these CLI flags to control how the input is parsed:

```
Usage: csv-parser [filename?] [options]

  --headers,-h        Explicitly specify csv headers as a comma separated list
  --output,-o         Set output file. Defaults to stdout
  --separator,-s      Set the separator character ("," by default)
  --quote,-q          Set the quote character ('"' by default)
  --escape,-e         Set the escape character (defaults to quote value)
  --strict            Require column length match headers length
  --version,-v        Print out the installed version
  --remove            Remove headers from output
  --help              Show this help
```

For example, to parse a TSV file:

```
cat data.tsv | csv-parser -s $'\t'
```

## Related

- [neat-csv](https://github.com/sindresorhus/neat-csv) - Promise convenience wrapper

## License

MIT