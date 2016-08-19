var test = require('tape')
var fs = require('fs')
var path = require('path')
var eol = require('os').EOL
var bops = require('bops')
var spectrum = require('csv-spectrum')
var concat = require('concat-stream')
var csv = require('..')
var read = fs.createReadStream

test('simple csv', function (t) {
  collect('dummy.csv', verify)
  function verify (err, lines) {
    t.false(err, 'no err')
    t.same(lines[0], {a: '1', b: '2', c: '3'}, 'first row')
    t.equal(lines.length, 1, '1 row')
    t.end()
  }
})

test('supports strings', function (t) {
  var parser = csv()

  parser.on('data', function (data) {
    t.same(data, {hello: 'world'})
    t.end()
  })

  parser.write('hello\n')
  parser.write('world\n')
  parser.end()
})

test('newlines in a cell', function (t) {
  collect('newlines.csv', verify)
  function verify (err, lines) {
    t.false(err, 'no err')
    t.same(lines[0], {a: '1', b: '2', c: '3'}, 'first row')
    t.same(lines[1], {a: 'Once upon ' + eol + 'a time', b: '5', c: '6'}, 'second row')
    t.same(lines[2], {a: '7', b: '8', c: '9'}, 'fourth row')
    t.equal(lines.length, 3, '3 rows')
    t.end()
  }
})

test('raw escaped quotes', function (t) {
  collect('escaped_quotes.csv', verify)
  function verify (err, lines) {
    t.false(err, 'no err')
    t.same(lines[0], {a: '1', b: 'ha "ha" ha'}, 'first row')
    t.same(lines[1], {a: '2', b: '""'}, 'second row')
    t.same(lines[2], {a: '3', b: '4'}, 'third row')
    t.equal(lines.length, 3, '3 rows')
    t.end()
  }
})

test('raw escaped quotes and newlines', function (t) {
  collect('quotes_and_newlines.csv', verify)
  function verify (err, lines) {
    t.false(err, 'no err')
    t.same(lines[0], {a: '1', b: 'ha ' + eol + '"ha" ' + eol + 'ha'}, 'first row')
    t.same(lines[1], {a: '2', b: ' ' + eol + '"" ' + eol}, 'second row')
    t.same(lines[2], {a: '3', b: '4'}, 'third row')
    t.equal(lines.length, 3, '3 rows')
    t.end()
  }
})

test('line with comma in quotes', function (t) {
  var headers = bops.from('a,b,c,d,e\n')
  var line = bops.from('John,Doe,120 any st.,"Anytown, WW",08123\n')
  var correct = JSON.stringify({a: 'John', b: 'Doe', c: '120 any st.', d: 'Anytown, WW', e: '08123'})
  var parser = csv()

  parser.write(headers)
  parser.write(line)
  parser.end()

  parser.once('data', function (data) {
    t.equal(JSON.stringify(data), correct)
    t.end()
  })
})

test('line with newline in quotes', function (t) {
  var headers = bops.from('a,b,c\n')
  var line = bops.from('1,"ha ' + eol + '""ha"" ' + eol + 'ha",3\n')
  var correct = JSON.stringify({a: '1', b: 'ha ' + eol + '"ha" ' + eol + 'ha', c: '3'})
  var parser = csv()

  parser.write(headers)
  parser.write(line)
  parser.end()

  parser.once('data', function (data) {
    t.equal(JSON.stringify(data), correct)
    t.end()
  })
})

test('cell with comma in quotes', function (t) {
  var headers = bops.from('a\n')
  var cell = bops.from('"Anytown, WW"\n')
  var correct = 'Anytown, WW'
  var parser = csv()

  parser.write(headers)
  parser.write(cell)
  parser.end()

  parser.once('data', function (data) {
    t.equal(data.a, correct)
    t.end()
  })
})

test('cell with newline', function (t) {
  var headers = bops.from('a\n')
  var cell = bops.from('"why ' + eol + 'hello ' + eol + 'there"\n')
  var correct = 'why ' + eol + 'hello ' + eol + 'there'
  var parser = csv()

  parser.write(headers)
  parser.write(cell)
  parser.end()

  parser.once('data', function (data) {
    t.equal(data.a, correct)
    t.end()
  })
})

test('cell with escaped quote in quotes', function (t) {
  var headers = bops.from('a\n')
  var cell = bops.from('"ha ""ha"" ha"\n')
  var correct = 'ha "ha" ha'
  var parser = csv()

  parser.write(headers)
  parser.write(cell)
  parser.end()

  parser.once('data', function (data) {
    t.equal(data.a, correct)
    t.end()
  })
})

test('cell with multibyte character', function (t) {
  var headers = bops.from('a\n')
  var cell = bops.from('this ʤ is multibyte\n')
  var correct = 'this ʤ is multibyte'
  var parser = csv()

  parser.write(headers)
  parser.write(cell)
  parser.end()

  parser.once('data', function (data) {
    t.equal(data.a, correct, 'multibyte character is preserved')
    t.end()
  })
})

test('geojson', function (t) {
  collect('test_geojson.csv', verify)
  function verify (err, lines) {
    t.false(err, 'no err')
    var lineObj = {
      type: 'LineString',
      coordinates: [
        [102.0, 0.0],
        [103.0, 1.0],
        [104.0, 0.0],
        [105.0, 1.0]
      ]
    }
    t.same(JSON.parse(lines[1].geojson), lineObj, 'linestrings match')
    t.end()
  }
})

test('empty_columns', function (t) {
  collect('empty_columns.csv', ['a', 'b', 'c'], verify)
  function verify (err, lines) {
    t.false(err, 'no err')
    function testLine (row) {
      t.equal(Object.keys(row).length, 3, 'Split into three columns')
      t.ok(/^2007-01-0\d$/.test(row.a), 'First column is a date')
      t.ok(row.b !== undefined, 'Empty column is in line')
      t.equal(row.b.length, 0, 'Empty column is empty')
      t.ok(row.c !== undefined, 'Empty column is in line')
      t.equal(row.c.length, 0, 'Empty column is empty')
    }
    lines.forEach(testLine)
    t.end()
  }
})

test('csv-spectrum', function (t) {
  spectrum(function (err, data) {
    if (err) throw err
    var pending = data.length
    data.map(function (d) {
      var parser = csv()
      var collector = concat(function (objs) {
        var expected = JSON.parse(d.json)
        t.same(objs, expected, d.name)
        done()
      })
      parser.pipe(collector)
      parser.write(d.csv)
      parser.end()
    })
    function done () {
      pending--
      if (pending === 0) t.end()
    }
  })
})

test('custom newline', function (t) {
  collect('custom-newlines.csv', {newline: 'X'}, verify)
  function verify (err, lines) {
    t.false(err, 'no err')
    t.same(lines[0], {a: '1', b: '2', c: '3'}, 'first row')
    t.same(lines[1], {a: 'X-Men', b: '5', c: '6'}, 'second row')
    t.same(lines[2], {a: '7', b: '8', c: '9'}, 'third row')
    t.equal(lines.length, 3, '3 rows')
    t.end()
  }
})

test('optional strict', function (t) {
  collect('test_strict.csv', {strict: true}, verify)
  function verify (err, lines) {
    t.equal(err.message, 'Row length does not match headers', 'strict row length')
    t.same(lines[0], {a: '1', b: '2', c: '3'}, 'first row')
    t.same(lines[1], {a: '4', b: '5', c: '6'}, 'second row')
    t.equal(lines.length, 2, '2 rows before error')
    t.end()
  }
})

test('custom quote character', function (t) {
  collect('custom_quote_character.csv', {quote: '\''}, verify)
  function verify (err, lines) {
    t.false(err, 'no err')
    t.same(lines[0], {a: '1', b: 'some value', c: '2'}, 'first row')
    t.same(lines[1], {a: '3', b: '4', c: '5'}, 'second row')
    t.equal(lines.length, 2, '2 rows')
    t.end()
  }
})

test('custom escape character', function (t) {
  collect('custom_escape_character.csv', {escape: '\\'}, verify)
  function verify (err, lines) {
    t.false(err, 'no err')
    t.same(lines[0], {a: '1', b: 'some "escaped" value', c: '2'}, 'first row')
    t.same(lines[1], {a: '3', b: '""', c: '4'}, 'second row')
    t.same(lines[2], {a: '5', b: '6', c: '7'}, 'third row')
    t.equal(lines.length, 3, '3 rows')
    t.end()
  }
})

test('custom quote and escape character', function (t) {
  collect('custom_quote_and_escape_character.csv', {quote: "'", escape: '\\'}, verify)
  function verify (err, lines) {
    t.false(err, 'no err')
    t.same(lines[0], {a: '1', b: "some 'escaped' value", c: '2'}, 'first row')
    t.same(lines[1], {a: '3', b: "''", c: '4'}, 'second row')
    t.same(lines[2], {a: '5', b: '6', c: '7'}, 'third row')
    t.equal(lines.length, 3, '3 rows')
    t.end()
  }
})

test('custom quote character with default escaped value', function (t) {
  collect('custom_quote_character_default_escape.csv', {quote: '\''}, verify)
  function verify (err, lines) {
    t.false(err, 'no err')
    t.same(lines[0], {a: '1', b: "some 'escaped' value", c: '2'}, 'first row')
    t.same(lines[1], {a: '3', b: "''", c: '4'}, 'second row')
    t.same(lines[2], {a: '5', b: '6', c: '7'}, 'third row')
    t.equal(lines.length, 3, '3 rows')
    t.end()
  }
})

test('process all rows', function (t) {
  collect('process_all_rows.csv', {}, verify)
  function verify (err, lines) {
    t.false(err, 'no err')
    t.equal(lines.length, 7268, '7268 rows')
    t.end()
  }
})

test('skip columns a and c', function (t) {
  collect('dummy.csv', {mapHeaders: mapHeaders}, verify)
  function mapHeaders (name, i) {
    if (['a', 'c'].indexOf(name) > -1) {
      return null
    }
    return name
  }
  function verify (err, lines) {
    t.false(err, 'no err')
    t.same(lines[0], {b: '2'}, 'first row')
    t.equal(lines.length, 1, '1 row')
    t.end()
  }
})

test('rename columns', function (t) {
  collect('dummy.csv', {mapHeaders: mapHeaders}, verify)
  function mapHeaders (name, i) {
    var headers = {a: 'x', b: 'y', c: 'z'}
    return headers[name]
  }
  function verify (err, lines) {
    t.false(err, 'no err')
    t.same(lines[0], {x: '1', y: '2', z: '3'}, 'first row')
    t.equal(lines.length, 1, '1 row')
    t.end()
  }
})

// helpers

function fixture (name) {
  return path.join(__dirname, 'data', name)
}

function collect (file, opts, cb) {
  if (typeof opts === 'function') return collect(file, null, opts)
  var data = read(fixture(file))
  var lines = []
  var parser = csv(opts)
  data.pipe(parser)
    .on('data', function (line) {
      lines.push(line)
    })
    .on('error', function (err) { cb(err, lines) })
    .on('end', function () { cb(false, lines) })
  return parser
}
