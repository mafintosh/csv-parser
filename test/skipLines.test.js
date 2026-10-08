const test = require('ava')
const csv = require('..')

const { collect } = require('./helpers/helper')

test.cb('skip lines', (t) => {
  const verify = (err, lines) => {
    t.false(err, 'no err')
    t.is(lines.length, 1, '1 row')
    t.is(JSON.stringify(lines[0]), JSON.stringify({ yes: 'ok', yup: 'ok', yeah: 'ok!' }))
    t.end()
  }

  collect('bad-data', { skipLines: 2 }, verify)
})

test.cb('skip lines with headers', (t) => {
  const verify = (err, lines) => {
    t.false(err, 'no err')
    t.is(lines.length, 2, '2 rows')
    t.is(JSON.stringify(lines[0]), JSON.stringify({ s: 'yes', p: 'yup', h: 'yeah' }))
    t.is(JSON.stringify(lines[1]), JSON.stringify({ s: 'ok', p: 'ok', h: 'ok!' }))
    t.end()
  }

  collect('bad-data', { headers: ['s', 'p', 'h'], skipLines: 2 }, verify)
})

for (const chunkSize of [1, 64]) {
  test(`skip lines before converting values in ${chunkSize} byte chunks (#222)`, async (t) => {
    const input = Buffer.from('id,timestamp\r\none,100\r\ntwo,200')
    const chunks = []
    const values = []
    for (let start = 0; start < input.length; start += chunkSize) {
      chunks.push(input.slice(start, start + chunkSize))
    }
    const rows = await parse(chunks, {
      headers: ['id', 'timestamp'],
      skipLines: 1,
      mapValues: ({ header, value }) => {
        values.push(value)
        if (header === 'timestamp') {
          if (!/^\d+$/.test(value)) throw new Error('Invalid timestamp')
          return Number(value)
        }
        return value
      }
    })
    t.deepEqual(rows, [{ id: 'one', timestamp: 100 }, { id: 'two', timestamp: 200 }])
    t.deepEqual(values, ['one', '100', 'two', '200'])
  })
}

test('skip lines before mapping values without headers', async (t) => {
  const values = []
  const rows = await parse(['discard,me\n1,2,\n'], {
    headers: false,
    skipLines: 1,
    mapValues: ({ value }) => {
      values.push(value)
      return value.toUpperCase()
    }
  })
  t.deepEqual(rows, [{ 0: '1', 1: '2', 2: '' }])
  t.deepEqual(values, ['1', '2', ''])
})

test('skip multiline records before inferring headers and mapping values', async (t) => {
  const headers = []
  const values = []
  const rows = await parse(['"discard\nthis",record\nname,count\none,2\n'], {
    skipLines: 1,
    strict: true,
    mapHeaders: ({ header }) => {
      headers.push(header)
      return header.toUpperCase()
    },
    mapValues: ({ header, value }) => {
      values.push([header, value])
      return value
    }
  })
  t.deepEqual(headers, ['name', 'count'])
  t.deepEqual(values, [['NAME', 'one'], ['COUNT', '2']])
  t.deepEqual(rows, [{ NAME: 'one', COUNT: '2' }])
})

test('skip comments and lines before mapping values with byte offsets', async (t) => {
  const values = []
  const prefix = '# comment\ndiscard,me\n# another comment\n'
  const rows = await parse([prefix, 'one,two\n'], {
    headers: ['a', 'b'],
    skipComments: true,
    skipLines: 1,
    outputByteOffset: true,
    mapValues: ({ value }) => {
      values.push(value)
      return value.toUpperCase()
    }
  })
  t.deepEqual(values, ['one', 'two'])
  t.deepEqual(rows, [{ row: { a: 'ONE', b: 'TWO' }, byteOffset: Buffer.byteLength(prefix) }])
})

test('skip the final record without mapping values', async (t) => {
  const rows = await parse(['discard,me'], {
    headers: ['a', 'b'],
    skipLines: 1,
    mapValues: () => {
      t.fail('Skipped values should not be mapped')
    }
  })
  t.deepEqual(rows, [])
})

function parse (chunks, options) {
  return new Promise((resolve, reject) => {
    const rows = []
    const parser = csv(options)
    parser.on('data', (row) => rows.push(row))
    parser.on('error', reject)
    parser.on('end', () => resolve(rows))
    for (const chunk of chunks) parser.write(chunk)
    parser.end()
  })
}
