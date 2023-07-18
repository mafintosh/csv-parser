const test = require('ava')

const { collect } = require('./helpers/helper')

test.cb('multi character separator (headers: ["a", "b", "c"])', (t) => {
    const verify = (err, lines) => {
        t.false(err, 'no err')

        t.assert(lines[0].a === 'A row1', 'first row a')
        t.assert(lines[0].b === 'B row1', 'first row b')
        t.assert(lines[0].c === 'C row1', 'first row c')
        
        t.assert(lines[1].a === 'A row2', 'second row a')
        t.assert(lines[1].b === 'B row2', 'second row b')
        t.assert(lines[1].c === 'C row2', 'second row c')

        t.assert(lines[2].a === 'A row3', 'third row a')
        t.assert(lines[2].b === 'B row3', 'third row b')
        t.assert(lines[2].c === '', 'third row c (empty)')


        t.snapshot(lines[0], 'first row')
        t.snapshot(lines[1], 'second row')
        t.snapshot(lines[2], 'third row')
        t.is(lines.length, 3, '3 rows')
        t.end()
    }
  
    collect('multi-char-separator',{
        separator: '#|#',
        headers: ['a', 'b', 'c']
    }, verify)
  })