const async = require('async')
const delpPt = require('./index.js')

async.series([
  function (callback) {
    delpPt.getWordMeaning('amor', (err, results) => {
      if (err) {
        console.error(err)
        process.exit(1)
      }
      console.log('\n\nAMOR\n\n')
      console.log(results)
      callback()
    })
  },
  function (callback) {
    delpPt.getWordMeaning('fazer', (err, results) => {
      if (err) {
        console.error(err)
        process.exit(1)
      }
      console.log('\n\nFAZER\n\n')
      console.log(results)
      callback()
    })
  },
  function (callback) {
    delpPt.getWordMeaning('adsfadsfa', (err, results) => {
      if (err) {
        console.log('\n\nWord adsfadsfa does not exist and it correctly returns ' + err.message)
        callback()
      } else {
        console.error('ERROR: This war was not supposed to be found')
        process.exit(1)
      }
    })
  }
], function (err, results) {
  if (err) {
    console.log('Error')
    process.exit(1)
  } else {
    console.log('\n\nTest run with success\n')
    process.exit(0)
  }
})
