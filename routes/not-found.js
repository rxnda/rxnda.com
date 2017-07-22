var escape = require('../util/escape')

var banner = require('../partials/banner')
var footer = require('../partials/footer')
var html = require('./html')
var nav = require('../partials/nav')
var preamble = require('../partials/preamble')

module.exports = function notFound (
  configuration, request, response, message
) {
  response.statusCode = 404
  response.setHeader('Content-Type', 'text/html; charset=ASCII')
  response.end(html`
${preamble('Not Found')}
${banner()}
${nav()}
<main>
  <h2>Not Found</h2>
  ${message.map(function (string) {
    return html`<p>${escape(string)}</p>`
  })}
</main>
${footer()}`)
}
