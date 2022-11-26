const colors = require('colors')
const async = require('async')
const commandLineArgs = require('command-line-args')
const ProgressBar = require('progress')
const debug = require('debug')('mining')

const wordsPt = require('words-pt')

// own modules
const fetchWordFromDicts = require('./fetchWord')
const db = require('./db')

const optionDefinitions = [
  { name: 'letter', alias: 'l', type: String }, // fecthes all the words started with the letter
  { name: 'word', alias: 'w', type: String } // fetch a single word
]

// get options from command line arguments
const cmdLineArgs = commandLineArgs(optionDefinitions)
debug('command line arguments', cmdLineArgs)

let Bar

db.connect(function () {
  debug('Connection to database with success')

  wordsPt.init({ removeNames: true }, function (err) {
    if (err) {
      console.log(Error(err))
      process.exit(1)
    }
    let wordsArray = wordsPt.getArray()

    if (cmdLineArgs.letter && cmdLineArgs.word) {
      throw Error('invalid options, either word or letter')
    }

    if (cmdLineArgs.letter) {
      wordsArray = wordsArray.filter(word => word.startsWith(cmdLineArgs.letter))
      console.log(`mining words started with letter ${cmdLineArgs.letter}`)
    } else if (cmdLineArgs.word) {
      wordsArray = []
      wordsArray.push(cmdLineArgs.word)
    }

    const numberOfWords = wordsArray.length
    console.log(`There are ${numberOfWords} words to be fetched`)

    Bar = new ProgressBar('[:bar] :percent :info', { total: numberOfWords, width: 80 })

    async.eachSeries(wordsArray, function (word, callback) {
      const data = {}
      data.priberam_content = ''
      data.infopedia_content = ''

      // check if word is available in our database
      db.isWordThereIn(word, function (isWordInOurDb) {
        if (isWordInOurDb) {
          // fetch word from our database
          debug(colors.green(`word "${word}" is already in DB`))
          Bar.tick({ info: colors.green(word) })
          callback()
        } else {
          // fetch word from online dictionaries
          debug(colors.green(`word "${word}" is NOT in our DB`))

          fetchWordFromDicts(word, function (err, isThereWord, content) {
            if (err) {
              callback(Error(err))
              return
            }

            if (!isThereWord) {
              debug(colors.yellow(`word "${word}" not found on online dictionaries`))
              data.priberam_content = data.infopedia_content = ''
            } else {
              debug(colors.green(`word "${word}" found on online dictionaries`))
              data.priberam_content = content.priberam_content
              data.infopedia_content = content.infopedia_content
            }

            db.insertWord(word, data, function (err) {
              if (err) {
                console.error(colors.red.bold(`Error inserting "${word}" in DB`))
                callback(Error(err))
              } else {
                debug(colors.green.bold(`word "${word}" inserted successfully into DB`))
                Bar.tick({ info: colors.green.bold(word) })
                callback()
              }
            })
          })
        }
      })
    }, function (err) {
      if (err) {
        console.error(Error(err))
        process.exitcode = 1
      } else {
        console.log('All words have been fetched successfully')
      }
      Bar.terminate()
      db.end(function (err) {
        if (err) {
          console.log('Error ending db connection: ' + err.message)
          process.exitcode = 1 // exit with error
        }
      })
    })
  })
})

// catches CTRL-C
process.on('SIGINT', function () {
  console.log('\nEnding db connection and closing http server')
  Bar.terminate()
  db.end(function (err) {
    if (err) {
      console.log('Error ending db connection: ' + err.message)
      process.exitcode = 1 // exit with error
    }
    process.exit(0)
  })
})
