var commonformHTML = require('commonform-html')
var internalError = require('./internal-error')
var notFound = require('./not-found')
var readJSONFile = require('../data/read-json-file')
var signPath = require('../data/sign-path')
var spell = require('reviewers-edition-spell')

var html = require('./html')
var preamble = require('../partials/preamble')
var formattingNote = require('../partials/formatting-note')
var footer = require('../partials/footer')
var banner = require('../partials/banner')

module.exports = function view (configuration, request, response) {
  var signFile = signPath(configuration, request.params.capability)
  readJSONFile(signFile, function (error, sign) {
    if (error) {
      /* istanbul ignore else */
      if (error.code === 'ENOENT') {
        notFound(configuration, request, response)
      } else {
        internalError(configuration, request, response, error)
      }
    } else {
      response.setHeader('Content-Type', 'text/html; charset=ASCII')
      response.end(html`
${preamble()}
${banner()}
<main>
  ${formattingNote()}
  <article class=commonform>
    ${commonformHTML(
      sign.form.commonform,
      sign.directions,
      {
        title: sign.form.title,
        edition: spell(sign.form.edition),
        html5: true
      }
    )}
  </article>
</main>
${footer()}`)
    }
  })
}
