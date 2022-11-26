const fs = require('fs')
const path = require('path')
const mysql = require('mysql')
const async = require('async')
const jsdom = require('jsdom')
const { JSDOM } = jsdom
const ProgressBar = require('progress')
const pretty = require('pretty')
const minify = require('html-minifier').minify
const debug = require('debug')('verbetesLight')

const dbInfo = JSON.parse(fs.readFileSync(path.join('dbCredentials.json'), 'utf8')).database
const db = mysql.createConnection(dbInfo)

let Bar // progress bar
const WORDS = [] // array of words

async.series([
  function (callback) {
    db.connect(function (err) {
      if (err) {
        console.error('Error connecting to database')
        throw (Error(err))
      } else {
        debug(('User ' + dbInfo.user + ' connected successfully to database ' +
          dbInfo.database + ' at ' + dbInfo.host).green)
        debug(dbInfo)
        console.log('Connection with DB done with success')

        callback()
      }
    })
  },
  function (callback) {
    console.log('Fetching all unique words from db, please wait')
    const query = `SELECT palavra FROM ${dbInfo.database}.${dbInfo.db_tables.verbetes}`

    db.query(query, function (error, results, fields) {
      if (error) {
        callback(error)
      } else {
        for (const key in results) {
          WORDS.push(results[key].palavra)
        }
        debug(WORDS)
        callback()
      }
    })
  },
  function (mainCallback) {
    console.log(`Fetching words from ${dbInfo.db_tables.verbetes} to ${dbInfo.db_tables.verbetes_light}`)

    // temp
    // WORDS = ['farei'] // WORDS.slice(0, 1)

    Bar = new ProgressBar('[:bar] :percent :info', { total: WORDS.length, width: 80 })

    async.eachSeries(WORDS, function (word, callback) {
      debug('fetching and processing word ' + word)
      const query = `SELECT * FROM ${dbInfo.database}.${dbInfo.db_tables.verbetes} where palavra='${word}'`
      db.query(query, function (error, results, fields) {
        if (error) {
          debug(error)
          callback(error)
        } else {
          let priberamContent
          let infopediaContent
          const htmlMiniferOpt = {
            collapseWhitespace: true,
            removeEmptyElements: true,
            removeEmptyAttributes: true,
            removeTagWhitespace: true,
            removeComments: true
          };
          // process priberam_content
          (function () {
            const { window } = new JSDOM('<div id="priberam_content">' + results[0].priberam_content + '</div>')
            const $ = require('jquery')(window)
            const $body = $('#priberam_content')
            $body.find('*').removeAttr('id class')

            // removes empty elements such as <div></div>
            $body.find('div, span').each(function () {
              if ($(this).text().trim().length === 0) { $(this).remove() }
            })
            // debug(pretty($body.html()))
            priberamContent = minify($body.html(), htmlMiniferOpt)
            // debug(priberamContent)
          }());
          // process infopedia_content
          (function () {
            const { window } = new JSDOM('<div id="infopedia_content">' + results[0].infopedia_content + '</div>')
            const $ = require('jquery')(window)
            const $body = $('#infopedia_content')
            $body.find('*').removeAttr('id class')

            // removes empty elements such as <div></div>
            $body.find('div, span').each(function () {
              if ($(this).text().trim().length === 0) { $(this).remove() }
            })
            debug(pretty($body.html()))
            infopediaContent = minify($body.html(), htmlMiniferOpt)
            debug(infopediaContent)
          }())

          // inserting on new table, if exists updates
          const query = `REPLACE INTO ${dbInfo.database}.${dbInfo.db_tables.verbetes_light}
            (palavra, priberam_content, infopedia_content, entry_date, last_update)
            VALUES('${word}', '${priberamContent.replace(/'/g, "\\'")}', '${infopediaContent.replace(/'/g, "\\'")}',
            '${results[0].entry_date.toISOString().slice(0, 10)}', '${results[0].last_update.toISOString().slice(0, 10)}')`

          db.query(query, function (error, results, fields) {
            if (error) {
              console.log('query:', query)
              console.error(Error(error))
              callback(error)
            } else {
              debug(`word '${word}' processed successfully'`)
              Bar.tick({ info: word })
              callback()
            }
          })
        }
      })
    }, function (err) {
      if (err) {
        mainCallback(Error(err))
      } else {
        console.log('All words processed correctly')
        mainCallback()
      }
    })
  }
],
function (err) {
  if (err) {
    console.error(Error(err))
    process.exitCode = 1
  } else {
    console.log('All words fetched and processed successfully')
    process.exitCode = 0
  }

  Bar.terminate()
  db.end(function (err) {
    if (err) {
      console.log('Error ending db connection: ' + err.message)
      process.exitcode = 1 // exit with error
    }
    console.log('Connection to db closed successfully')
  })
})

// catches CTRL-C
process.on('SIGINT', function () {
  db.end(function (err) {
    if (err) {
      console.log('Error ending db connection' + err.message)
      process.exitcode = 1 // exit with error
    } else {
      process.exitCode = 0
    }
    process.exit()
  })
})
