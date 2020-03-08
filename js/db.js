const fs = require('fs')
const path = require('path')
const mysql = require('mysql')
const debug = require('debug')('app:db')

var dbInfo = JSON.parse(fs.readFileSync(path.join('dbCredentials.json'), 'utf8')).database

var db = mysql.createConnection(dbInfo)

module.exports = {
  connect: function (callback) {
    db.connect(function (err) {
      if (err) {
        console.error('Error connecting to database')
        throw (Error(err))
      } else {
        debug(('User ' + dbInfo.user + ' connected successfully to database ' +
          dbInfo.database + ' at ' + dbInfo.host).green)
        debug(dbInfo)
        callback()
      }
    })
  },

  // check if word is available in our database
  isWordThereIn: function (word, callback) {
    var query = `SELECT EXISTS
                (SELECT palavra FROM ${dbInfo.database}.${dbInfo.db_tables.verbetes}
                WHERE palavra='${word}')`

    db.query(query, function (error, results, fields) {
      if (error) {
        console.error(Error(error))
        callback(null)
      } else {
        var isWordInOurDb = results[0][fields[0].name] === 1
        debug('isWordInOurDb', isWordInOurDb)
        callback(isWordInOurDb)
      }
    })
  },

  fetchWordMeaning: function (word, callback) {
    var query = `SELECT *, MAX(last_update) FROM ${dbInfo.database}.${dbInfo.db_tables.verbetes}
                WHERE palavra='${word}'`
    db.query(query, function (error, results, fields) {
      if (error) {
        console.error(Error(error))
        const data = { priberam_content: '', infopedia_content: '' }
        callback(data)
      } else {
        var priberamContent = results[0].priberam_content
        var infopediaContent = results[0].infopedia_content
        // debug('priberam_content:', priberam_content)
        // debug('infopedia_content:', infopedia_content)

        const data = { priberam_content: priberamContent, infopedia_content: infopediaContent }
        callback(data)
      }
    })
  },

  insertWord: function (word, data, callback) {
    // escape single quotes before sending to mysql
    // https://stackoverflow.com/questions/887036/how-to-escape-single-quotes-in-mysql
    var priberamContent = data.priberam_content.replace(/'/g, "\\'")
    var infopediaContent = data.infopedia_content.replace(/'/g, "\\'")
    // insert word into db
    var dateNow = new Date().toJSON().slice(0, 10)
    var query = `INSERT IGNORE INTO ${dbInfo.database}.${dbInfo.db_tables.verbetes}
      (palavra, priberam_content, infopedia_content, entry_date, last_update)
      VALUES('${word}', '${priberamContent}', '${infopediaContent}',
      '${dateNow}', '${dateNow}')`

    db.query(query, function (error, results, fields) {
      if (error) {
        console.log('query:', query)
        console.error(Error(error))
        callback(error)
      } else {
        callback()
      }
    })
  },

  end: function (callback) {
    db.end(callback)
  }
}
