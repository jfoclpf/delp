const path = require('path')
const HTTPportForServer = 3038

const express = require('express')
const exphbs = require('express-handlebars')
const bodyParser = require('body-parser')
const compression = require('compression')
const colors = require('colors')
const commandLineArgs = require('command-line-args')
const debug = require('debug')('app:server')

// own modules
const fetchWordFromDicts = require('./js/fetchWord')
var db // just require if option is enabled from command line

var app = express()
app.enable('case sensitive routing')
app.enable('trust proxy')

// rendering engine for dynamically loaded HTML/JS files
var hbs = exphbs.create({
  extname: '.hbs',
  layoutsDir: path.join(__dirname, 'views', 'layouts'),
  defaultLayout: path.join(__dirname, 'views', 'layouts', 'main.hbs')
})

app.engine('.hbs', hbs.engine)
app.set('view engine', '.hbs')
app.set('views', path.join(__dirname, 'views'))

// static content
app.use(express.static(path.join(__dirname, 'public'))) // root public folder of the site /
app.use('/css', express.static(path.join(__dirname, 'css')))
app.use('/img', express.static(path.join(__dirname, 'img')))

app.use(compression({ level: 1 })) // level 1 is for fastest compression
app.use(bodyParser.json()) // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })) // support encoded bodies

var optionDefinitions = [
  { name: 'database', type: Boolean },
  { name: 'sitemap', type: Boolean }
]

// get options from command line arguments
var cmdLineArgs = commandLineArgs(optionDefinitions)
debug('command line arguments', cmdLineArgs)

if (cmdLineArgs.database) {
  db = require('./js/db')
  debug('Started WITH database')
  db.connect(function () {
    debug('Connection to database with success')
  })
} else {
  debug('Started WITHOUT database')
}

if (cmdLineArgs.sitemap) {
  const sitemap = require('./js/sitemap')
  sitemap()
}

app.get('/:word', function (req, res, next) {
  debug('\nRoute: app.get(\'/\')')
  debug('word', req.params.word)

  var data = {}
  data.priberam_content = ''
  data.infopedia_content = ''

  const word = req.params.word.toLowerCase()
  data.word = word

  if (cmdLineArgs.database) {
    // check if word is available in our database
    db.isWordThereIn(word, function (isWordInOurDb) {
      if (isWordInOurDb) {
        // fetch word from our database
        debug(colors.green(`word "${word}" is in our DB`))

        db.fetchWordMeaning(word, function (results) {
          debug(colors.green(`word "${word}" fetched successfully from our DB`))
          data.priberam_content = results.priberam_content
          data.infopedia_content = results.infopedia_content
          res.render('word', data)
        })
      } else {
        // fetch word from online dictionaries
        debug(colors.green(`word "${word}" is NOT in our DB, fetching from online dictionaries`))

        fetchWordFromDicts(word, function (err, isThereWord, content) {
          if (err) {
            debug(Error(err))
          } else if (!isThereWord) {
            debug(colors.yellow(`word "${word}" not found on online dictionaries`))
            res.render('wordNotFound', data)
          } else {
            data.priberam_content = content.priberam_content
            data.infopedia_content = content.infopedia_content

            res.render('word', data)

            db.insertWord(word, data, function (err) {
              if (!err) {
                debug(colors.green.bold(`word "${word}" inserted with success into db`))
              }
            })
          }
        })
      }
    })
  } else {
    // No DB available, fetch word from online dicitonaries
    fetchWordFromDicts(word, function (err, isThereWord, content) {
      if (err) {
        debug(Error(err))
      } else if (!isThereWord) {
        debug(colors.yellow(`word "${word}" not found on online dictionaries`))
        res.render('wordNotFound', data)
      } else {
        data.priberam_content = content.priberam_content
        data.infopedia_content = content.infopedia_content
        res.render('word', data)
      }
    })
  }
})

// if nothing matches, redirect to root url
app.get('/', function (req, res) {
  var data = {}
  res.render('main', data)
})

// if nothing matches, redirect to root url
app.use(function (req, res) {
  res.redirect('/')
})

var server = app.listen(HTTPportForServer, function () {
  console.log('Listening on port ' + HTTPportForServer)
  console.log('To stop server press ' + colors.red.bold('CTRL+C') + '\n')
  console.log('*******************************************************************************')
  console.log('**                    Dicionário em-linha de Português                       **')
  console.log('**             can be now accessed on ' +
    colors.green.bold('http://localhost:' + HTTPportForServer) + '                  **')
  console.log('**                                                                           **')
  console.log('*******************************************************************************')
})

// catches CTRL-C
process.on('SIGINT', function () {
  if (cmdLineArgs.database) {
    console.log('\nEnding db connection and closing http server')
    db.end(function (err) {
      if (err) {
        console.log('Error ending db connection' + err.message)
        process.exitcode = 1 // exit with error
      } else {
        process.exitCode = 0
      }
    })
  }
  console.log('Closing local http server')
  server.close()
})
