var Busboy = require('busboy')
var cancelPath = require('../data/cancel-path')
var chargePath = require('../data/charge-path')
var crypto = require('crypto')
var decodeTitle = require('../util/decode-title')
var ecb = require('ecb')
var encodeTitle = require('../util/encode-title')
var escape = require('escape-html')
var formatEmail = require('../util/format-email')
var fs = require('fs')
var email = require('../email')
var mkdirp = require('mkdirp')
var notFound = require('./not-found')
var path = require('path')
var pump = require('pump')
var readTemplate = require('./read-template')
var runParallel = require('run-parallel')
var runSeries = require('run-series')
var signPath = require('../data/sign-path')
var spell = require('reviewers-edition-spell')
var stripe = require('stripe')
var trumpet = require('trumpet')
var validPost = require('../data/valid-post')

module.exports = function (configuration, request, response) {
  var title = decodeTitle(request.params.title)
  if (!configuration.forms.hasOwnProperty(title)) {
    return notFound.apply(null, arguments)
  }
  var edition = configuration.forms[title].find(function (edition) {
    return edition.edition === request.params.edition
  })

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
  var address = (
    configuration.email.sender + '@' +
    configuration.email.domain
  )
  return `
<noscript>
  <p>JavaScript has been disabled in your browser.</p>
  <p>You must enabled JavaScript to send.</p>
</noscript>
<form
  id=sendForm
  method=post
  action=/send/${encodeTitle(edition.title)}/${edition.edition}/>
  <h2>
    Send
    <cite>${escape(edition.title)}, ${spell(edition.edition)}</cite>
  </h2>
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
        ${escape(address)} will send the other side a secret link
        that they can use to countersign online.
      </li>
      <li>
        ${escape(address)} will send you an e-mail with a secret link
        that you can use to cancel before the other side countersigns.
      </li>
      <li>
        ${escape(configuration.domain)} will authorize a charge of
        $${configuration.prices.use} to your credit card now.
      </li>
      <li>
        If the other side countersigns within seven days,
        ${escape(address)} will make the authorized charge of
        $${configuration.prices.use} to your credit card.  If the
        other side does not countersign in seven days, of you cancel
        before they countersign, your credit card will not be charged.
      </li>
    </ol>
  </section>
  <input id=submitButton type=submit value='Sign &amp; Send' >
</form>`

  function draftWarning () {
    if (edition.edition.endsWith('d')) {
      return `
<p class=warning>
  This is a draft form, not a final, published edition.  Unless you
  have a specific reason to prefer this particular draft, you should
  probably use a published edition of the form, instead.
</p>`
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
            'directions-' +
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
</section>`
    } else {
      return ''
    }
  }

  function signatures (data) {
    var sender = data[0]
    var recipient = data[1]
    return `
<section class=signatures>
  <h3>Signatures</h3>

  <section class=ownSignature>
    <h4>Your Side&rsquo;s Signature</h4>
    ${senderBlock(sender)}
    ${
      sender.information
        .filter(function (name) {
          return name !== 'date'
        })
        .map(function (name) {
          return input(
            'signatures-sender-' + name,
            'Your ' + name[0].toUpperCase() + name.slice(1),
            []
          )
        })
        .join('')
    }
  </section>

  <section class=theirSignature>
    <h4>The Other Side&rsquo;s Signature</h4>
    <section class=field>
      <label for=signatures-recipient-email>Their Email</label>
      ${asterisk()}
      <input
          name=signatures-recipient-email
          type=email
          required>
    </section>
    ${recipientBlock(recipient)}
  </section>
</section>`
  }
}

function senderBlock (signature) {
  if (Array.isArray(signature.entities)) {
    // Entity Signatory
    return (
      input('signatures-sender-company', 'Your Company&rsquo;s Name', [
        'Enter the legal name of your company.',
        'For example, &ldquo;YourCo, Inc.&rdquo;.'
      ]) +
      input(
        'signatures-sender-form', 'Your Company&rsquo;s Legal Form', [
          'Enter the legal form of your company.',
          'For example, &ldquo;corporation&rdquo;.'
        ]
      ) +
      input(
        'signatures-sender-jurisdiction',
        'Your Company&rsquo;s Legal Jurisdiction',
        [
          'Enter the legal jurisdiction under whose laws ' +
          'your company is formed.',
          'For example, &ldquo;Delaware&rdquo;.'
        ]
      ) +
      input('signatures-sender-name', 'Your Name', [
        'Enter your full legal name.'
      ]) +
      input('signatures-sender-title', 'Your Title', [
        'Enter your title at your company.',
        'For example, &ldquo;Chief Executive Officer&rdquo;.'
      ]) +
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
      input(
        'signatures-recipient-company', 'Their Company Name',
        [
          'Optionally enter the legal name of the other ' +
          'side&rsquo;s company.',
          'For example, &ldquo;TheirCo, LLC&rdquo;.',
          'If you leave this blank, the recipient can fill it out.'
        ]
      ) +
      input(
        'signatures-recipient-form', 'Their Company&rsquo;s Legal Form',
        [
          'Enter the legal form of their company.',
          'For example, &ldquo;limited liability company&rdquo;.'
        ]
      ) +
      input(
        'signatures-recipient-jurisdiction',
        'Their Company&rsquo;s Legal jurisdiction',
        [
          'Enter the legal jurisdiction under whose laws their ' +
          'company is formed.',
          'For example, &ldquo;Delaware&rdquo;.'
        ]
      ) +
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
      input(
        'signatures-recipient-name', 'Their Name', [
          'Enter the other side&rsquo;s full legal name.',
          'For example, &ldquo;Jane Doe&rdquo;.',
          'If you leave this blank, the recipient can fill it out.'
        ]
     )
    )
  }
}

function input (name, label, notes) {
  var required = (
    name.startsWith('signatures-sender-') ||
    name.startsWith('directions-')
  )
  if (name.endsWith('address')) {
    return `
<section class=field>
  <label for='${name}'>${label}</label>
  ${required ? asterisk() : ''}
  <textarea
      rows=3
      name=${name}
      ${required ? 'required' : ''}
  ></textarea>
</section>`
  } else {
    return `
<section class=field>
  <label for='${name}'>${label}</label>
  ${required ? asterisk() : ''}
  <input
      name='${name}'
      ${name === 'signatures-sender-name' ? 'id=name' : ''}
      type=${name === 'email' ? 'email' : 'text'}
      ${required ? 'required' : ''}>
  ${paragraphs(notes)}
</section>`
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
</section>`
}

function paragraphs (array) {
  return array
    .map(function (element) {
      return `<p class=note>${element}</p>`
    })
    .join('')
}

function post (configuration, request, response, form) {
  var data = {
    signatures: {
      sender: {},
      recipient: {}
    },
    directions: [],
    token: null
  }
  pump(
    request,
    new Busboy({headers: request.headers})
      .on('field', function (name, value) {
        if (value) {
          value = value
            .trim()
            .replace(/\r?\n/, '\n')
          var key
          if (name.startsWith('signatures-sender-')) {
            key = name.slice(18)
            if (validSignatureProperty(key)) {
              data.signatures.sender[key] = value
            }
          } else if (name.startsWith('signatures-recipient-')) {
            key = name.slice(21)
            if (validSignatureProperty(key)) {
              data.signatures.recipient[key] = value
            }
          } else if (name.startsWith('directions-')) {
            data.directions.push({
              blank: name
                .slice(11)
                .split(',')
                .map(function (element) {
                  return /\d/.test(element)
                    ? parseInt(element)
                    : element
                }),
              value: value
            })
          } else if (name === 'token') {
            data.token = value
          }
        }
      })
      .once('finish', function () {
        request.log.info({data: data})
        if (!validPost(data, form)) {
          response.statusCode = 400
          response.end()
        } else {
          write(configuration, request, response, data, form)
        }
      })
  )
}

var signatureProperties = require('../data/signature-properties')

function validSignatureProperty (name) {
  return signatureProperties.includes(name)
}

function write (configuration, request, response, data, form) {
  var domain = configuration.domain
  var timestamp = new Date().toISOString()
  data.timestamp = timestamp
  data.form = form
  data.price = configuration.prices.use
  var sender = data.signatures.sender
  var senderName = sender.company || sender.name
  var recipient = data.signatures.recipient
  var recipientName = (
    recipient.company || recipient.name || recipient.email
  )
  runSeries([
    function generateCapabilities (done) {
      runParallel([
        capabilityToProperty(data, 'cancel'),
        capabilityToProperty(data, 'sign')
      ], done)
    },
    function writeFiles (done) {
      runParallel([
        function writeCancelFile (done) {
          mkdirpThenWriteFile(
            cancelPath(configuration, data.cancel), data.sign, done
          )
        },
        function writeSignFile (done) {
          mkdirpThenWriteFile(
            signPath(configuration, data.sign), data, done
          )
        }
      ], done)
    },
    function sendEmails (done) {
      runSeries([
        function emailCancelLink (done) {
          email(configuration, {
            to: sender.email,
            subject: 'Your ' + domain + ' Cancellation Link',
            text: formatEmail(configuration, [
              'You have offered to sign a nondisclosure agreement ' +
              (sender.company ? 'on behalf of ' + sender.company : '') +
              ' with ' + recipientName + ' ' +
              'on the terms of ' + domain + '\'s ' +
              form.title + ' form agreement, ' +
              spell(form.edition) + '.',
              'To cancel your request before the other side signs, ' +
              'visit this link:',
              'https://' + domain + '/cancel/' + data.cancel,
              'Keep this link safe and secure.  The special code ' +
              'within it is your digital key to cancel ' +
              'the request.'
            ].join('\n\n'))
          }, done)
        },
        function emailSignLink (done) {
          email(configuration, {
            to: recipient.email,
            subject: 'NDA Offer from ' + senderName,
            text: formatEmail(configuration, [
              senderName + ' offers to sign a nondisclosure ' +
              'agreement with ' +
              (recipient.company ? recipient.company : 'you') + ' ' +
              'via ' + domain + '.',
              'To review the offer and sign or decline online visit: ' +
              'https://' + domain + '/countersign/' + data.sign,
              'Keep this link safe and secure.  The special code ' +
              'within it is your digital key to see and sign ' +
              'the NDA.'
            ].join('\n\n'))
          }, done)
        }
      ], done)
    },
    function handlePayment (done) {
      var chargeID = null
      runSeries([
        function createCharge (done) {
          stripe(configuration.stripe.private).charges.create({
            amount: data.price * 100, // dollars to cents
            currency: 'usd',
            description: domain,
            // Important: Authorize, but don't capture/charge yet.
            capture: false,
            source: data.token
          }, ecb(done, function (charge) {
            chargeID = charge.id
            request.log.info({charge: chargeID})
            done()
          }))
        },
        function writeChargeFile (done) {
          mkdirpThenWriteFile(
            chargePath(configuration, data.sign), chargeID, done
          )
        },
        function emailReceipt (done) {
          email(configuration, {
            to: data.signatures.sender.email,
            subject: 'Your ' + domain + ' Order',
            text: formatEmail(configuration, [
              'Thank you for sending an NDA with ' + domain + '!',
              'Form: ' + form.title,
              'Edition: ' + form.edition,
              // TODO: Detailed text summary in receipt e-mail.
              domain + ' will authorize a payment of ' +
              '$' + data.price + ' now, but your card will not be ' +
              'charged unless and until the other side countersigns.'
            ].join('\n\n'))
          }, done)
        }
      ], done)
    }
  ], function (error) {
    /* istanbul ignore if */
    if (error) {
      request.log.error(error)
      response.statusCode = 500
      response.end()
    } else {
      var body = trumpet()
      response.setHeader('Content-Type', 'text/html; charset=ASCII')
      pump(body, response)
      body.select('main')
        .createWriteStream()
        .end(success(configuration, data))
      pump(readTemplate('sent.html'), body)
    }
  })

  function capabilityToProperty (object, key) {
    return function (done) {
      randomCapability(ecb(done, function (capability) {
        var logObject = {}
        logObject[key] = object[key] = capability
        request.log.info(logObject)
        done()
      }))
    }
  }

  function mkdirpThenWriteFile (filePath, data, callback) {
    runSeries([
      function (done) {
        mkdirp(path.dirname(filePath), done)
      },
      function (done) {
        var json = JSON.stringify(data)
        fs.writeFile(filePath, json, ecb(done, function () {
          request.log.info('wrote ' + filePath)
          done()
        }))
      }
    ], callback)
  }
}

function success (configuration, data) {
  var sender = data.signatures.sender
  var recipient = data.signatures.recipient
  var recipientName = (
    recipient.company || recipient.name || recipient.email
  )
  var domain = configuration.domain
  return `
<h2 class=sent>NDA Sent!</h2>
<p>
  You have offered to enter a nondisclosure agreement
  ${sender.company ? 'on behalf of ' + sender.company : ''}
  with ${recipientName} on the terms of ${domain}&rsquo;s
  ${data.form.title}  form agreement, ${spell(data.form.edition)}.
</p>
<p>
  To cancel your request before the other side signs, visit
  <a href=/cancel/${data.cancel}>this link</a>.
</p>`
}

function randomCapability (callback) {
  crypto.randomBytes(32, ecb(callback, function (bytes) {
    callback(null, bytes.toString('hex'))
  }))
}
