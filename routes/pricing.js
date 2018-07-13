var banner = require('../partials/banner')
var etagged = require('./etagged')
var footer = require('../partials/footer')
var html = require('./html')
var nav = require('../partials/nav')
var preamble = require('../partials/preamble')

var handler
module.exports = function (request, response) {
  /* istanbul ignore else */
  if (!handler) {
    handler = etagged('text/html; charset=ASCII', html`
${preamble('Pricing')}
${banner()}
${nav()}
<main>
  <p>
    Sending an NDA that&rsquo;s never countersigned costs nothing.
    Sending an NDA that you cancel costs nothing.
    Sending an NDA that the other side rejects costs nothing.
  </p>
  <p class=bigPrice>
    $${process.env.USE_PRICE}
  </p>
  <p>
    Successfully cosigning an NDA costs
    ${process.env.USE_PRICE}
    United States Dollars.
    This price is charged when the other side countersigns.
    You must use a credit card to pay.
  </p>
  <p class=bigPrice>
    $${process.env.FILL_PRICE}
  </p>
  <p>
    Successfully cosigning an NDA prescribed by
    an attorney costs
    ${process.env.FILL_PRICE}
    United States Dollars.
    This price is charged when the other side countersigns.
    You must use a credit card to pay.
  </p>
  <p class=bigPrice>
    $${process.env.PRESCRIBE_PRICE}
  </p>
  <p>
    Prescribing an NDA for client use costs
    ${process.env.PRESCRIBE_PRICE}
    United States Dollars.
    This price is charged when the prescription
    is created.
  </p>
</main>
${footer()}`)
  }
  handler(request, response)
}
