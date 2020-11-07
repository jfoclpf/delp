/* eslint prefer-const: "off" */
/* eslint no-var: "off" */

const async = require('async')
const delpPt = require('./index.js')

async.series([
  function (callback) {
    delpPt.getWordMeaning('amor', (err, results) => {
      if (err) {
        callback(Error(err))
        return
      }
      if (results.length === 0) {
        callback(Error('Empty result'))
        return
      }

      var foundSentimento = false
      for (let i = 0; i < results.length; i++) {
        if (results[i].toLowerCase().includes('sentimento')) {
          foundSentimento = true
        }
      }
      if (!foundSentimento) {
        callback(Error('Not found "sentimento" in the definition of Amor'))
        return
      }
      console.log('Found "sentimento" in the definition of Amor')

      console.log('\n\nAMOR\n\n')
      console.log(results)
      callback()
    })
  },
  function (callback) {
    delpPt.getWordMeaning('fazer', (err, results) => {
      if (err) {
        callback(Error(err))
        return
      }
      if (results.length === 0) {
        callback(Error('Empty result'))
        return
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
