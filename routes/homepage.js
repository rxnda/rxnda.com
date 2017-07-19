var banner = require('../partials/banner')
var footer = require('../partials/footer')
var html = require('./html')
var nav = require('../partials/nav')
var preamble = require('../partials/preamble')

module.exports = function (configuration, request, response) {
  response.setHeader('Content-Type', 'text/html; charset=ASCII')
  response.end(html`
${preamble()}
${banner()}
${nav()}
<main>
  <p>
    RxNDA is a simple Internet service for proposing
    and signing standardized commercial nondisclosure
    agreements.  It works 1-2-3:
  </p>
  <ol>
    <li>
      Visit <a href=/send>the form picker</a>.  Answer a
      few questions about your needs and click the big button
      to find your form.  Have your lawyer review it to
      make sure it meets your needs.
    </li>
    <li>
      Fill in any blanks on the form, the details for your
      signature, and at least an e-mail address for the
      other side.  Type your name again, in a special box,
      to sign.  Enter your credit card info and click
      the big button.
    </li>
    <li>
      The site will e-mail the other side a link
      to countersign or decline, and you a link to
      cancel. If they countersign within seven days, we
      charge your card and e-mail everybody a complete
      Word <code>.docx</code> copy of the agreement.
      We delete our record of the offer.
    </li>
  </ol>
  <p>
    There&rsquo;s no charge for sending an offer and
    canceling it, or for sending an offer that expires
    after seven days.  We delete our records of canceled
    and expired offers, too.
  </p>
  <p>
    For more information, see our
    <a href=/questions>questions &amp; answers page</a>.
  </p>
</main>
${footer()}`)
}
