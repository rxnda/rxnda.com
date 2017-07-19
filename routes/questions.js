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
  <h2>Questions &amp; Answers</h2>

  <ol>
    <li><a href=#everyone>For Everyone</a></li>
    <li><a href=#lawyers>For Lawyers</a></li>
    <li><a href=#businessfolk>For Businessfolk</a></li>
  </ol>

  <p>
    Feel free to send questions not addressed on this page to
<script>
  var address = function () {
    return ['rxnda.com', 'questions'].reverse().join('@')
  }
  document.write(
    '<a href="mailto:' + address() + '">' + address() + '</a>'
  )
</script>.
  </p>

  <hr>

  <h3 id=everyone>For Everyone</h3>

  <h4 class=question>Who&rsquo;s behind this site?</h4>
  <p>
    RxNDA LLC, a California limited liability company,
    operates this site.  RxNDA LLC is owned and managed by
    <a href=https://kemitchell.com>Kyle E. Mitchell</a>
    of Oakland, California.
  </p>

  <h4 class=question>Who wrote the forms?</h4>
  <p>
    <a href=https://kemitchell.com>Kyle E. Mitchell</a>
    took the original drafts.  For information
    on other contributors, and how to give
    feedback and propose changes yourself, see
    <a href=https://github.com/rxnda/rxnda-forms
      >github.com/rxnda/rxnda-forms</a>.
  </p>

  <h4 class=question>Who wrote the software?</h4>
  <p>
    <a href=https://kemitchell.com>Kyle E. Mitchell</a>
    wrote the software, utilizing many open-source
    software projects.  RxNDA.com makes significant use
    of open-source software under the
    <a href=https://commonform.github.io
      >Common Form project umbrella</a>
    for contract management, preparation, and formatting.
  </p>

  <hr>

  <h3 id=lawyers>For Lawyers</h3>

  <h4 class=question>What about confidential information?</h4>
  <p>
    RxNDA&rsquo;s technical and operational approach
    to information from and about customers is:
  </p>
  <ol>
    <li>Accept as little as possible.</li>
    <li>Put it as few places as possible.</li>
    <li>Get rid of it, all of it, at first practical opportunity.</li>
    <li>No eyeballs or special handling without specific permission.</li>
  </ol>
  <p>
    In a nutshell, we treat information from customers
    like asbestos and lead.  Moving it between parties
    is part of our business.  But we don&rsquo;t want any
    more of it around than necessary, and we sure as Hell
    don&rsquo;t want to touch it.
  </p>

  <h4 class=question>What information do you store?</h4>
  <p>
    For each NDA request, our software creates a single
    file on the server containing the information submitted
    on the NDA send form, minus credit card details, which
    go directly to our payment processor.  That means our
    files have, for example:
  </p>
  <ul>
    <li>date of submission</li>
    <li>the sender&rsquo;s choice of form</li>
    <li>their name</li>
    <li>their e-mail address</li>
    <li>
      their company affiliation, if signing for a company
    </li>
    <li>
      any form blanks they filled in, like purpose or
      governing law state
    </li>
    <li>
      the information they provided about the other side,
      at least an e-mail address
    </li>
  </ul>

  <h4 class=question>How long do you keep it?</h4>
  <p>
    Once an NDA is countersigned or canceled, the site
    deletes the file holding information on the offer.
    A program runs at least once per day to delete files
    for offers expired after seven days.
  </p>
  <p>
    Some offer information may be preserved in server logs.
    Logs linger on a bit longer, in case of technical
    error or issue requiring a record for diagnosis.
    We also delete log entries on a rolling basis.
  </p>

  <h4 class=question>How do the countersign and cancel links work?</h4>

  <p>
    Links sent by e-mail to cancel and countersign
    NDA offers all end with long strings of the
    letters <code>a</code> through <code>f</code> and
    the digits <code>0</code> through <code>9</code>.
    Those characters code a pair of very large numbers,
    chosen at random for each NDA offer.  The numbers work
    like keys.
  </p>
  <p>
    Anyone who receives the link with a key-number can
    visit the page and take the corresponding action.
    If you have the cancel link, you can cancel the offer.
    If you have the countersign link, you can countersign
    or cancel.
  </p>
  <p>
    The security of these links lies in the size of
    the numbers.  Guessing a key-number for a particular
    offer would require the same luck as guessing whether
    a fair coin will land heads or tails 256 six times
    in a row, or guessing the key to a combination lock
    with 115 quattuorvigintillion possible combinations.
    That isn&rsquo;t practical, even with computers.
  </p>

  <h4 class=question>Is this &ldquo;AI&rdquo;?</h4>
  <p>Not even close.</p>

  <hr>

  <h3 id=businessfolk>For Businessfolk</h3>

  <h4 class=question>Are you my lawyer?</h4>
  <p>No.</p>
  <p>
    This website is not your lawyer.  The company behind it
    &hellip; not a law firm, not your law firm.  The people
    who work on RxNDA, from the software to the forms
    &hellip; not your lawyers.  Their law firms &hellip;
    not your law firms.
  </p>
  <p>
    Please hire a lawyer.  All RxNDA forms are designed
    to be easy for lawyers to review and approve.
    This website and RxNDA forms work best when a lawyer
    advises you that a particular edition of a particular
    form meets a particular kind of need, and that you
    can use it repeatedly in that kind of situation.
  </p>
</main>
${footer()}`)
