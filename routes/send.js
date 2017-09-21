var Busboy = require('busboy')
var decodeTitle = require('../util/decode-title')
var encodeTitle = require('../util/encode-title')
var errorsFor = require('../util/errors-for')
var escape = require('../util/escape')
var htmlContent = require('../util/html-content')
var internalError = require('./internal-error')
var normalizeLineBreaks = require('../data/normalize-line-breaks')
var notFound = require('./not-found')
var novalidate = require('../util/novalidate')
var offer = require('../data/offer')
var pump = require('pump')
var readCoupon = require('../data/read-coupon')
var readEdition = require('../data/read-edition')
var sameArray = require('../data/same-array')
var sanitize = require('../util/sanitize-path-component')
var spell = require('reviewers-edition-spell')
var validPost = require('../data/valid-post')
var validSignatureProperty = require('../data/valid-signature-property')

var banner = require('../partials/banner')
var blanks = require('../partials/blanks')
var couponSection = require('../partials/coupon-section')
var draftWarning = require('../partials/draft-warning')
var errorsMessage = require('../partials/errors-message')
var footer = require('../partials/footer')
var html = require('./html')
var information = require('../partials/information')
var nav = require('../partials/nav')
var paragraphs = require('../partials/paragraphs')
var payment = require('../partials/payment')
var preamble = require('../partials/preamble')
var recipientBlock = require('../partials/recipient-block')
var senderBlock = require('../partials/sender-block')
var termsCheckbox = require('../partials/terms-checkbox')

module.exports = function send (configuration, request, response) {
  var title = decodeTitle(request.params.title)
  var edition = request.params.edition
  readEdition(
    configuration, sanitize(title), sanitize(edition),
    function (error, data) {
      /* istanbul ignore if */
      if (error) {
        internalError(configuration, request, response, error)
      } else if (data === false) {
        notFound(configuration, request, response, [
          'There isn’t any form by that title and edition.'
        ])
      } else {
        data.title = title
        data.edition = edition
        if (request.method === 'POST') {
          post(configuration, request, response, data)
        } else {
          get(configuration, request, response, data)
        }
      }
    }
  )
}

function get (configuration, request, response, edition, postData) {
  if (request.query.coupon) {
    var coupon = request.query.coupon
    readCoupon(configuration, coupon, function (error, valid) {
      if (error) {
        internalError(configuration, request, response, error)
      } else {
        if (valid) {
          showGet(
            configuration, request, response, edition, postData, coupon
          )
        } else {
          render()
        }
      }
    })
  } else {
    render()
  }
  function render () {
    showGet(configuration, request, response, edition, postData)
  }
}

function showGet (
  configuration, request, response, edition, postData, coupon
) {
  response.statusCode = postData ? 400 : 200
  htmlContent(response)
  var address = (
    configuration.email.sender + '@' +
    configuration.email.domain
  )
  var action = `/send/${encodeTitle(edition.title)}/${edition.edition}`
  var read = `/forms/${encodeTitle(edition.title)}/${edition.edition}`
  var docx = `/docx/${encodeTitle(edition.title)}/${edition.edition}`
  var senderPage = edition.signatures[0]
  var recipientPage = edition.signatures[1]
  response.end(html`
${preamble('Send ' + edition.title + ' ' + edition.edition)}
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

    <h2>Send <cite>${escape(edition.title)}</cite></h2>

    <p class=edition>${escape(spell(edition.edition))}</p>

    ${draftWarning(edition.edition)}

    ${paragraphs(edition.notes)}

    <p>
      <a href=${escape(read)} target=_blank
        >Read this form online</a>
      or
      <a href=${escape(docx)}
        >download a .docx copy</a>.
    </p>

    ${errorsMessage(postData)}

    ${blanks(edition, postData, function (blank) {
      if (postData) {
        var match = postData.directions.find(function (other) {
          return sameArray(blank, other.blank)
        })
        if (match) return match.value
      }
      return undefined
    })}

    <section class=signatures>
      <h3>Signatures</h3>

      <section class=ownSignature>
        ${senderBlock(senderPage, postData, function (suffix) {
          return postData
            ? {value: postData.signatures.sender[suffix]}
            : undefined
        })}
      </section>

      <section class=theirSignature>
        <h4>The Other Side</h4>
        ${recipientBlock(recipientPage, postData)}
      </section>
    </section>

    ${termsCheckbox(postData ? errorsFor('terms', postData) : [])}

    ${
      coupon
        ? couponSection(coupon)
        : payment(configuration, [`
          ${escape(configuration.domain)} will authorize a charge of
          $${escape(configuration.prices.use.toString())} to your credit
          card now.  If the other side countersigns within seven days,
          ${escape(configuration.domain)} will collect the charge.
          If the other side does not countersign in seven days,
          or if you cancel before they countersign, your credit
          card will not be charged.
        `])
      }

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
          value = normalizeLineBreaks(value.trim())
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
        var errors = validPost(data, form)
        if (errors.length !== 0) {
          data.errors = errors
          get(configuration, request, response, form, data)
        } else {
          write(configuration, request, response, data, form)
        }
      })
  )
}

function write (configuration, request, response, data, form) {
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
  data.form = form
  data.price = configuration.prices.use
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
