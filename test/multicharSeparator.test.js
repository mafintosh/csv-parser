const test = require('ava')
const fs = require('fs')
const path = require('path')
const csv = require('../')

test('parse CSV with multi-character separator', async (t) => {
  const filePath = path.join(__dirname, 'fixtures', 'multi-separator.csv')
  const input = fs.createReadStream(filePath)

  const results = []
  return new Promise((resolve) => {
    input
      .pipe(csv({ separator: '#|#' }))
      .on('data', (data) => results.push(data))
      .on('end', () => {
        t.deepEqual(results, [
          { nombre: 'Juan', edad: '25', ciudad: 'Madrid' },
          { nombre: 'Ivan', edad: '30', ciudad: 'Barcelona' },
          { nombre: 'Luis', edad: '28', ciudad: 'Valencia' }
        ])
        resolve()
      })
  })
})
