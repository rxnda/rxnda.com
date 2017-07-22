var escape = require('../util/escape')

var banner = require('../partials/banner')
var footer = require('../partials/footer')
var html = require('./html')
var nav = require('../partials/nav')
var preamble = require('../partials/preamble')

module.exports = function internalError (
  configuration, request, response, error
) {
  request.log.error(error)
  response.statusCode = 500
  response.setHeader('Content-Type', 'text/html; charset=ASCII')
  response.end(html`
${preamble('Software Error')}
${banner()}
${nav()}
<main>
  <h2>Software Error</h2>
  <p>
    There’s been a problem with the server. It could be that services
    for sending e-mail or processing payment are down, or a bug in RxNDA
    itself.
  </p>
  <p>
    Please include the special code ${escape(request.id)} in any
    correspondece with RxNDA about this issue.
  </p>
</main>
${footer()}`)
}
