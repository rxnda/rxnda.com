var Busboy = require('busboy')
var cancelMessage = require('../messages/cancel')
var cancelPath = require('../data/cancel-path')
var chargePath = require('../data/charge-path')
var countersignMessage = require('../messages/countersign')
var ecb = require('ecb')
var email = require('../email')
var escape = require('../util/escape')
var fs = require('fs')
var internalError = require('./internal-error')
var list = require('english-list')
var mkdirp = require('mkdirp')
var notFound = require('./not-found')
var novalidate = require('../util/novalidate')
var path = require('path')
var prescriptionPath = require('../data/prescription-path')
var pump = require('pump')
var randomCapability = require('../data/random-capability')
var readJSONFile = require('../data/read-json-file')
var runParallel = require('run-parallel')
var runSeries = require('run-series')
var sameArray = require('../data/same-array')
var sanitize = require('../util/sanitize-path-component')
var signPath = require('../data/sign-path')
var spell = require('reviewers-edition-spell')
var stripe = require('stripe')
var validFill = require('../data/valid-fill')
var validPost = require('../data/valid-post')

var banner = require('../partials/banner')
var footer = require('../partials/footer')
var html = require('./html')
var nav = require('../partials/nav')
var paragraphs = require('../partials/paragraphs')
var payment = require('../partials/payment')
var preamble = require('../partials/preamble')
var termsCheckbox = require('../partials/terms-checkbox')

module.exports = function send (configuration, request, response) {
  var capability = request.params.capability
  var prescriptionFile = prescriptionPath(configuration, capability)
  readJSONFile(prescriptionFile, function (error, prescription) {
    if (error) {
      internalError(configuration, request, response, error)
    /* istanbul ignore if */
    } else if (prescription === false) {
      notFound(configuration, request, response, [
        'There isn’t any such prescription.'
      ])
    } else {
      if (request.method === 'POST') {
        post(configuration, request, response, prescription)
      } else {
        get(configuration, request, response, prescription)
      }
    }
  })
}

function get (
  configuration, request, response, prescription, postData
) {
  response.statusCode = postData ? 400 : 200
  response.setHeader('Content-Type', 'text/html; charset=ASCII')
  var form = prescription.form
  var address = (
    configuration.email.sender + '@' +
    configuration.email.domain
  )
  var action = `/fill/${request.params.capability}`
  var senderPage = form.signatures[0]
  var recipientPage = form.signatures[1]
  response.end(html`
${preamble('Send ' + form.title + ' ' + form.edition)}
${banner()}
${nav()}
<main>
  <noscript>
    <p>JavaScript has been disabled in your browser.</p>
    <p>You must enabled JavaScript to send.</p>
  </noscript>

  <form
    id=sendForm
    method=post
    action=${escape(action)}
    ${novalidate(request)}>

    <h2>Send <cite>${escape(form.title)}</cite></h2>

    <p class=edition>${escape(spell(form.edition))}</p>

    ${notes(prescription)}

    ${(postData && postData.errors) && html`
      <p class=error>
        Look below for
        ${postData.errors.length === 1 ? 'another box' : 'more boxes'}
        like this one.
      </p>
    `}

    ${(prescription.directions.length !== 0) && html`
      <section class=blanks>
        <h3>Fill in the Blanks</h3>
        ${form
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
            return input(
              name,
              direction.label,
              form.notes.concat(
                direction.examples
                  ? 'For example: ' + list('or',
                    direction.examples.map(function (example) {
                      return `“${example}”`
                    })
                  )
                  : []
              ),
              priorBlankValue(direction.blank),
              errorsFor(name, postData)
            )
          })}
      </section>
    `}

    <section class=signatures>
      <h3>Signatures</h3>

      <section class=ownSignature>
        <h4>Your Side&rsquo;s Signature</h4>
        ${senderBlock(senderPage, postData, prescription)}
        ${
          senderPage.information
            .filter(function (name) {
              return name !== 'date'
            })
            .map(function (suffix) {
              var name = 'signatures-sender-' + suffix
              var prior = null
              if (prescription.signatures.sender[suffix]) {
                prior = {
                  value: prescription.signatures.sender[suffix],
                  readonly: true
                }
              } else if (postData) {
                prior = {
                  value: postData.signatures.sender[suffix],
                  readonly: false
                }
              }
              return input(
                name,
                'Your ' + suffix[0].toUpperCase() + suffix.slice(1),
                [],
                prior,
                errorsFor(name, postData)
              )
            })
        }
      </section>

      <section class=theirSignature>
        <h4>The Other Side</h4>
        <section class=field>
          <label>Their Email</label>
          ${asterisk()}
          <input
              name=signatures-recipient-email
              type=email
              required
              value=${
                postData
                  ? escape(postData.signatures.recipient.email)
                  : '""'
              }>
        </section>
        ${recipientBlock(recipientPage)}
      </section>
    </section>

    ${termsCheckbox(postData ? errorsFor('terms', postData) : [])}

    ${payment(configuration, [`
      ${escape(configuration.domain)} will authorized a charge of
      $${escape(prescription.prices.fill.toString())} to your credit
      card now. If the other side countersigns within seven days,
      ${escape(configuration.domain)} will collect the charge.
      If the other side does not countersign in seven days,
      or if you cancel before they countersign, your credit
      card will not be charged.
    `])}

    <section class=information>
      <h3>Next Steps</h3>
      <p>When you press Sign &amp; Send:</p>
      <ol>
        <li>
          ${escape(address)} will send the other side a secret link
          that they can use to countersign or cancel online.
        </li>
        <li>
          ${escape(address)} will send you an e-mail with a secret link
          that you can use to cancel before the other side countersigns.
        </li>
      </ol>
    </section>
    <input id=submitButton type=submit value='Sign &amp; Send' >
  </form>
</main>
${footer('send', 'stripe')}`)

  function priorBlankValue (blank) {
    var prescriptionMatch = findMatch(prescription.directions)
    if (prescriptionMatch) {
      return {
        value: prescriptionMatch.value,
        readonly: true
      }
    }
    if (postData) {
      var postDataMatch = findMatch(postData.directions)
      if (postDataMatch) {
        return {
          value: postDataMatch.value,
          readonly: false
        }
      }
    }
    return undefined
    function findMatch (directions) {
      return directions.find(function (direction) {
        return sameArray(blank, direction.blank)
      })
    }
  }
}

function senderBlock (signature, postData, prescription) {
  if (Array.isArray(signature.entities)) {
    // Entity Signatory
    return (
      inputWithPrior(
        'signatures-sender-company',
        'Your Company’s Name',
        [
          'Enter the legal name of your company.',
          'For example: “YourCo, Inc.”'
        ]
      ) +
      inputWithPrior(
        'signatures-sender-form', 'Your Company’s Legal Form',
        [
          'Enter the legal form of your company.',
          'For example: “corporation”'
        ]
      ) +
      inputWithPrior(
        'signatures-sender-jurisdiction',
        'Your Company’s Legal Jurisdiction',
        [
          'Enter the legal jurisdiction under whose laws ' +
          'your company is formed.',
          'For example: “Delaware”'
        ]
      ) +
      inputWithPrior(
        'signatures-sender-name', 'Your Name',
        ['Enter your full legal name.']
      ) +
      inputWithPrior(
        'signatures-sender-title', 'Your Title',
        [
          'Enter your title at your company.',
          'For example: “Chief Executive Officer”'
        ]
      ) +
      byline(postData)
    )
  } else {
    // Individual Signatory
    return (
      inputWithPrior(
        'signatures-sender-name', 'Your Name',
        ['Enter your full legal name.']
      ) +
      byline(postData)
    )
  }

  function inputWithPrior (name, label, notes) {
    return input(
      name, label, notes,
      senderBlockValue(name),
      errorsFor(name, postData)
    )
  }

  function senderBlockValue (name) {
    var suffix = name.split('-').reverse()[0]
    if (prescription.signatures.sender[suffix]) {
      return {
        value: prescription.signatures.sender[suffix],
        readonly: true
      }
    } else if (postData) {
      return {
        value: postData.signatures.sender[suffix],
        readonly: false
      }
    } else {
      return null
    }
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
          'side’s company.',
          'For example: “TheirCo, LLC”',
          'If you leave this blank, the recipient can fill it out.'
        ]
      ) +
      input(
        'signatures-recipient-form', 'Their Company’s Legal Form',
        [
          'Enter the legal form of their company.',
          'For example: “limited liability company”',
          'If you leave this blank, the recipient can fill it out.'
        ]
      ) +
      input(
        'signatures-recipient-jurisdiction',
        'Their Company’s Legal jurisdiction',
        [
          'Enter the legal jurisdiction under whose laws their ' +
          'company is formed.',
          'For example: “Delaware”',
          'If you leave this blank, the recipient can fill it out.'
        ]
      ) +
      input(
      'signatures-recipient-name', 'Their Name',
        [
          'Optionally name who will sign for the other side.',
          'If you leave this blank, the recipient can fill it out.'
        ]
      ) +
      input(
        'signatures-recipient-title', 'Their Title',
        [
          'Optionally enter their title at the company.',
          'For example: “Chief Executive Officer”',
          'If you leave this blank, the recipient can fill it out.'
        ]
      )
    )
  } else {
    // Individual Signatory
    return (
      input(
        'signatures-recipient-name', 'Their Name',
        [
          'Enter the other side’s full legal name.',
          'For example: “Jane Doe”',
          'If you leave this blank, the recipient can fill it out.'
        ]
     )
    )
  }
}

function input (name, label, notes, prior, errors) {
  var required = (
    name.startsWith('signatures-sender-') ||
    name.startsWith('directions-')
  )
  if (name.endsWith('address')) {
    return html`
<section class=field>
  <label>${escape(label)}</label>
  ${required && asterisk()}
  ${errors && paragraphs(errors, 'error')}
  <textarea
      rows=3
      name="${escape(name)}"
      ${required && 'required'}
      ${prior && prior.readonly && 'readonly=readonly'}
  >${prior && escape(prior.value)}</textarea>
</section>`
  } else {
    return html`
<section class=field>
  <label>${escape(label)}</label>
  ${required && asterisk()}
  ${errors && paragraphs(errors, 'error')}
  <input
      name="${name}"
      ${(name === 'signatures-sender-name') && 'id=name'}
      type=${name === 'email' ? 'email' : 'text'}
      ${required && 'required'}
      ${prior && prior.readonly && 'readonly=readonly'}
      value='${prior && escape(prior.value)}'>
  ${paragraphs(notes)}
</section>`
  }
}

function asterisk () {
  return '<span class=asterisk>*</span>'
}

function byline (postData) {
  var errors = errorsFor('signatures-sender-signature', postData)
  return html`
<section class=field>
  <label>Signature</label>
  ${asterisk()}
  ${errors && paragraphs(errors, 'error')}
  <input
    id=signature
    class=signature
    name=signatures-sender-signature
    type=text
    autocomplete=off
    required>
  <p class=description>
    To sign the form, enter your name again, exactly as you did before.
  </p>
  <p class=warning>
    By signing here and clicking Sign &amp; Send below, you offer to
    enter into a legally binding contract, on the terms of the form,
    with the other side.
  </p>
</section>`
}

function post (configuration, request, response, prescription) {
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
          } else if (name === 'coupon') {
            data.coupon = value
          } else if (name === 'terms') {
            data.terms = value
          }
        }
      })
      .once('finish', function () {
        request.log.info({data: data})
        var errors = []
          .concat(validPost(data, prescription.form))
          .concat(validFill(prescription, data))
        if (errors.length !== 0) {
          data.errors = errors
          get(configuration, request, response, prescription, data)
        } else {
          write(configuration, request, response, data, prescription)
        }
      })
  )
}

var signatureProperties = require('../data/signature-properties')

function validSignatureProperty (name) {
  return signatureProperties.includes(name)
}

function write (configuration, request, response, data, prescription) {
  var domain = configuration.domain
  var now = new Date()
  var sender = data.signatures.sender
  if (data.coupon) {
    data.coupon = sanitize(data.coupon)
  }
  // Backdate offers from a specific e-mail address for test
  // purposes.  Backdating allows test code to run the sweep
  // procedure immediately, and verify that it has swept the
  // backdated offer.
  /* istanbul ignore else */
  if (process.env.NODE_ENV === 'test') {
    if (sender.email === 'backdate@example.com') {
      now.setDate(now.getDate() - 10)
    }
  }
  data.timestamp = now.toISOString()
  data.form = prescription.form
  data.price = prescription.prices.fill
  runSeries([
    function generateCapabilities (done) {
      runParallel([
        capabilityToProperty(data, 'cancel'),
        capabilityToProperty(data, 'sign')
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
        }
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
          email(
            configuration,
            cancelMessage(configuration, data),
            done
          )
        },
        function emailSignLink (done) {
          email(
            configuration,
            countersignMessage(configuration, data),
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
      var sender = data.signatures.sender
      var recipient = data.signatures.recipient
      var recipientName = (
        recipient.company || recipient.name || recipient.email
      )
      response.end(html`
${preamble()}
${banner()}
${nav()}
<main>
  <h2 class=sent>NDA Sent!</h2>
  <p>
    You have offered to enter a nondisclosure agreement
    ${sender.company && ('on behalf of ' + escape(sender.company))}
    with ${escape(recipientName)} on the terms of the
    ${escape(data.form.title)}  form agreement,
    ${escape(spell(data.form.edition))}.
  </p>
  <p>
    To cancel your request before the other side signs, visit
    <a href=/cancel/${escape(data.cancel)}>this link</a>.
  </p>
</main>
${footer()}`)
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

function notes (prescription) {
  if (prescription.notes) {
    var attorney = prescription.attorney
    return html`
  <section>
    <h3>Attorney Notes</h3>
    ${paragraphs(prescription.notes.split('\n\n'))}
    <footer>
      &mdash;
      <cite>
        ${attorney.name}
        (<a href="mailto:${escape(attorney.email)}"
          >${escape(attorney.email)}</a>)
      </cite>
    </footer>
  </section>
    `
  } else {
    return ''
  }
}
