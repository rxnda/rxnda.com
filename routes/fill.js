var Busboy = require('busboy')
var errorsFor = require('../util/errors-for')
var escape = require('../util/escape')
var htmlContent = require('../util/html-content')
var internalError = require('./internal-error')
var notFound = require('./not-found')
var novalidate = require('../util/novalidate')
var offer = require('../data/offer')
var pump = require('pump')
var readPrescription = require('../data/read-prescription')
var sameArray = require('../data/same-array')
var sanitize = require('../util/sanitize-path-component')
var spell = require('reviewers-edition-spell')
var validFill = require('../data/valid-fill')
var validPost = require('../data/valid-post')
var validSignatureProperty = require('../data/valid-signature-property')

var attorneyNotes = require('../partials/attorney-notes')
var banner = require('../partials/banner')
var blanks = require('../partials/blanks')
var errorsMessage = require('../partials/errors-message')
var footer = require('../partials/footer')
var html = require('./html')
var information = require('../partials/information')
var nav = require('../partials/nav')
var payment = require('../partials/payment')
var preamble = require('../partials/preamble')
var recipientBlock = require('../partials/recipient-block')
var senderBlock = require('../partials/sender-block')
var termsCheckbox = require('../partials/terms-checkbox')

module.exports = function send (configuration, request, response) {
  var capability = request.params.capability
  readPrescription(configuration, capability, function (error, prescription) {
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
  htmlContent(response)
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

    ${attorneyNotes(prescription)}

    ${errorsMessage(postData)}

    ${blanks(prescription.form, postData, function (blank) {
      return priorBlankValue(blank)
    })}

    <section class=signatures>
      <h3>Signatures</h3>

      <section class=ownSignature>
        <h4>Your Side&rsquo;s Signature</h4>
        ${senderBlock(senderPage, postData, function (suffix) {
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
          return prior
        })}
      </section>

      <section class=theirSignature>
        <h4>The Other Side</h4>
        ${recipientBlock(recipientPage, postData)}
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

    ${information([
      `${address} will send the other side a secret link` +
      `that they can use to countersign or cancel online.`,
      `${address} will send you an e-mail with a secret link` +
      `that you can use to cancel before the other side countersigns.`
    ])}

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

function write (configuration, request, response, data, prescription) {
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
  offer(configuration, request, data, function (error) {
    /* istanbul ignore if */
    if (error) {
      request.log.error(error)
      internalError(configuration, request, response, error)
    } else {
      htmlContent(response)
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
}
