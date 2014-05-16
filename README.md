# csv-parser

Streaming csv parser inspired by binary-csv that aims to be faster than everyone else

	npm install csv-parser

## Usage

``` js
fs.createReadStream('some-csv-file.csv')
	.pipe(csv())
	.on('data', function(data) {
		console.log('row', data)
	})
```

## License

MIT