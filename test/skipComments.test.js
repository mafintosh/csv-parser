const test = require('ava')

const csv = require('..')
const { collect } = require('./helpers/helper')

test.cb('comment', (t) => {
  const verify = (err, lines) => {
    t.false(err, 'no err')
    t.snapshot(lines)
    t.is(lines.length, 1, '1 row')
    t.end()
  }

  collect('comment', { skipComments: true }, verify)
})

test.cb('custom comment', (t) => {
  const verify = (err, lines) => {
    t.false(err, 'no err')
    t.snapshot(lines)
    t.is(lines.length, 1, '1 row')
    t.end()
  }

  collect('option-comment', { skipComments: '~' }, verify)
})

function parseChunks (chunks, options) {
  return new Promise((resolve, reject) => {
    const rows = []
    const parser = csv(options)
    parser.on('data', row => rows.push(row))
    parser.on('error', reject)
    parser.on('end', () => resolve(rows))
    for (const chunk of chunks) parser.write(chunk)
    parser.end()
  })
}

for (const example of [
  {
    name: 'before headers',
    input: '# unmatched " quote\nname,value\nalice,1\n',
    options: { skipComments: true }
  },
  {
    name: 'between rows',
    input: 'name,value\nalice,1\n# unmatched " quote\nbob,2\n',
    options: { skipComments: true }
  },
  {
    name: 'with custom characters',
    input: "~ unmatched ' quote;name|value;alice|1;",
    options: { skipComments: '~', quote: "'", escape: '\\', separator: '|', newline: ';' }
  }
]) {
  test(`ignore quotes in comments ${example.name} across chunk boundaries`, async (t) => {
    const input = Buffer.from(example.input)
    const expected = [{ name: 'alice', value: '1' }]
    if (example.name === 'between rows') expected.push({ name: 'bob', value: '2' })

    t.deepEqual(await parseChunks([input], example.options), expected)
    for (let split = 1; split < input.length; split++) {
      t.deepEqual(await parseChunks([input.slice(0, split), input.slice(split)], example.options), expected, `split at ${split}`)
    }
    t.deepEqual(await parseChunks(Array.from(input, byte => Buffer.from([byte])), example.options), expected)
  })
}

test('comment characters inside multiline quoted cells remain data', async (t) => {
  const input = Buffer.from('name,value\n"alice\n# still a name",1\n')
  const chunks = Array.from(input, byte => Buffer.from([byte]))
  t.deepEqual(await parseChunks(chunks, { skipComments: true }), [{ name: 'alice\n# still a name', value: '1' }])
})
