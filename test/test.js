const path = require('path')

const test = require('ava')
const bops = require('bops')
const spectrum = require('csv-spectrum')
const concat = require('concat-stream')
const execa = require('execa')

const csv = require('..')

const { collect } = require('./helpers/helper')

const eol = '\n'

test.cb('simple csv', (t) => {
  const verify = (err, lines) => {
    t.false(err, 'no err')
    t.snapshot(lines[0], 'first row')
    t.is(lines.length, 1, '1 row')
    t.end()
  }

  collect('basic', verify)
})

test.cb('supports strings', (t) => {
  const parser = csv()

  parser.on('data', (data) => {
    t.snapshot(data)
    t.end()
  })

  parser.write('hello\n')
  parser.write('world\n')
  parser.end()
})

test.cb('newlines in a cell', (t) => {
  const verify = (err, lines) => {
    t.false(err, 'no err')
    t.snapshot(lines[0], 'first row')
    t.snapshot(lines[1], 'second row')
    t.snapshot(lines[2], 'fourth row')
    t.is(lines.length, 3, '3 rows')
    t.end()
  }

  collect('newlines', verify)
})

test.cb('raw escaped quotes', (t) => {
  const verify = (err, lines) => {
    t.false(err, 'no err')
    t.snapshot(lines[0], 'first row')
    t.snapshot(lines[1], 'second row')
    t.snapshot(lines[2], 'third row')
    t.is(lines.length, 3, '3 rows')
    t.end()
  }

  collect('escape-quotes', verify)
})

test.cb('raw escaped quotes and newlines', (t) => {
  const verify = (err, lines) => {
    t.false(err, 'no err')
    t.snapshot(lines[0], 'first row')
    t.snapshot(lines[1], 'second row')
    t.snapshot(lines[2], 'third row')
    t.is(lines.length, 3, '3 rows')
    t.end()
  }

  collect('quotes+newlines', verify)
})

test.cb('line with comma in quotes', (t) => {
  const headers = bops.from('a,b,c,d,e\n')
  const line = bops.from('John,Doe,120 any st.,"Anytown, WW",08123\n')
  const correct = JSON.stringify({
    a: 'John',
    b: 'Doe',
    c: '120 any st.',
    d: 'Anytown, WW',
    e: '08123'
  })
  const parser = csv()

  parser.write(headers)
  parser.write(line)
  parser.end()

  parser.once('data', (data) => {
    t.is(JSON.stringify(data), correct)
    t.end()
  })
})

test.cb('line with newline in quotes', (t) => {
  const headers = bops.from('a,b,c\n')
  const line = bops.from(`1,"ha ${eol}""ha"" ${eol}ha",3\n`)
  const correct = JSON.stringify({ a: '1', b: `ha ${eol}"ha" ${eol}ha`, c: '3' })
  const parser = csv()

  parser.write(headers)
  parser.write(line)
  parser.end()

  parser.once('data', (data) => {
    t.is(JSON.stringify(data), correct)
    t.end()
  })
})

test.cb('cell with comma in quotes', (t) => {
  const headers = bops.from('a\n')
  const cell = bops.from('"Anytown, WW"\n')
  const correct = 'Anytown, WW'
  const parser = csv()

  parser.write(headers)
  parser.write(cell)
  parser.end()

  parser.once('data', (data) => {
    t.is(data.a, correct)
    t.end()
  })
})

test.cb('cell with newline', (t) => {
  const headers = bops.from('a\n')
  const cell = bops.from(`"why ${eol}hello ${eol}there"\n`)
  const correct = `why ${eol}hello ${eol}there`
  const parser = csv()

  parser.write(headers)
  parser.write(cell)
  parser.end()

  parser.once('data', (data) => {
    t.is(data.a, correct)
    t.end()
  })
})

test.cb('cell with escaped quote in quotes', (t) => {
  const headers = bops.from('a\n')
  const cell = bops.from('"ha ""ha"" ha"\n')
  const correct = 'ha "ha" ha'
  const parser = csv()

  parser.write(headers)
  parser.write(cell)
  parser.end()

  parser.once('data', (data) => {
    t.is(data.a, correct)
    t.end()
  })
})

test.cb('cell with multibyte character', (t) => {
  const headers = bops.from('a\n')
  const cell = bops.from('this ʤ is multibyte\n')
  const correct = 'this ʤ is multibyte'
  const parser = csv()

  parser.write(headers)
  parser.write(cell)
  parser.end()

  parser.once('data', (data) => {
    t.is(data.a, correct, 'multibyte character is preserved')
    t.end()
  })
})

test.cb('geojson', (t) => {
  const verify = (err, lines) => {
    t.false(err, 'no err')
    const lineObj = {
      type: 'LineString',
      coordinates: [[102.0, 0.0], [103.0, 1.0], [104.0, 0.0], [105.0, 1.0]]
    }
    t.deepEqual(JSON.parse(lines[1].geojson), lineObj, 'linestrings match')
    t.end()
  }

  collect('geojson', verify)
})

test.cb('empty columns', (t) => {
  const verify = (err, lines) => {
    t.false(err, 'no err')
    function testLine (row) {
      t.is(Object.keys(row).length, 3, 'Split into three columns')
      t.truthy(/^2007-01-0\d$/.test(row.a), 'First column is a date')
      t.truthy(row.b !== undefined, 'Empty column is in line')
      t.is(row.b.length, 0, 'Empty column is empty')
      t.truthy(row.c !== undefined, 'Empty column is in line')
      t.is(row.c.length, 0, 'Empty column is empty')
    }
    lines.forEach(testLine)
    t.end()
  }

  collect('empty-columns', ['a', 'b', 'c'], verify)
})

test.cb('csv-spectrum', (t) => {
  spectrum((err, data) => {
    if (err) throw err
    let pending = data.length
    data.map((d) => {
      const parser = csv()
      const collector = concat((objs) => {
        t.snapshot(objs, d.name)
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

test.cb('process all rows', (t) => {
  const verify = (err, lines) => {
    t.false(err, 'no err')
    t.is(lines.length, 7268, '7268 rows')
    t.end()
  }

  collect('large-dataset', {}, verify)
})

test('binary stanity', async (t) => {
  const binPath = path.resolve(__dirname, '../bin/csv-parser')
  const { stdout } = await execa(`echo "a\n1" | ${process.execPath} ${binPath}`, { shell: true })

  t.snapshot(stdout)
})
