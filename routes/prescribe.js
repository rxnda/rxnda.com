var Busboy = require('busboy')
var VALID_TERMS = require('../data/valid-prescription-terms')
var attorneyPath = require('../data/attorney-path')
var decodeTitle = require('../util/decode-title')
var ecb = require('ecb')
var email = require('../email')
var encodeTitle = require('../util/encode-title')
var escape = require('../util/escape')
var fillMessage = require('../messages/fill')
var prescriptionPath = require('../data/prescription-path')
var fs = require('fs')
var internalError = require('./internal-error')
var list = require('english-list')
var mkdirp = require('mkdirp')
var notFound = require('./not-found')
var novalidate = require('../util/novalidate')
var path = require('path')
var pump = require('pump')
var randomCapability = require('../data/random-capability')
var readEdition = require('../data/read-edition')
var readJSONFile = require('../data/read-json-file')
var revokeMessage = require('../messages/revoke')
var revokePath = require('../data/revoke-path')
var runParallel = require('run-parallel')
var runSeries = require('run-series')
var sameArray = require('../data/same-array')
var sanitize = require('../util/sanitize-path-component')
var spell = require('reviewers-edition-spell')
var stripe = require('stripe')
var validPrescription = require('../data/valid-prescription')

var banner = require('../partials/banner')
var payment = require('../partials/payment')
var draftWarning = require('../partials/draft-warning')
var footer = require('../partials/footer')
var html = require('./html')
var nav = require('../partials/nav')
var paragraphs = require('../partials/paragraphs')
var preamble = require('../partials/preamble')
var termsCheckbox = require('../partials/terms-checkbox')

// TODO: sweep expired prescriptions

module.exports = function prescribe (configuration, request, response) {
  var title = decodeTitle(request.params.title)
  var edition = request.params.edition
  readEdition(
    configuration, sanitize(title), sanitize(edition),
    function (error, edition) {
      /* istanbul ignore if */
      if (error) {
        internalError(configuration, request, response, error)
      } else if (edition === false) {
        notFound(configuration, request, response, [
          'There isn’t any form by that title and edition.'
        ])
      } else {
        var attorneyFile = attorneyPath(
          configuration, request.query.attorney
        )
        readJSONFile(attorneyFile, function (error, attorney) {
          if (error) {
            return notFound(configuration, request, response, [
              'There isn’t any attorney with that ID.'
            ])
          }
          if (request.method === 'POST') {
            post(configuration, request, response, edition, attorney)
          } else {
            showGet(configuration, request, response, edition, attorney)
          }
        })
      }
    }
  )
}

function showGet (
  configuration, request, response, edition, attorney, postData
) {
  response.statusCode = postData ? 400 : 200
  response.setHeader('Content-Type', 'text/html; charset=ASCII')
  var address = (
    configuration.email.sender + '@' +
    configuration.email.domain
  )
  var action = (
    `/prescribe/${encodeTitle(edition.title)}/${edition.edition}` +
    `?attorney=${attorney.capability}`
  )
  var read = `/forms/${encodeTitle(edition.title)}/${edition.edition}`
  var docx = `/docx/${encodeTitle(edition.title)}/${edition.edition}`
  var senderPage = edition.signatures[0]
  response.end(html`
${preamble('Prescribe ' + edition.title + ' ' + edition.edition)}
${banner()}
${nav()}
<main>
  <noscript>
    <p>JavaScript has been disabled in your browser.</p>
    <p>You must enabled JavaScript to prescribe.</p>
  </noscript>

  <form
    id=sendForm
    method=post
    action=${escape(action)}
    ${novalidate(request)}>

    <h2>Prescribe <cite>${escape(edition.title)}</cite></h2>

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

    <section class=instructions>
      <h3>Notes to Client</h3>
      <p class=directions>
        Use the space below for instructions to your client.
        Your notes will appear at the top of the page
        your client can use to send the form on prescription.
      </p>
      <textarea name=notes rows=7>${postData && postData.notes}</textarea>
      <p>
        You may wish to address:
      </p>
      <ul>
        <li>
          circumstances in which your client should use
          this form
        </li>
        <li>
          how they should fill blanks and signature details
          that you do not fill for them below
        </li>
      </ul>
    </section>

    <section class=expiration>
      <h3>Expiration</h3>
      <p class=directions>
        Choose a term after which the prescription will expire.
      </p>
      <select name=expiration>
        ${VALID_TERMS.map(function (days) {
          days = days.toString()
          return html`
            <option value=${days}
              ${postData && postData.expiration === days && 'selected'}
              >${days} calendar days</option>
          `
        })}
      </select>
    </section>

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
              false,
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
        <h4>Your Client&rsquo;s Signature</h4>
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
                name === 'signatures-sender-email',
                'Client’s ' + suffix[0].toUpperCase() + suffix.slice(1),
                name === 'signatures-sender-email'
                  ? [
                    'The link to send forms on prescription will be ' +
                    'send to this address.'
                  ]
                  : [],
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
    </section>

    ${termsCheckbox(postData ? errorsFor('terms', postData) : [])}

    ${payment(configuration, [
      `
      ${escape(configuration.domain)} will charge your credit card
      $${escape(configuration.prices.prescribe.toString())} now.
      `,
      `
        The cost of sending NDAs on prescription will be discounted
        from $${configuration.prices.use.toString()}
        to $${configuration.prices.fill.toString()}.
      `
    ])}

    <section class=information>
      <h3>Next Steps</h3>
      <p>When you press Prescribe:</p>
      <ol>
        <li>
          ${escape(address)} will send you and your client a
          link for sending NDAs on prescription.
        </li>
        <li>
          ${escape(address)} will send you and your client
          notifications when the prescription expires.
        </li>
      </ol>
    </section>
    <input id=submitButton type=submit value=Prescribe>
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
        'signatures-sender-company',
        true,
        'Your Client-Company’s Name',
        [
          'Enter the legal name of the company.',
          'For example: “ClientCo, Inc.”'
        ]
      ) +
      inputWithPrior(
        'signatures-sender-form',
        true,
        'Your Client-Company’s Legal Form',
        [
          'Enter the legal form of the company.',
          'For example: “corporation”'
        ]
      ) +
      inputWithPrior(
        'signatures-sender-jurisdiction',
        true,
        'Your Client-Company’s Legal Jurisdiction',
        [
          'Enter the legal jurisdiction under whose laws ' +
          'the company is formed.',
          'For example: “Delaware”'
        ]
      ) +
      inputWithPrior(
        'signatures-sender-name',
        false,
        'The Signatory’s Name',
        ['Enter a full legal name.']
      ) +
      inputWithPrior(
        'signatures-sender-title',
        false,
        'The Signatory’s Title',
        [
          'Enter a title at your company.',
          'For example: “Chief Executive Officer”'
        ]
      )
    )
  } else {
    // Individual Signatory
    return (
      inputWithPrior(
        'signatures-sender-name',
        true,
        'The Client’s Name',
        ['Enter a full legal name.']
      )
    )
  }

  function inputWithPrior (name, required, label, notes) {
    if (postData) {
      return input(
        name, required, label, notes,
        postData.signatures.sender[name.split('-').reverse()[0]],
        errorsFor(name, postData)
      )
    } else {
      return input(name, required, label, notes)
    }
  }
}

function input (name, required, label, notes, value, errors) {
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

function post (configuration, request, response, form, attorney) {
  var data = {
    notes: null,
    signatures: {
      sender: {}
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
          } else if (name === 'notes') {
            data.notes = value
          } else if (name === 'expiration') {
            data.expiration = parseInt(value)
          } else if (name === 'terms') {
            data.terms = value
          }
        }
      })
      .once('finish', function () {
        request.log.info({data: data})
        var errors = validPrescription(data, form)
        if (errors.length !== 0) {
          data.errors = errors
          showGet(
            configuration, request, response, form, attorney, data
          )
        } else {
          write(
            configuration, request, response, data, attorney, form
          )
        }
      })
  )
}

var signatureProperties = require('../data/signature-properties')

function validSignatureProperty (name) {
  return signatureProperties.includes(name)
}

function write (
  configuration, request, response, data, attorney, form
) {
  var domain = configuration.domain
  var now = new Date()
  var sender = data.signatures.sender
  data.attorney = attorney
  // Backdate prescription from a specific e-mail address for test
  // purposes.  Backdating allows test code to run the sweep
  // procedure immediately, and verify that it has swept the
  // backdated offer.
  /* istanbul ignore else */
  if (process.env.NODE_ENV === 'test') {
    if (sender.email === 'backdate@example.com') {
      now.setDate(now.getDate() - 180)
    }
  }
  data.timestamp = now.toISOString()
  data.form = form
  data.prices = {
    prescribe: configuration.prices.prescribe,
    fill: configuration.prices.fill
  }
  runSeries([
    function generateCapabilities (done) {
      runParallel([
        capabilityToProperty(data, 'fill'),
        capabilityToProperty(data, 'revoke')
      ], done)
    },
    function createCharge (done) {
      stripe(configuration.stripe.private).charges.create({
        amount: data.prices.prescribe * 100, // dollars to cents
        currency: 'usd',
        description: domain,
        source: data.token
      }, function (error, charge) {
        if (error) return done(error)
        request.log.info({charge: charge.id})
        done()
      })
    },
    function writeFiles (done) {
      runParallel([
        function writeRevokeFile (done) {
          mkdirpThenWriteFile(
            revokePath(configuration, data.revoke), data.fill, done
          )
        },
        function writeFillFile (done) {
          mkdirpThenWriteFile(
            prescriptionPath(configuration, data.fill), data, done
          )
        }
      ], done)
    },
    function sendEmails (done) {
      runSeries([
        function emailRevokeLink (done) {
          email(
            configuration,
            revokeMessage(configuration, data),
            done
          )
        },
        function emailFillLink (done) {
          email(
            configuration,
            fillMessage(configuration, data),
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
      response.end(html`
${preamble()}
${banner()}
${nav()}
<main>
  <h2 class=sent>Prescription Sent!</h2>
  <p>
    You have prescribed the ${domain}
    ${escape(data.form.title)}  form agreement,
    ${escape(spell(data.form.edition))}
    for use by ${sender.company || sender.company}.
  </p>
  <p>
    To revoke your prescription, visit
    <a href=/revoke/${escape(data.revoke)}>this link</a>.
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
