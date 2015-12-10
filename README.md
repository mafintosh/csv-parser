# csv-parser

Streaming CSV parser that aims for maximum speed as well as compatibility with the [csv-spectrum](https://npmjs.org/csv-spectrum) CSV acid test suite

```
npm install csv-parser
```

[![build status](http://img.shields.io/travis/mafintosh/csv-parser.svg?style=flat)](http://travis-ci.org/mafintosh/csv-parser)
![dat](http://img.shields.io/badge/Development%20sponsored%20by-dat-green.svg?style=flat)

`csv-parser` can convert CSV into JSON at at rate of around 90,000 rows per second (perf varies with data, try `bench.js` with your data).

## Usage

Simply instantiate `csv` and pump a csv file to it and get the rows out as objects

You can use `csv-parser` in the browser with [browserify](http://browserify.org/)

``` js
var csv = require('csv-parser')
var fs = require('fs')

fs.createReadStream('some-csv-file.csv')
  .pipe(csv())
  .on('data', function(data) {
    console.log('row', data)
  })
```

The data emitted is a normalized JSON object

The csv constructor accepts the following options as well

``` js
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

``` js
var stream = csv(['index', 'message'])

// Source from somewere with format 12312,Hello World
origin.pipe(stream)
  .on('data', function(data) {
    console.log(data) // Should output { "index": 12312, "message": "Hello World" }
  })
```

or in the option object as well

``` js
var stream = csv({
  raw: false,     // do not decode to utf-8 strings
  separator: ',', // specify optional cell separator
  quote: '"',     // specify optional quote character
  escape: '"',    // specify optional escape character (defaults to quote value)
  newline: '\n',  // specify a newline character
  headers: ['index', 'message'] // Specifing the headers
})
```

If you do not specify the headers, csv-parser will take the first line of the csv and treat it like the headers

## Command line tool

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

You can specify these CLI flags to control the JSON serialization output format

- `outputSeparator` - default `\n`, what to put between JSON items in the output
- `beforeOutput` - default empty, what to put at beginning of output
- `afterOutput` - default `\n`, what to put at end of output


For example, to produce an object with a JSON array of items as output:

```
--beforeOutput='{"items":[' --afterOutput=]} --outputSeparator=,
```

## License

MIT
