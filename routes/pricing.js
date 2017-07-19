var banner = require('../partials/banner')
var footer = require('../partials/footer')
var html = require('./html')
var nav = require('../partials/nav')
var preamble = require('../partials/preamble')

module.exports = function pricing (configuration, request, response) {
  response.setHeader('Content-Type', 'text/html; charset=ASCII')
  response.end(html`
${preamble()}
${banner()}
${nav()}
<main>
  <p class=bigPrice><span class=use-price></span></p>
  <p>
    Successfully cosigning an NDA costs
    ${configuration.prices.use.toString()} charged when the
    other side countersigns.  You must use a credit card to pay.
  </p>
  <p>
    Sending an NDA that the other side does not countersign costs
    nothing.
  </p>
  <p>
    Sending an NDA that you or the other side cancels costs nothing.
  </p>
</main>
${footer()}`)
}
