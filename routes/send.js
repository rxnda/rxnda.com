var decodeTitle = require('../util/decode-title')
var encodeTitle = require('../util/encode-title')
var escape = require('escape-html')
var notFound = require('./not-found')
var pump = require('pump')
var readTemplate = require('./read-template')
var spell = require('reviewers-edition-spell')
var trumpet = require('trumpet')

module.exports = function (configuration, request, response) {
  var title = decodeTitle(request.params.title)
  if (!configuration.forms.hasOwnProperty(title)) {
    return notFound.apply(null, arguments)
  }
  var edition = configuration.forms[title].find(function (edition) {
    return edition.edition === request.params.edition
  })
  if (!edition) {
    return notFound.apply(null, arguments)
  }

  if (request.method === 'POST') {
    post(configuration, request, response, edition)
  } else {
    get(configuration, request, response, edition)
  }
}

function get (configuration, request, response, edition) {
  var body = trumpet()
  response.setHeader('Content-Type', 'text/html; charset=ASCII')
  pump(body, response)
  body.select('main')
    .createWriteStream()
    .end(form(configuration, edition))
  pump(readTemplate('send.html'), body)
}

function form (configuration, edition) {
  return (
`
  <noscript>
    <p>JavaScript has been disabled in your browser.</p>
    <p>You must enabled JavaScript to send.</p>
  </noscript>
  <form
    id=form
    method=post
    action=/send/${encodeTitle(edition.title)}/${edition.edition}/>
  <h2>Send <cite>${escape(edition.title)}, ${spell(edition.edition)}</cite></h2>
  <p>
    <a
        href=https://commonform.org/forms/${edition.hash}
        target=_blank
      >Review the text of the form on commonform.org.</a>
  </p>
  ${draftWarning()}
  ${inputs()}
  ${signatures(edition.signatures)}
  <section id=payment>
    <h3>Credit Card Payment</h3>
    <div id=card></div>
    <div id=card-errors></div>
  </section>
  <section class=information>
    <h3>Next Steps</h3>
    <p>Once you press Sign &amp; Send:</p>
    <ol>
      <li>
        The site will send the other side a secret link that they
        can use to countersign online.
      </li>
      <li>
        The site will send you an e-mail with a secret link that
        you can use to cancel before the other side countersigns.
      </li>
      <li>
        The site will authorize a charge of
        $${configuration.prices.use} to your credit card now.
      </li>
      <li>
        If the other side countersigns within seven days, the site will
        make the authorized charge of $${configuration.prices.use}
        to your credit card.  If the other side does not countersign
        in seven days, of you cancel before they countersign, your
        credit card will not be charged.
      </li>
    </ol>
  </section>
  <input type=submit value='Sign &amp; Send'>
</form>
`
  )

  function draftWarning () {
    if (edition.edition.endsWith('d')) {
      return `
<p class=warning>
  This is a draft form, not a final, published edition.  Unless you
  have a specific reason to prefer this particular draft, you should
  probably use a published edition of the form, instead.
</p>
      `
    } else {
      return ''
    }
  }

  function inputs () {
    if (edition.directions.length !== 0) {
      var list = edition
        .directions
        .map(function (direction) {
          var name = (
            'blanks-' +
            direction
              .blank
              .map(function (element) {
                return element.toString()
              })
              .join(',')
          )
          return input(name, direction.label, direction.notes)
        })
        .join('')
      return `
  <section class=blanks>
    <h3>Fill in the Blanks</h3>
    ${list}
  </section>
  `
    } else {
      return ''
    }
  }

  function signatures (data) {
    var sender = data[0]
    var recipient = data[1]
    return (
`
<section class=signatures>
  <h3>Signatures</h3>

  <section class=ownSignature>
    <h4>Your Side&rsquo;s Signature</h4>
    ${senderBlock(sender)}
    ${
      sender.information
        .map(function (name) {
          return input(
            'signatures-sender-' + name,
            (name === 'date' ? '' : 'Your ') +
            name[0].toUpperCase() + name.slice(1),
            [],
            name === 'date'
              ? new Date().toLocaleDateString()
              : undefined
          )
        })
        .join('')
    }
  </section>

  <section class=theirSignature>
    <h4>The Other Side</h4>
    ${recipientBlock(recipient)}
    <section class=field>
      <label for=signatures-recipient-email>Their Email</label>
      ${asterisk()}
      <input
          name=signatures-recipient-email
          type=email
          required>
    </section>
  </section>
</section>
`
    )
  }
}

function senderBlock (signature) {
  if (Array.isArray(signature.entities)) {
    // Entity Signatory
    return (
      input('signatures-sender-company-name', 'Your Company&rsquo;s Name', [
        'Enter the legal name of your company.',
        'For example, &ldquo;YourCo, Inc.&rdquo;.'
      ]) +
      input('signatures-sender-name', 'Your Name', [
        'Enter your full legal name.'
      ]),
      input('signatures-sender-title', 'Your Title', [
        'Enter your title at your company.',
        'For example, &ldquo;Chief Executive Officer&rdquo;.'
      ]),
      byline()
    )
  } else {
    // Individual Signatory
    return (
      input('signatures-sender-name', 'Your Name', [
        'Enter your full legal name.'
      ]) +
      byline()
    )
  }
}

function recipientBlock (signature) {
  if (Array.isArray(signature.entities)) {
    // Entity Signatory
    return (
      input('signatures-recipient-company-name', 'Their Company Name', [
        'Optionally enter the legal name of the other side&rsquo;s company.',
        'For example, &ldquo;TheirCo, LLC&rdquo;.',
        'If you leave this blank, the recipient can fill it out.'
      ]) +
      input('signatures-recipient-name', 'Their Name', [
        'Optionally enter the person who will sign for the other side.',
        'If you leave this blank, the recipient can fill it out.'
      ]) +
      input('signatures-recipient-title', 'Their Title', [
        'Optionally enter their title at the company.',
        'For example, &ldquo;Chief Executive Officer&rdquo;.',
        'If you leave this blank, the recipient can fill it out.'
      ])
    )
  } else {
    // Individual Signatory
    return (
      input('signatures-recipient-name', 'Their Name', [
        'Enter the other side&rsquo;s full legal name.',
        'For example, &ldquo;Jane Doe&rdquo;.',,
        'If you leave this blank, the recipient can fill it out.'
      ])
    )
  }
}

function input (name, label, notes, value) {
  if (value) {
    return (
`
<section class=field>
  <label for=${name}>${label}</label>
  <input
      name=${name}
      value=${value}
      type=text
      required
      disabled>
  ${paragraphs(notes)}
</section>
`
    )
  } else {
    var required = (
      name.startsWith('signatures-sender-') ||
      name.startsWith('blanks-')
    )
    return (
`
<section class=field>
  <label for='${name}'>${label}</label>
  ${required ? asterisk() : ''}
  <input
      name=${name}
      ${name === 'signatures-sender-name' ? 'id=name' : ''}
      type=${name === 'email' ? 'email' : 'text'}
      ${required ? 'required' : ''}>
  ${paragraphs(notes)}
</section>
`
    )
  }
}

function asterisk () {
  return '<span class=asterisk>*</span>'
}

function byline () {
  return `
<section class=field>
  <label for=signatures-sender-signature>Signature</label>
  ${asterisk()}
  <input
    id=signature
    class=signature
    name=signatures-sender-signature
    type=text
    required>
  <p class=note>
    To sign the form, enter your name again, exactly as you did before.
  </p>
  <p class=note>
    By signing here and clicking Sign &amp; Send below, you offer to
    enter into a legally binding contract, on the terms of the form,
    with the other side.
  </p>
</section>
  `
}

function paragraphs (array) {
  return array
    .map(function (element) {
      return `<p class=note>${element}</p>`
    })
    .join('')
}

function post (configuration, request, response, edition) {
  response.end()
}
