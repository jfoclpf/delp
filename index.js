const colors = require('colors')
const html2json = require('html2json').html2json
const debug = require('debug')('app:index')

/* eslint prefer-const: "off" */
/* eslint no-var: "off" */

// own modules
const fetchWordFromDicts = require('./js/fetchWord')

module.exports = {
  getWordMeaning: function (word, callback) {
    debug('word', word)
    if (!word) {
      callback(Error('word not defined'))
    }

    var data = {}
    data.priberam_content = ''
    data.infopedia_content = ''

    word = word.toLowerCase()
    data.word = word

    fetchWordFromDicts(word, function (err, isThereWord, content) {
      if (err) {
        debug(Error(err))
        callback(err)
      } else if (!isThereWord) {
        debug(colors.yellow(`word "${word}" not found on online dictionaries`))
        callback(Error('WORD_NOT_FOUND'))
      } else {
        data.priberam_content = html2json(content.priberam_content)
        data.infopedia_content = html2json(content.infopedia_content)

        callback(null, purgeData(data))
      }
    })
  }
}

// from the mess of the html DOM fetched from priberam and infopedia website
// tries to obtain the useful information, that is, the meaning of the words
function purgeData (data) {
  var output = []
  // deep loop into object
  const iterate = (obj) => {
    Object.keys(obj).forEach(key => {
      if (key === 'text') {
        const el = obj[key].trim().replace(/\s{2,}/g, ' ').replace(/ *\([^)]*\) */g, '').replace('(ex.:', '').replace(/\.$/, '')
        if (el && el.length > 20 && !el.includes('[') && !el.includes('&') &&
        !el.includes('Sabia que?') && !el.includes('Pode consultar') &&
        el.toUpperCase() !== el && el[0].toUpperCase() === el[0]) {
          output.push(el.trim())
        }
      }

      if (typeof obj[key] === 'object') {
        iterate(obj[key])
      }
    })
  }

  iterate(data)
  return output
}
