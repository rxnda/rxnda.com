var banner = require('../partials/banner')
var etagged = require('./etagged')
var footer = require('../partials/footer')
var html = require('./html')
var nav = require('../partials/nav')
var preamble = require('../partials/preamble')

module.exports = etagged('text/html; charset=ASCII', html`
${preamble()}
${banner()}
${nav()}
<main>
  <h2>Future</h2>

  <blockquote>
    <p>
      <abbr title='nondisclosure agreements'>NDAs</abbr>
      are everywhere.  Everyone gets used to throwing
      them around.  So it&rsquo;s hard to convince clients
      how hard is to write a good one, and how much a good
      fit is worth.
    </p>
    <p>
      At the same time, I&rsquo;m sick of charging clients
      niggling fractions of a pricey hour to confirm that,
      yes, the crusty form they&rsquo;ve been sent is what
      we all expected, obscured by no more than the usual
      pointless variation.  Clients have better use for
      the money, and we all have better use for the time.
    </p>
    <footer>&mdash; <cite>K.E. Mitchell</cite></footer>
  </blockquote>

  <p>
    RxNDA&rsquo;s approach is somewhat newfangled.
    Lawyers and clients should judge its service on
    its merits.  But in the position of a customer,
    we&rsquo;d appreciate some sense of the people
    behind the website.  What they&rsquo;re thinking.
    What they&rsquo;re planning.
  </p>
  <p>
    Here&rsquo;s a snapshot of current thinking.
    These plans are very much subject to change.
  </p>

  <h3>Prescription System</h3>
  <p>
    On the software side, we plan to add support for
    &ldquo;prescriptions&rdquo;: private combinations of
    selected forms, prefilled blanks, and additional notes
    that attorneys can use to communicate which form to
    use, when, and how, to specific clients.  The site
    would send the prescribing attorney a private link
    they can share with the client.
  </p>
  <p>
    The tentative plan is to charge a flat fee per
    prescription, good for a limited time, say six
    months or one year, and to reduce the cost per NDA
    signed through the site for NDAs sent &ldquo;on
    prescription&rdquo;.
  </p>

  <h3>Improve Forms</h3>
  <p>
    Good form NDAs are refined products of highly technical
    writing.  Even the best writing and technical products
    can always be improved.  The law changes.  Needs
    change.  The craft of contract drafting progresses.
    Good form NDAs must evolve.
  </p>
  <p>
    Budget permitting, RxNDA will invest earnings in
    contracts with lawyers to review and revise existing
    RxNDA forms.  Ideally, on a regular basis.
    The &ldquo;edition&rdquo; system is built to describe
    improvements to the forms over time, so it&rsquo;s as
    quick and easy as possible for lawyers to assess new
    editions for use by their clients.
  </p>

  <h3>More Forms</h3>
  <p>
    The nearly universal term &ldquo;NDA&rdquo; disguises
    a great deal of variation in terms between industries,
    especially when peculiar regulation applies.
  </p>
  <p>
    Budget permitting, RxNDA will invest earnings in
    contracts with lawyers to prepare additional form
    NDAs, for more situations, to give everyone access
    to a public set of off-the-shelf NDAs.  RxNDA will
    make these forms available for sending via rxnda.com,
    as well as to download and use under permissive public
    licenses.
  </p>
</main>
${footer()}`)
