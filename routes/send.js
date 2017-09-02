var Busboy = require('busboy')
var cancelMessage = require('../messages/cancel')
var cancelPath = require('../data/cancel-path')
var chargePath = require('../data/charge-path')
var countersignMessage = require('../messages/countersign')
var decodeTitle = require('../util/decode-title')
var deleteCoupon = require('../data/delete-coupon')
var ecb = require('ecb')
var email = require('../email')
var encodeTitle = require('../util/encode-title')
var escape = require('../util/escape')
var fs = require('fs')
var internalError = require('./internal-error')
var list = require('english-list')
var mkdirp = require('mkdirp')
var notFound = require('./not-found')
var novalidate = require('../util/novalidate')
var path = require('path')
var pump = require('pump')
var randomCapability = require('../data/random-capability')
var readCoupon = require('../data/read-coupon')
var readEdition = require('../data/read-edition')
var runParallel = require('run-parallel')
var runSeries = require('run-series')
var sameArray = require('../data/same-array')
var sanitize = require('../util/sanitize-path-component')
var signPath = require('../data/sign-path')
var spell = require('reviewers-edition-spell')
var stripe = require('stripe')
var validPost = require('../data/valid-post')

var banner = require('../partials/banner')
var draftWarning = require('../partials/draft-warning')
var footer = require('../partials/footer')
var html = require('./html')
var nav = require('../partials/nav')
var paragraphs = require('../partials/paragraphs')
var payment = require('../partials/payment')
var preamble = require('../partials/preamble')
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
  response.setHeader('Content-Type', 'text/html; charset=ASCII')
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

    ${(postData && postData.errors) && html`
      <p class=error>
        Look below for
        ${postData.errors.length === 1 ? 'another box' : 'more boxes'}
        like this one.
      </p>
    `}

    ${(edition.directions.length !== 0) && html`
      <section class=blanks>
        <h3>Fill in the Blanks</h3>
        ${edition
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
              direction.notes.concat(
                direction.examples
                  ? 'For example: ' + list('or',
                    direction.examples.map(function (example) {
                      return `“${example}”`
                    })
                  )
                  : []
              ),
              postData
                ? priorValue(direction.blank, postData)
                : undefined,
              errorsFor(name, postData)
            )
          })}
      </section>
    `}

    <section class=signatures>
      <h3>Signatures</h3>

      <section class=ownSignature>
        <h4>Your Side&rsquo;s Signature</h4>
        ${senderBlock(senderPage, postData)}
        ${
          senderPage.information
            .filter(function (name) {
              return name !== 'date'
            })
            .map(function (suffix) {
              var name = 'signatures-sender-' + suffix
              return input(
                name,
                'Your ' + suffix[0].toUpperCase() + suffix.slice(1),
                [],
                (
                  postData
                    ? postData.signatures.sender[suffix]
                    : undefined
                ),
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

  function priorValue (blank, prior) {
    var match = prior.directions.find(function (direction) {
      return sameArray(blank, direction.blank)
    })
    if (match) {
      return match.value
    }
  }
}

function senderBlock (signature, postData) {
  if (Array.isArray(signature.entities)) {
    // Entity Signatory
    return (
      inputWithPrior(
        'signatures-sender-company', 'Your Company’s Name',
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
    if (postData) {
      return input(
        name, label, notes,
        postData.signatures.sender[name.split('-').reverse()[0]],
        errorsFor(name, postData)
      )
    } else {
      return input(name, label, notes)
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

function input (name, label, notes, value, errors) {
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
  >${value && escape(value)}</textarea>
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
      value='${value && escape(value)}'>
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

var signatureProperties = require('../data/signature-properties')

function validSignatureProperty (name) {
  return signatureProperties.includes(name)
}

function write (configuration, request, response, data, form) {
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
  data.form = form
  data.price = configuration.prices.use
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
    },
    function handlePayment (done) {
      var chargeID = null
      runSeries([
        function createCharge (done) {
          if (data.coupon) {
            var coupon = data.coupon
            readCoupon(
              configuration, coupon,
              ecb(done, function (valid) {
                if (valid) {
                  chargeID = 'coupon'
                  deleteCoupon(configuration, coupon, done)
                } else {
                  done(new Error('invalid coupon'))
                }
              })
            )
          } else {
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
          }
        },
        function writeChargeFile (done) {
          mkdirpThenWriteFile(
            chargePath(configuration, data.sign), chargeID, done
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

function couponSection (coupon) {
  return `
    <section id=payment>
      <h3>Coupon</h3>
      <input name=coupon type=hidden value="${escape(coupon)}">
      <p>Your coupon code entitles you to send for free.</p>
    </section>`
}
