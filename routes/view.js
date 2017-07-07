var commonformHTML = require('commonform-html')
var escape = require('escape-html')
var internalError = require('./internal-error')
var notFound = require('./not-found')
var pump = require('pump')
var readJSONFile = require('../data/read-json-file')
var readTemplate = require('./read-template')
var signPath = require('../data/sign-path')
var spell = require('reviewers-edition-spell')
var trumpet = require('trumpet')

module.exports = function (configuration, request, response) {
  var signFile = signPath(configuration, request.params.capability)
  readJSONFile(signFile, function (error, parsed) {
    if (error) {
      if (error.code === 'ENOENT') {
        notFound(configuration, request, response)
      } else {
        internalError(configuration, request, response, error)
      }
    } else {
      get(configuration, request, response, parsed)
    }
  })
}

function get (configuration, request, response, edition) {
  var body = trumpet()
  response.setHeader('Content-Type', 'text/html; charset=ASCII')
  pump(body, response)
  body.select('main')
    .createWriteStream()
    .end(content(configuration, edition))
  pump(readTemplate('view.html'), body)
}

function content (configuration, data) {
  return `
<article class=commonform>
  <h1>${escape(data.form.title)}</h1>
  <p class=edition>${escape(spell(data.form.edition))}</p>
  ${commonformHTML(
    data.form.commonform,
    data.directions,
    {html5: true}
  )}
</article>`
}
