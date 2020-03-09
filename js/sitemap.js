// module to generate sitemap files on public/ directory
const fs = require('fs')
const path = require('path')
const async = require('async')
const debug = require('debug')('app:sitemap')

const wordsPt = require('words-pt')

module.exports = function () {
  generate()
}

var WORDS // array with all the words

function generate () {
  wordsPt.init(err => {
    if (err) {
      console.error('Error rendering sitemap:', err.message)
      process.exit(1)
    }

    WORDS = wordsPt.getArray()
    const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('') // ['a', 'b', 'c', ...]

    renderSitemapIndex(alphabet)

    async.each(alphabet, renderSitemapForLetter, function (err) {
      if (err) {
        console.error('Error rendering sitemap.xml:', err.message)
        process.exit(1)
      } else {
        console.log('All sitemaps have been rendered successfully')
      }
    })
  })
}

function renderSitemapForLetter (letter, callback) {
  // get a subawway of words, just with words starting with letter
  var words = WORDS.filter(word => word[0] === letter)

  var content = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`
  var length = words.length
  for (let i = 0; i < length; i++) {
    content += `  <url>
    <loc>https://delp.pt/${words[i]}</loc>
  </url>
`
  }

  content += `</urlset>
`

  fs.writeFile(path.join('public', `sitemap${letter.toUpperCase()}.xml`), content, function (err) {
    if (err) {
      console.error(err)
      process.exit(1)
    }
    debug(`File generated: sitemap${letter.toUpperCase()}.xml`)
    callback()
  })
}

// Sitemap Index
// see https://support.google.com/webmasters/answer/75712?hl=en
function renderSitemapIndex (alphabet) {
  var content = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`

  for (let i = 0; i < alphabet.length; i++) {
    content += `  <sitemap>
    <loc>https://delp.pt/sitemap${alphabet[i].toUpperCase()}.xml</loc>
  </sitemap>
`
  }

  content += `</sitemapindex>
`

  fs.writeFile(path.join('public', 'sitemap.xml'), content, function (err) {
    if (err) {
      console.error(err)
      process.exit(1)
    }
    debug('Main File index generated: sitemap.xml')
  })
}
