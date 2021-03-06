var Busboy = require('busboy')
var docxMessage = require('../messages/docx')
var ecb = require('ecb')
var email = require('../email')
var errorsFor = require('../util/errors-for')
var escape = require('../util/escape')
var expirationDate = require('../data/expiration-date')
var expired = require('../data/expired')
var fs = require('fs')
var internalError = require('./internal-error')
var normalizeLineBreaks = require('../data/normalize-line-breaks')
var notFound = require('./not-found')
var novalidate = require('../util/novalidate')
var path = require('path')
var pump = require('pump')
var readJSONFile = require('../data/read-json-file')
var receiptMessage = require('../messages/receipt')
var runSeries = require('run-series')
var sameArray = require('../data/same-array')
var signPath = require('../data/sign-path')
var signatureProperties = require('../data/signature-properties')
var spell = require('reviewers-edition-spell')
var stripe = require('stripe')
var validCountersignPost = require('../data/valid-countersign-post')
var xtend = require('xtend')

var banner = require('../partials/banner')
var byline = require('../partials/byline')
var errorsMessage = require('../partials/errors-message')
var footer = require('../partials/footer')
var html = require('./html')
var input = require('../partials/input')
var nav = require('../partials/nav')
var preamble = require('../partials/preamble')
var termsCheckbox = require('../partials/terms-checkbox')

module.exports = function counterisgn (request, response) {
  var signFile = signPath(request.params.capability)
  readJSONFile(signFile, function (error, data) {
    if (error) {
      /* istanbul ignore else */
      if (error.code === 'ENOENT') return respond404()
      return internalError(request, response, error)
    }
    if (expired(data)) return respond404()
    if (request.method === 'POST') return post(request, response, data)
    get(request, response, data)
  })

  function respond404 () {
    notFound(request, response, [
      'If you followed a link to this page to countersign an NDA ' +
      'offer the offer may have expired, the other side may have ' +
      'declined, or it may have been deleted from the system ' +
      'after countersigning.'
    ])
  }
}

function get (request, response, send, postData) {
  response.setHeader('Content-Type', 'text/html; charset=ASCII')
  response.statusCode = postData ? 400 : 200
  var recipient = send.signatures.recipient
  var sender = send.signatures.sender
  var expires = expirationDate(send)
  response.end(html`
${preamble('Countersign')}
${banner()}
<!-- no nav -->
<main>
  <noscript>
    <p>JavaScript has been disabled in your browser.</p>
    <p>You must enabled JavaScript to sign.</p>
  </noscript>
  <form
    method=post
    action=/countersign/${send.sign}
    ${novalidate(request)}>
    <p>
      ${escape(sender.name)}
      (<a href="mailto:${encodeURIComponent(sender.email)}"
        >${escape(sender.email)}</a>)
      offers to enter into an
      NDA with ${escape(recipient.company || 'you')}
      on the terms of an RxNDA standard form NDA.
      You can accept the offer by countersigning online, at this
      address, until ${escape(expires.toLocaleString())}.
    </p>
    ${(send.directions.length !== 0) && html`
      <dl>
        <dt>Form</dt><dd>${escape(send.form.title)}</dd>
        <dt>Edition</dt><dd>${escape(spell(send.form.edition))}</dd>
        ${send.directions.map(function (direction) {
          var label = send.form.directions.find(function (element) {
            return sameArray(element.blank, direction.blank)
          }).label
          return `
            <dt>${escape(label)}</dt>
            <dd>&ldquo;${escape(direction.value)}&rdquo;</dd>
          `
        })}
      </dl>
    `}
    ${errorsMessage(postData)}
    <p>
      <a
          href=/view/${send.sign}
          target=_blank>
        Click here to view the full text of the NDA.
      </a>
    </p>
    <p>
      <a
          href=/
          target=_blank>
        Click here to read more about RxNDA and how it works.
      </a>
    </p>
    <p>
      <a
          href=/cancel/${send.cancel}
          target=_blank>
        Click here to visit a page where you can decline this request.
      </a>
    </p>
    <section class=signatures>
      <h3>Signatures</h3>
      <section>
        <h4>
          ${escape(
            sender.company ? sender.company : sender.name
          )}&rsquo;s
          Signature
        </h4>
        <p>
          ${escape(sender.name)} signed
          ${
            sender.company
              ? (
                'for ' +
                escape(sender.company) + ', ' +
                (startsWithVowel(sender.jurisdiction) ? 'an' : 'a') +
                ' ' + escape(sender.jurisdiction) + ' ' +
                escape(sender.form)
              )
              : ' as an individual '
          }
          ${escape(new Date(send.timestamp).toLocaleString())}.
        </p>
      </section>
      <section>
        <h4>Your Signature</h4>
        ${recipientBlock(send.form.signatures[1], recipient, postData)}
        ${byline(
          errorsFor('signature-recipient-signature', postData),
          'recipient',
          `
          By signing here and clicking Countersign below, you
          enter into a legally binding contract, on the terms they
          proposed, with the other side.
          `,
          recipient.name
        )}
        ${
          send.form.signatures[1].information
            .filter(function (name) {
              return name !== 'email' && name !== 'date'
            })
            .map(function (suffix) {
              var name = 'signatures-recipient-' + suffix
              return input({
                name: name,
                required: true,
                label: (suffix === 'date' ? '' : 'Your ') + suffix[0].toUpperCase() + suffix.slice(1),
                prior: postData ? {value: postData[suffix]} : undefined,
                errors: errorsFor(name, postData)
              })
            })
        }
        <section class=information>
          <p>When you press Countersign:</p>
          <ol>
            <li>
              ${escape(send.address)} will e-mail both you and the other
              side, attaching a fully-signed copy of the NDA.
            </li>
            <li>
              ${escape(process.env.DOMAIN)} will charge the sender.
              You will not be charged.
            </li>
          </ol>
        </section>
      </section>
    </section>
    ${termsCheckbox(postData ? errorsFor('terms', postData) : [])}
    <input id=submitButton type=submit value='Countersign' >
  </form>
</main>
${footer('countersign')}`)
}

function recipientBlock (page, recipient, postData) {
  if (Array.isArray(page.entities)) {
    // Entity Signatory
    return (
      inputWithPrior(
        'signatures-recipient-company', 'Your Company Name',
        [
          'Enter the legal name of your company.',
          'For example: “SomeCo, LLC”',
          'If you leave this blank, the recipient can fill it out.'
        ],
        recipient.company
      ) +
      inputWithPrior(
        'signatures-recipient-form', 'Your Company’s Legal Form',
        [
          'Enter the legal form of your company.',
          'For example: “limited liability company”'
        ],
        recipient.form
      ) +
      inputWithPrior(
        'signatures-recipient-jurisdiction',
        'Your Company’s Legal Jurisdiction',
        [
          'Enter the legal jurisdiction under whose laws your ' +
          'company is formed.',
          'For example: “Delaware”'
        ],
        recipient.jurisdiction
      ) +
      inputWithPrior(
        'signatures-recipient-name', 'Your Name', [
          'Enter your name.'
        ],
        recipient.name
      ) +
      inputWithPrior(
        'signatures-recipient-title', 'Your Title', [
          'Enter your title at the company.',
          'For example: “Chief Executive Officer”'
        ],
        recipient.title
      )
    )
  }
  // Individual Signatory
  return (
    inputWithPrior(
      'signatures-recipient-name', 'Your Name',
      [
        'Enter your full legal name.',
        'For example: “Jane Doe”'
      ],
      recipient.name
    )
  )

  function inputWithPrior (name, label, notes, sendValue) {
    if (sendValue) {
      return input({
        name: name,
        required: true,
        label: label,
        notes: notes,
        prior: {
          value: sendValue,
          readonly: true,
          prefilled: true
        }
      })
    }
    var prior
    var suffix = name.split('-').reverse()[0]
    if (postData) prior = {value: postData[suffix]}
    return input({
      name: name,
      required: true,
      label: label,
      notes: notes,
      prior: prior,
      errors: errorsFor(name, postData)
    })
  }
}

function startsWithVowel (string) {
  return ['a', 'e', 'i', 'o', 'u', 'y']
    .includes(string[0].toLowerCase())
}

function post (request, response, send) {
  var countersign = {}
  pump(
    request,
    new Busboy({headers: request.headers})
      .on('field', function (name, value) {
        if (value) {
          if (name.startsWith('signatures-recipient-')) {
            var key = name.slice(21)
            if (signatureProperties.includes(key)) {
              countersign[key] = normalizeLineBreaks(value.trim())
            }
          } else if (name === 'terms') {
            countersign.terms = value
          }
        } else {
          request.log.info(name)
        }
      })
      .once('finish', function () {
        request.log.info({countersign: countersign})
        var errors = validCountersignPost(countersign, send.form)
        if (errors.length !== 0) {
          countersign.errors = errors
          get(request, response, send, countersign)
        } else {
          countersign.date = new Date().toISOString()
          var data = {
            send: send,
            countersign: countersign,
            address: (
              process.env.MAILGUN_SENDER + '@' +
              process.env.MAILGUN_DOMAIN
            )
          }
          write(request, response, data)
        }
      })
  )
}

function write (request, response, data) {
  runSeries([
    function emailDOCX (done) {
      docxMessage(data, ecb(done, function (message) {
        request.log.info('generated message')
        email(request.log, message, done)
      }))
    },
    function rmFiles (done) {
      runSeries([
        function rmSignFile (done) {
          fs.unlink(
            path.join(process.env.DIRECTORY, 'sign', data.send.sign),
            done
          )
        },
        continueOnError(function rmCancelFile (done) {
          fs.unlink(
            path.join(process.env.DIRECTORY, 'cancel', data.send.cancel),
            done
          )
        })
      ], done)
    },
    function chargeSender (done) {
      var chargeFile = path.join(process.env.DIRECTORY, 'charge', data.send.sign)
      var chargeID
      runSeries([
        function readChargeID (done) {
          readJSONFile(chargeFile, ecb(done, function (parsed) {
            chargeID = parsed
            done()
          }))
        },
        function captureCharge (done) {
          if (chargeID === 'coupon') {
            request.log.info('applied coupon')
            return done()
          }
          stripe(process.env.STRIPE_SECRET_KEY)
            .charges
            .capture(chargeID, ecb(done, function (charge) {
              request.log.info({charge: charge})
              done()
            }))
        },
        continueOnError(function rmChargeFile (done) {
          fs.unlink(chargeFile, done)
        }),
        function sendReceipt (done) {
          email(request.log, receiptMessage(data), done)
        }
      ], done)
    }
  ], function (error) {
    /* istanbul ignore if */
    if (error) {
      request.log.error(error)
      response.statusCode = 500
      return response.end()
    }
    response.setHeader('Content-Type', 'text/html; charset=ASCII')
    var sender = data.send.signatures.sender
    var senderName = sender.company || sender.name
    var recipient = xtend(
      data.send.signatures.recipient,
      data.countersign
    )
    var form = data.send.form
    response.end(html`
${preamble('Agreed')}
${banner()}
${nav()}
<main>
  <h2 class=agreed>NDA Agreed!</h2>
  <p>
    You have countersigned a nondisclosure agreement
    ${
      recipient.company
        ? 'on behalf of ' + escape(recipient.company)
        : ''
    }
    with ${escape(senderName)} on the terms of the
    ${escape(form.title)} form agreement,
    ${spell(form.edition)}.
  </p>
  <p>
    You will receive a fully-signed copy by e-mail
    from ${escape(data.address)} shortly.
  </p>
</main>
${footer()}`)
  })

  function continueOnError (task) {
    return function (done) {
      task(function (error) {
        if (error) request.log.error(error, 'continuing')
        done()
      })
    }
  }
}
