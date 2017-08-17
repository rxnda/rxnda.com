var Busboy = require('busboy')
var docxMessage = require('../messages/docx')
var ecb = require('ecb')
var email = require('../email')
var escape = require('../util/escape')
var escapeStringRegexp = require('escape-string-regexp')
var expirationDate = require('../data/expiration-date')
var expired = require('../data/expired')
var fs = require('fs')
var internalError = require('./internal-error')
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
var footer = require('../partials/footer')
var html = require('./html')
var nav = require('../partials/nav')
var paragraphs = require('../partials/paragraphs')
var preamble = require('../partials/preamble')
var termsCheckbox = require('../partials/terms-checkbox')

module.exports = function counterisgn (
  configuration, request, response
) {
  var signFile = signPath(configuration, request.params.capability)
  readJSONFile(signFile, function (error, data) {
    if (error) {
      /* istanbul ignore else */
      if (error.code === 'ENOENT') {
        respond404()
      } else {
        internalError(configuration, request, response, error)
      }
    } else {
      if (expired(data)) {
        respond404()
      } else if (request.method === 'POST') {
        post(configuration, request, response, data)
      } else {
        get(configuration, request, response, data)
      }
    }
  })

  function respond404 () {
    notFound(configuration, request, response, [
      'If you followed a link to this page to countersign an NDA ' +
      'offer the offer may have expired, the other side may have ' +
      'declined, or it may have been deleted from the system ' +
      'after countersigning.'
    ])
  }
}

function get (configuration, request, response, send, postData) {
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
    ${(postData && postData.errors) && html`
      <p class=error>
        Look below for
        ${postData.errors.length === 1 ? 'another box' : 'more boxes'}
        like this one.
      </p>
    `}
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
      <section class=senderSignature>
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
      <section class=yourSignature>
        <h4>Your Signature</h4>
        ${recipientBlock(send.form.signatures[1], recipient, postData)}
        ${byline(recipient, postData)}
        ${
          send.form.signatures[1].information
            .filter(function (name) {
              return name !== 'email' && name !== 'date'
            })
            .map(function (suffix) {
              var name = 'signatures-recipient-' + suffix
              return input(
                name,
                (suffix === 'date' ? '' : 'Your ') +
                suffix[0].toUpperCase() + suffix.slice(1),
                [],
                undefined,
                (postData ? postData[suffix] : undefined),
                errorsFor(name, postData)
              )
            })
        }
        <section class=information>
          <p>When you press Countersign:</p>
          <ol>
            <li>
              ${escape(send.address)} will e-mail both you and the other
              side, attaching a fully-signed Word copy of the NDA.
            </li>
            <li>
              ${escape(configuration.domain)} will charge the sender.
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
        'Your Company&rsquo;s Legal Jurisdiction',
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
  } else {
    // Individual Signatory
    return (
      input(
        'signatures-recipient-name', 'Your Name',
        [
          'Enter your full legal name.',
          'For example: “Jane Doe”'
        ],
        recipient.name
     )
    )
  }

  function inputWithPrior (name, label, notes, value) {
    if (postData) {
      return input(
        name, label, notes, value,
        postData[name.split('-').reverse()[0]],
        errorsFor(name, postData)
      )
    } else {
      return input(name, label, notes, value)
    }
  }
}

function startsWithVowel (string) {
  return ['a', 'e', 'i', 'o', 'u', 'y']
    .includes(string[0].toLowerCase())
}

function input (name, label, notes, sendValue, postValue, errors) {
  if (sendValue) {
    return `
<section class=field>
  <label>${escape(label)}</label>
  <input
      name=${name}
      value='${escape(sendValue)}'
      type=text
      required
      readonly=readonly>
  ${sendValue ? prefilled() : paragraphs(notes)}
</section>`
  } else {
    if (name.endsWith('address')) {
      return html`
<section class=field>
  <label>${label}</label>
  ${asterisk()}
  ${errors && paragraphs(errors, 'error')}
  <textarea
      rows=3
      name=${name}
      required
  >${escape(postValue || '')}</textarea>
</section>`
    } else {
      return html`
<section class=field>
  <label>${label}</label>
  ${asterisk()}
  ${errors && paragraphs(errors, 'error')}
  <input
      name=${name}
      ${name === 'signatures-recipient-name' && 'id=name'}
      type=${name === 'email' ? 'email' : 'text'}
      value="${escape(postValue || '')}"
      required>
  ${paragraphs(notes)}
</section>`
    }
  }

  function prefilled () {
    return notes.length === 0 ? '' : `
<p class=note>
  The sender filled this blank out for you.
  If they did so incorrectly, tell them to resend the request.
</p>`
  }
}

function asterisk () {
  return '<span class=asterisk>*</span>'
}

function byline (recipient, postData) {
  var errors = errorsFor('signatures-recipient-signature', postData)
  return html`
<section class=field>
  <label>Signature</label>
  ${asterisk()}
  ${errors && paragraphs(errors, 'error')}
  <input
    id=signature
    class=signature
    name=signatures-recipient-signature
    type=text
    ${
      recipient.name &&
      `pattern="${escape(escapeStringRegexp(recipient.name))}"`
    }
    autocomplete=off
    required>
  <p class=description>
    To sign the form, enter your name, exactly as above.
  </p>
  <p class=warning>
    By signing here and clicking Countersign below, you
    enter into a legally binding contract, on the terms they
    proposed, with the other side.
  </p>
</section>`
}

function post (configuration, request, response, send) {
  var countersign = {}
  pump(
    request,
    new Busboy({headers: request.headers})
      .on('field', function (name, value) {
        if (value) {
          if (name.startsWith('signatures-recipient-')) {
            var key = name.slice(21)
            if (signatureProperties.includes(key)) {
              countersign[key] = value
                .trim()
                .replace(/\r?\n/, '\n')
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
          get(configuration, request, response, send, countersign)
        } else {
          countersign.date = new Date().toISOString()
          var data = {
            send: send,
            countersign: countersign,
            address: (
              configuration.email.sender + '@' +
              configuration.email.domain
            )
          }
          write(configuration, request, response, data)
        }
      })
  )
}

function write (configuration, request, response, data) {
  var directory = configuration.directory
  runSeries([
    function emailDOCX (done) {
      docxMessage(configuration, data, ecb(done, function (message) {
        request.log.info('generated message')
        email(configuration, message, done)
      }))
    },
    function rmFiles (done) {
      runSeries([
        function rmSignFile (done) {
          fs.unlink(
            path.join(directory, 'sign', data.send.sign),
            done
          )
        },
        continueOnError(function rmCancelFile (done) {
          fs.unlink(
            path.join(directory, 'cancel', data.send.cancel),
            done
          )
        })
      ], done)
    },
    function chargeSender (done) {
      var chargeFile = path.join(directory, 'charge', data.send.sign)
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
            done()
          } else {
            stripe(configuration.stripe.private)
              .charges
              .capture(chargeID, ecb(done, function (charge) {
                request.log.info({charge: charge})
                done()
              }))
          }
        },
        continueOnError(function rmChargeFile (done) {
          fs.unlink(chargeFile, done)
        }),
        function sendReceipt (done) {
          email(
            configuration,
            receiptMessage(configuration, data),
            done
          )
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
    You will receive a fully-signed Word copy by e-mail
    from ${escape(data.address)} shortly.
  </p>
</main>
${footer()}`)
    }
  })

  function continueOnError (task) {
    return function (done) {
      task(function (error) {
        if (error) {
          request.log.error(error, 'continuing')
        }
        done()
      })
    }
  }
}

function errorsFor (name, postData) {
  if (postData) {
    return postData.errors
      .filter(function (error) {
        return error.name === name
      })
      .map(function (error) {
        return error.message
      })
  } else {
    return []
  }
}
