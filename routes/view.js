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

module.exports = function view (configuration, request, response) {
  var signFile = signPath(configuration, request.params.capability)
  readJSONFile(signFile, function (error, parsed) {
    if (error) {
      /* istanbul ignore else */
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
  response.setHeader('Content-Type', 'text/html; charset=ASCII')
  var body = trumpet()
  pump(body, response)
  body.select('main')
    .createWriteStream()
    .end(content(configuration, edition))
  pump(readTemplate('view.html'), body)
}

function content (configuration, data) {
  return `
<article class=commonform>
  ${commonformHTML(
    data.form.commonform,
    data.directions,
    {
      title: data.form.title,
      edition: spell(data.form.edition),
      html5: true
    }
  )}
</article>`
}
