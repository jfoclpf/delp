// module to generate sitemap files on public/ directory
/* eslint prefer-const: "off" */
/* eslint no-var: "off" */

// just run this script directly with node to generate sitemaps

const fs = require('fs')
const path = require('path')
const async = require('async')

const wordsPt = require('words-pt')

generate(() => console.log('Done'))

const MAXIMUM_NBR_URLS = 5000 // Maximum number of urls per sitemap

var WORDS // array with all the words

function generate (callback) {
  console.log('deleting previous sitemap*.xml files, if they exist')
  // rm public/sitemap*.xml
  const dpath = path.join('.', 'public')
  const regex = /sitemap[\S]*[.]xml$/
  fs.readdirSync(dpath)
    .filter(f => regex.test(f))
    .map(f => { /* eslint array-callback-return: "off" */
      if (fs.existsSync(path.join(dpath, f))) {
        fs.unlinkSync(path.join(dpath, f))
      }
    })

  console.log('Generating sitemap')
  wordsPt.init(err => {
    if (err) {
      console.error('Error rendering sitemap:', err.message)
      process.exit(1)
    }

    WORDS = wordsPt.getArray()
    console.log('words obtained')

    // each of sitemap cannot contain more than 50000 urls, split into chunks
    var sitemaps = []
    for (let i = 0, length = WORDS.length; i < length; i += MAXIMUM_NBR_URLS) {
      sitemaps.push(WORDS.slice(i, i + MAXIMUM_NBR_URLS))
    }
    // sitemaps is now an array of arrays, the latters containing each 50000 words

    renderSitemapIndex(sitemaps)

    console.log(`Generating ${sitemaps.length} sitemaps`)
    async.eachOf(sitemaps, renderSingleSitemap, function (err) {
      if (err) {
        console.error('Error rendering sitemap.xml:', err.message)
        process.exit(1)
      } else {
        console.log('All sitemaps have been rendered successfully')
        callback()
      }
    })
  })
}

function renderSingleSitemap (words, index, callback) {
  const formattedIndex = ('00' + (index + 1)).slice(-3) // 0 to '01', 1 to '02'
  console.log(`Generating sitemap${formattedIndex}.xml`)

  var writeStream = fs.createWriteStream(path.join('public', `sitemap${formattedIndex}.xml`))

  writeStream.on('error', (err) => {
    callback(Error(err))
  })

  writeStream.on('finish', () => {
    console.log(`File generated: sitemap${formattedIndex}.xml`)
    callback()
  })

  writeStream.write('<?xml version="1.0" encoding="UTF-8"?>')
  writeStream.write('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')

  const length = words.length
  for (let i = 0; i < length; i++) {
    writeStream.write(`<url><loc>https://delp.pt/${words[i]}</loc></url>`)
  }

  writeStream.write('</urlset>')
  writeStream.end()
}

// Sitemap Index
// see https://support.google.com/webmasters/answer/75712?hl=en
function renderSitemapIndex (sitemaps) {
  var writeStream = fs.createWriteStream(path.join('public', 'sitemap.xml'))

  writeStream.on('error', (err) => {
    console.error(Error(err))
  })

  writeStream.on('finish', () => {
    console.log('Inedx sitemap generated: sitemap.xml')
  })

  writeStream.write('<?xml version="1.0" encoding="UTF-8"?>')
  writeStream.write('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')

  for (let i = 0; i < sitemaps.length; i++) {
    const formattedIndex = ('00' + (i + 1)).slice(-3) // 0 to '01', 1 to '02'
    writeStream.write(`<sitemap><loc>https://delp.pt/sitemap${formattedIndex}.xml</loc></sitemap>`)
  }

  writeStream.write('</sitemapindex>')
  writeStream.end()
}
