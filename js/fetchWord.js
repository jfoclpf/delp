/* eslint prefer-const: "off" */
/* eslint no-var: "off" */

const async = require('async')
const jsdom = require('jsdom')
const { JSDOM } = jsdom
const debug = require('debug')('app:fetchWord')

// fetch word
module.exports = function (word, callback) {
  var data = {}
  data.priberam_content = ''
  data.infopedia_content = ''

  var totalSize = 0

  async.parallel([
    // fetches priberam definition
    function (callback) {
      JSDOM.fromURL('https://dicionario.priberam.org/' + word, {
        userAgent: 'Node.js'
      }).then((dom) => {
        debug('DOM for priberam available')
        var window = dom.window
        var $ = require('jquery')(window)

        var $wordNotFound = $("#resultados:contains('Palavra não encontrada')")
        if ($wordNotFound && $wordNotFound.length > 0) {
          debug('Priberam has no content')
          callback(null, 'WORD_NOT_FOUND')
        } else {
          var $content = $('#resultados')

          $content.find('.varpt, .aAO, .dAO, .definicao_image, refs_externas').remove()
          $content.find('span').css('font-size', '') // removes font-size
          $content.find('script').remove()

          // $content.find('*').removeAttr('id class')

          var resultados = $content.html()
          totalSize += resultados.length
          debug(resultados)

          data.priberam_content = resultados
          callback()
        }
        dom.window.close()
      }).catch(() => {
        callback()
      })
    },
    // fetches infopedia definition
    function (callback) {
      JSDOM.fromURL('https://www.infopedia.pt/dicionarios/lingua-portuguesa/' + word, {
        userAgent: 'Node.js'
      }).then((dom) => {
        debug('DOM for infopedia available')
        var window = dom.window
        var $ = require('jquery')(window)

        var $content = $('.QuadroDefinicao').first()
        if ($content.length === 0) {
          debug('Infopedia has no content')
          callback(null, 'WORD_NOT_FOUND')
        } else {
          // grey color on number of entries
          $content.find('.dolAcepsNum > span, .dolAcepsExegerNum > span').css('color', '#999999')

          // makes some reorganization of the DOM, because in infopedia the DOM tree is too complex
          $('div.dolDivisaoCatgram div.dolAcepsRow').replaceWith(function () {
            var el1 = $(this).find('.dolAcepsNum').html() || ''
            var el2 = $(this).find('.dolSubacepTraduz').html() || ''
            return $('<p>').html(el1 + el2).css({ 'padding-left': '12px', margin: 0 })
          })
          $('div.dolTable').each(function () {
            if ($(this).children('.dolRow').length > 1) {
              $(this).find('.dolRow').replaceWith(function () {
                var el1 = $(this).find('.dolAcepsExegerNum').html() || ''
                var el2 = $(this).find('.dolTraduzTrad').html() || ''
                return $('<p>').html(el1 + el2).css({ 'padding-left': '12px', margin: 0 })
              })
            }
          })

          $content.find('.dolExegerLexpress, .dolRegenciaConstr').css('font-weight', 'bold')

          $content.find(`.container, .dolDivisaoCatgram, .dolLexegerExeger, .dolEntradaVverbete,
                         .QuadroDefinicao, .dolRegenciaDescricao,
                         .dolRegenciaConstr, .dolVverbeteLregencias`).css({ 'padding-top': '1em' })

          $content.find(`.dolEntradaVverbetePronunciaEtiq, .hidden-sm.hidden-md.hidden-lg,
                         .dolEntradaVverbetePronunciaInfo > .dolSilab,
                         .dolEntradaVverbeteHeader, .dolVerbeteEntrinfo`).remove()
          // removes links
          $content.find('a').contents().unwrap()

          // $content.find('*').removeAttr('id class')

          var resultados = $content.html()
          totalSize += resultados.length
          debug(resultados)

          data.infopedia_content = resultados
          window.close()
          callback()
        }
      }).catch(err => {
        if (err.message.includes('404')) {
          callback(null, 'WORD_NOT_FOUND')
        } else {
          callback(err)
        }
      })
    }
  ],
  function (err, results) {
    // callback(err, isThereWord, content)
    if (err) {
      callback(err)
    } else if (results[0] === 'WORD_NOT_FOUND' && results[1] === 'WORD_NOT_FOUND') {
      callback(null, false)
    } else {
      debug('total size', totalSize)
      callback(null, true, data)
    }
  })
}
