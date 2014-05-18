# csv-parser

Streaming csv parser inspired by binary-csv that aims to be faster than everyone else

	npm install csv-parser

[![build status](http://img.shields.io/travis/mafintosh/csv-parser.svg?style=flat)](http://travis-ci.org/mafintosh/csv-parser)
![dat](http://img.shields.io/badge/Development%20sponsored%20by-dat-green.svg?style=flat)

## Usage

``` js
fs.createReadStream('some-csv-file.csv')
	.pipe(csv())
	.on('data', function(data) {
		console.log('row', data)
	})
```

The data emitted is a normalized JSON object

## License

MIT