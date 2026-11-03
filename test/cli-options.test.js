const path = require('path')
const test = require('ava')
const execa = require('execa')

const binPath = path.resolve(__dirname, '../bin/csv-parser')

async function parse (args, input) {
  const { stdout } = await execa(process.execPath, [binPath, ...args], { input })
  return stdout.trim().split(/\r?\n/).map(line => JSON.parse(line))
}

for (const flag of ['--quote', '-q']) {
  test(`CLI forwards ${flag} and defaults escape to that quote`, async t => {
    const input = 'name,note\n|Alice|,|London, UK and ||quotes|||\n'
    t.deepEqual(await parse([flag, '|'], input), [
      { name: 'Alice', note: 'London, UK and |quotes|' }
    ])
  })
}

for (const flag of ['--escape', '-e']) {
  test(`CLI forwards ${flag} with default quote`, async t => {
    const input = 'name,note\nAlice,"say \\"hello\\""\n'
    t.deepEqual(await parse([flag, '\\'], input), [
      { name: 'Alice', note: 'say "hello"' }
    ])
  })
}

test('CLI combines custom quote and escape', async t => {
  const input = 'name,note\n|Alice|,|London, UK and \\|quotes\\||\n'
  t.deepEqual(await parse(['--quote', '|', '--escape', '\\'], input), [
    { name: 'Alice', note: 'London, UK and |quotes|' }
  ])
})

test('CLI preserves default doubled-quote behavior', async t => {
  const input = 'name,note\nAlice,"London, UK and ""quotes"""\n'
  t.deepEqual(await parse([], input), [
    { name: 'Alice', note: 'London, UK and "quotes"' }
  ])
})
