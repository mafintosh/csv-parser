# csv-parser

Streaming csv parser inspired by binary-csv that aims to be faster than everyone else.

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
  raw: false,    // do not decode to utf-8 strings
  separator: ',' // specify optional cell separator
})
```

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

## License

MIT
