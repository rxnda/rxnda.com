var internalError = require('./internal-error')
var revedCompare = require('reviewers-edition-compare')
var revedParse = require('reviewers-edition-parse')
var listForms = require('../data/list-forms')
var trumpet = require('trumpet')
var readTemplate = require('./read-template')
var pump = require('pump')

module.exports = function (configuration, request, response) {
  listForms(configuration, function (error, forms) {
    /* istanbul ignore if */
    if (error) {
      internalError.apply(null, arguments)
    } else {
      var body = trumpet()
      response.setHeader('Content-Type', 'text/html; charset=ASCII')
      pump(body, response)
      pump(readTemplate('forms.html'), body)
      var list = body.select('#forms').createWriteStream()
      // TODO Show forms with latest updates first.
      Object.keys(forms).forEach(function (title) {
        var editions = forms[title].sort(function (a, b) {
          return revedCompare(a.edition, b.edition)
        })
        var current = editions.find(function (edition) {
          return revedParse(edition.edition).draft === undefined
        })
        list.write('<section>')
        list.write(`<h3>${title}</h3>`)
        if (current) {
          list.write(`<p class=description>${current.description}</p>`)
        } else {
          var latest = editions[0]
          list.write(`<p class=description>${latest.description}</p>`)
        }
        list.write('</section>')
      })
      list.end()
    }
  })
}
