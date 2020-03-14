const async = require('async')
const delpPt = require('./index.js')

async.series([
  function (callback) {
    delpPt.getWordMeaning('amor', (err, results) => {
      if (err) {
        callback(Error(err))
      }
      if (results.length === 0) {
        callback(Error('Empty result'))
      }
      console.log('\n\nAMOR\n\n')
      console.log(results)
      callback()
    })
  },
  function (callback) {
    delpPt.getWordMeaning('fazer', (err, results) => {
      if (err) {
        callback(Error(err))
      }
      if (results.length === 0) {
        callback(Error('Empty result'))
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
        callback(Error('ERROR: This war was not supposed to be found'))
      }
    })
  }
], function (err, results) {
  if (err) {
    console.log(err)
    process.exit(1)
  } else {
    console.log('\n\nTest run with success\n')
    process.exit(0)
  }
})
