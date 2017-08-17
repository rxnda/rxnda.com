var etagged = require('./etagged')

var banner = require('../partials/banner')
var footer = require('../partials/footer')
var html = require('./html')
var nav = require('../partials/nav')
var preamble = require('../partials/preamble')

module.exports = etagged('text/html; charset=ASCII', html`
${preamble()}
${banner()}
${nav()}
<main>
  <p>
    RxNDA is a simple Internet service for proposing
    and signing standardized commercial nondisclosure
    agreements.
  </p>
  <p>
    It works 1-2-3:
  </p>
  <ol>
    <li>
      <a href=/send>Pick a standard form</a>.
    </li>
    <li>
      Fill in the blanks, sign, and send online.
    </li>
    <li>
      RxNDA e-mails the other side a link to countersign online.
      Once they&rsquo;ve signed, RxNDA charges your credit card,
      e-mails everyone a fully signed copy, and deletes its records
      of your transaction.
    </li>
  </ol>
  <p>
    There&rsquo;s no charge for sending an offer and
    canceling it, or for sending an offer that expires
    after seven days.  RxNDA deletes records of canceled
    and expired offers, too.
  </p>
  <p>
    For more information, see
    <a href=/questions>Questions &amp; Answers</a>.
  </p>
</main>
${footer()}`)
