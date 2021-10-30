/* eslint prefer-const: "off" */
/* eslint no-var: "off" */

const HTTPportForServer = 3038

const path = require('path')
const express = require('express')
const exphbs = require('express-handlebars')
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
app.use(express.json()) // support json encoded bodies
app.use(express.urlencoded({ extended: true })) // support encoded bodies

var optionDefinitions = [
  { name: 'database', type: Boolean },
  { name: 'host', type: String }
]

// get options from command line arguments
var cmdLineArgs = commandLineArgs(optionDefinitions)
debug('command line arguments', cmdLineArgs)

// host is used, when this service is used as webservice
const host = cmdLineArgs.host
if (host) {
  console.log(`host: ${host}`)
}

if (cmdLineArgs.database) {
  db = require('./js/db')
  debug('Started WITH database')
  db.connect(function () {
    console.log('Connection to database with success')
  })
} else {
  debug('Started WITHOUT database')
}

app.get('/opensearch.xml', function (req, res) {
  var data = {
    layout: false
  }

  if (host) {
    data.host = host
  }

  res.type('application/xml')
  res.render('opensearch_xml', data)
})

app.get('/:word', function (req, res, next) {
  debug('\nRoute: app.get(\'/\')')
  debug('word', req.params.word)

  var data = {}
  data.priberam_content = ''
  data.infopedia_content = ''

  if (host) {
    data.host = host
  }

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
  if (host) {
    data.host = host
  }
  res.render('main', data)
})

// if nothing matches, redirect to root url
app.use(function (req, res) {
  res.redirect('/')
})

const server = app.listen(HTTPportForServer, function () {
  console.log('Listening on port ' + HTTPportForServer)
  console.log('To stop server press ' + colors.red.bold('CTRL+C') + '\n')
  console.log('*******************************************************************************')
  console.log('**                    Dicionário em-linha de Português                       **')
  console.log('**             can be now accessed on ' +
    colors.green.bold('http://localhost:' + HTTPportForServer) + '                  **')
  console.log('**                                                                           **')
  console.log('*******************************************************************************')

  if (process.send) {
    process.send('ready') // very important, trigger to PM2 that app is ready
  }
})

// gracefully exiting upon CTRL-C or when PM2 stops the process
process.on('SIGINT', gracefulShutdown)
process.on('SIGTERM', gracefulShutdown)

function gracefulShutdown (signal) {
  if (signal) {
    console.log(`Received signal ${signal}`)
  }
  console.log('Gracefully closing http server and db connections')

  process.exitCode = 0 // with success

  if (cmdLineArgs.database) {
    console.log('Ending db connection and closing http server')
    db.end(function (err) {
      if (err) {
        console.log('Error ending db connection:', err.message)
        process.exitcode = 1 // exit with error
      }
    })
  }

  try {
    server.close(function (err) {
      if (err) {
        console.log('Error ending server:', err)
        process.exitCode = 1
      } else {
        console.log('http server closed successfully. Exiting!')
      }
    })
  } catch (err) {
    console.error('There was an error closing the server')
    process.exitCode = 1
  }
}
