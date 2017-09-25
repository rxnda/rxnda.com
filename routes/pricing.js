var banner = require('../partials/banner')
var etagged = require('./etagged')
var footer = require('../partials/footer')
var html = require('./html')
var nav = require('../partials/nav')
var preamble = require('../partials/preamble')

var handler
module.exports = function (configuration, request, response) {
  /* istanbul ignore else */
  if (!handler) {
    handler = etagged('text/html; charset=ASCII', html`
${preamble('Pricing')}
${banner()}
${nav()}
<main>
  <p class=bigPrice>
    $${configuration.prices.use.toString()}
    /
    $${configuration.prices.fill.toString()}
  </p>
  <p>
    Successfully cosigning an NDA costs
    ${configuration.prices.use.toString()}
    United States Dollars.
    Successfully cosigning an NDA prescribed by
    an attorney costs
    ${configuration.prices.fill.toString()}
    United States Dollars.
    This price is charged when the other side countersigns.
    You must use a credit card to pay.
  </p>
  <p>
    Sending an NDA that&rsquo;s never countersigned costs nothing.
    Sending an NDA that you cancel costs nothing.
    Sending an NDA that the other side rejects costs nothing.
  </p>
  <p class=bigPrice>
    $${configuration.prices.prescribe.toString()}
  </p>
  <p>
    Prescribing an NDA for client use costs
    ${configuration.prices.fill.toString()}
    United States Dollars.
    This price is charged when the prescription
    is created.
  </p>
</main>
${footer()}`)
  }
  handler(configuration, request, response)
}
