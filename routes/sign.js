var Busboy = require('busboy')
var escapeStringRegexp = require('escape-string-regexp')
var crypto = require('crypto')
var sameArray = require('../data/same-array')
var ecb = require('ecb')
var escape = require('escape-html')
var fs = require('fs')
var internalError = require('./internal-error')
var mailgun = require('../mailgun')
var mkdirp = require('mkdirp')
var notFound = require('./not-found')
var parse = require('json-parse-errback')
var path = require('path')
var pump = require('pump')
var readTemplate = require('./read-template')
var runParallel = require('run-parallel')
var runSeries = require('run-series')
var spell = require('reviewers-edition-spell')
var stripe = require('stripe')
var trumpet = require('trumpet')
var validPost = require('../data/valid-post')
var wordWrap = require('word-wrap')

module.exports = function (configuration, request, response) {
  var directory = configuration.directory
  var data
  runSeries([
    function readSignFile (done) {
      var signPath = path.join(
        directory, 'sign', request.params.capability
      )
      fs.readFile(signPath, ecb(done, function (json) {
        parse(json, ecb(done, function (parsed) {
          data = parsed
          done()
        }))
      }))
    }
  ], function (error) {
    if (error) {
      if (error.code === 'ENOENT') {
        notFound(configuration, request, response)
      } else {
        internalError(configuration, request, response, error)
      }
    } else {
      if (request.method === 'POST') {
        post(configuration, request, response, data)
      } else {
        get(configuration, request, response, data)
      }
    }
  })
}

function get (configuration, request, response, edition) {
  var body = trumpet()
  response.setHeader('Content-Type', 'text/html; charset=ASCII')
  pump(body, response)
  body.select('main')
    .createWriteStream()
    .end(form(configuration, edition))
  pump(readTemplate('sign.html'), body)
}

function form (configuration, data) {
  var recipient = data.signatures.recipient
  var sender = data.signatures.sender
  var expires = new Date(data.timestamp)
  expires.setDate(expires.getDate() + 7)
  return `
<noscript>
  <p>JavaScript has been disabled in your browser.</p>
  <p>You must enabled JavaScript to sign.</p>
</noscript>
<form
  method=post
  action=/sign/${data.sign}
  <p>
    ${escape(sender.name)}
    (<a href="mailto:${encodeURIComponent(sender.email)}"
      >${escape(sender.email)}</a>)
    offers to enter into an
    NDA with ${escape(recipient.company || 'you')}
    on the terms of an Rxnda standard form NDA.
    You can accept the offer online, at this address,
    until ${expires.toLocaleString()}.
  </p>
  ${data.directions.length !== 0 ? blanks() : ''}
  <p>
    <a
      href=/view/${data.sign}
      target=_blank>
      Click here to view the full text of the proposed NDA online.
    </a>
  </p>
  <p>
    <a
      href=/
      target=_blank>
      Click here to read more about Rxnda and how it works.
    </a>
  </p>
  ${signatures()}
  <input id=submitButton type=submit value='Countersign' >
</form>`

  function blanks () {
    return `
<dl>
  <dt>Form</dt><dd>${escape(data.form.title)}</dd>
  <dt>Edition</dt><dd>${escape(spell(data.form.edition))}</dd>
  ${dtdds()}
</dl>
`
    function dtdds () {
      return data.directions
        .map(function (direction) {
          var label = data.form.directions.find(function (element) {
            return sameArray(element.blank, direction.blank)
          })
            .label
          return `
<dt>${escape(label)}</dt>
<dd>&ldquo;${escape(direction.value)}&rdquo;</dd>`
        })
        .join('\n')
    }
  }

  function signatures () {
    return `
<section class=signatures>
  <h3>Signatures</h3>

  <section class=senderSignature>
    <h4>
      ${escape(sender.company ? sender.company : sender.name)}&rsquo;s
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
            escape(sender.jurisdiction) + ' ' +
            escape(sender.form)
          )
          : ''
      }
      ${new Date(data.timestamp).toLocaleString()}
    </p>
  </section>

  <section class=yourSignature>
    <h4>Your Signature</h4>
    ${recipientBlock(data.form.signatures[1], recipient)}
    ${byline(recipient)}
    ${
      data.form.signatures[1].information
        .filter(function (name) {
          return name !== 'email'
        })
        .map(function (name) {
          return input(
            'signatures-recipient-' + name,
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
    <section class=information>
      <p>Once you press Countersign:</p>
      <ol>
        <li>
          The site will e-mail both you and the other side,
          attaching a fully-signed Word copy of the NDA.
        </li>
        <li>
          The sender will be charged for using the site.
          You will not.
        </li>
      </ol>
    </section>
  </section>
</section>`
  }
}

function recipientBlock (page, data) {
  if (Array.isArray(page.entities)) {
    // Entity Signatory
    return (
      input(
        'signatures-recipient-company', 'Your Company Name',
        [
          'Enter the legal name of your company.',
          'For example, &ldquo;SomeCo, LLC&rdquo;.',
          'If you leave this blank, the recipient can fill it out.'
        ],
        data.company
      ) +
      input(
        'signatures-recipient-form', 'Your Company&rsquo;s Legal Form',
        [
          'Enter the legal form of your company.',
          'For example, &ldquo;limited liability company&rdquo;.'
        ],
        data.form
      ) +
      input(
        'signatures-recipient-jurisdiction',
        'Your Company&rsquo;s Legal jurisdiction',
        [
          'Enter the legal jurisdiction under whose laws your ' +
          'company is formed.',
          'For example, &ldquo;Delaware&rdquo;.'
        ],
        data.jurisdiction
      ) +
      input(
        'signatures-recipient-name', 'Your Name', [
          'Enter your name.'
        ],
        data.name
      ) +
      input(
        'signatures-recipient-title', 'Your Title', [
          'Enter your title at the company.',
          'For example, &ldquo;Chief Executive Officer&rdquo;.'
        ],
        data.title
      )
    )
  } else {
    // Individual Signatory
    return (
      input(
        'signatures-recipient-name', 'Your Name', [
          'Enter your full legal name.',
          'For example, &ldquo;Jane Doe&rdquo;.'
        ],
        data.name
     )
    )
  }
}

function input (name, label, notes, value) {
  if (value) {
    return `
<section class=field>
  <label for=${name}>${label}</label>
  ${asterisk()}
  <input
      name=${name}
      value=${value}
      type=text
      required
      disabled>
  ${value ? prefilled() : paragraphs(notes)}
</section>`
  } else {
    return `
<section class=field>
  <label for='${name}'>${label}</label>
  ${asterisk()}
  <input
      name=${name}
      ${name === 'signatures-recipient-name' ? 'id=name' : ''}
      type=${name === 'email' ? 'email' : 'text'}
      required>
  ${paragraphs(notes)}
</section>`
  }

  function prefilled () {
    if (notes.length === 0) {
      return ''
    } else {
      return `
<p class=note>
  The sender prefilled this field for you.
  If they did so incorrectly, tell the sender to resend the request.
</p>`
    }
  }
}

function asterisk () {
  return '<span class=asterisk>*</span>'
}

function byline (recipient) {
  return `
<section class=field>
  <label for=signatures-recipient-signature>Signature</label>
  ${asterisk()}
  <input
    id=signature
    class=signature
    name=signatures-recipient-signature
    type=text
    pattern="${escapeStringRegexp(recipient.name)}"
    required>
  <p class=note>
    To sign the form, enter your name, exactly as above.
  </p>
  <p class=note>
    By signing here and clicking Countersign below, you
    enter into a legally binding contract, on the terms they
    proposed, with the other side.
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

var signatureProperties = [
  'name', 'company', 'signature', 'address', 'company', 'form',
  'email', 'jurisdiction'
]

function validSignatureProperty (name) {
  return signatureProperties.includes(name)
}

function write (configuration, request, response, data, form) {
  var domain = configuration.mailgun.domain
  var directory = configuration.directory
  var timestamp = new Date().toISOString()
  data.timestamp = timestamp
  data.form = form
  data.price = configuration.prices.use
  var sender = data.signatures.sender
  var senderName = sender.company || sender.name
  var recipient = data.signatures.recipient
  var recipientName = recipient.company || recipient.name || recipient.email
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
            path.join(directory, 'cancel'),
            data.cancel, data.sign, done
          )
        },
        function writeSignFile (done) {
          mkdirpThenWriteFile(
            path.join(directory, 'sign'),
            data.sign, data, done
          )
        }
      ], done)
    },
    function sendEmails (done) {
      runSeries([
        function emailCancelLink (done) {
          mailgun(configuration, {
            to: sender.email,
            subject: 'Your ' + domain + ' Cancellation Link',
            text: wordWrap([
              'You have offered to sign a nondisclosure agreement ' +
              (sender.company ? 'on behalf of ' + sender.company : '') +
              ' with ' + recipientName +
              'on the terms of ' + domain + '\'s ' +
              form.title + ' form agreement, ' +
              spell(form.edition) + '.',
              'To cancel your request before the other side signs, ' +
              'visit this link:',
              'https://' + domain + '/cancel/' + data.cancel
            ].join('\n\n'))
          }, done)
        },
        function emailSignLink (done) {
          mailgun(configuration, {
            to: recipient.email,
            subject: 'NDA Request from ' + senderName,
            text: wordWrap([
              senderName + ' offers to sign a nondisclosure ' +
              'agreement with ' +
              (recipient.company ? recipient.company : 'you') +
              'on the terms of ' + domain + '\'s ' +
              form.title + ' form agreement, ' +
              spell(form.edition) + '.',
              'To review the proposal, sign online, and ' +
              'receive a fully executed copy, visit:',
              'https://' + domain + '/cancel/' + data.sign
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
            path.join(directory, 'charge'),
            data.sign, chargeID, done
          )
        },
        function emailReceipt (done) {
          mailgun(configuration, {
            to: data.signatures.sender.email,
            subject: 'Your ' + domain + ' Order',
            text: [
              'Thank you for sending an NDA with ' + domain + '!',
              'Form: ' + form.title,
              'Edition: ' + form.edition,
              domain + ' will authorize a payment of ' + data.price
            ].join('\n\n')
          }, done)
        }
      ], done)
    }
  ], function (error) {
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
        object[key] = capability
        request.log.info(key, capability)
        done()
      }))
    }
  }

  function mkdirpThenWriteFile (directory, file, data, callback) {
    runSeries([
      function (done) {
        mkdirp(directory, done)
      },
      function (done) {
        var filePath = path.join(directory, file)
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
  var recipientName = recipient.company || recipient.name || recipient.email
  var domain = configuration.mailgun.domain
  return `
<h1>NDA Sent!</h1>
<p>
  You have offered to sign a nondisclosure agreement
  ${sender.company ? 'on behalf of ' + sender.company : ''}
  with ${recipientName} on the terms of ${domain}&rsquo;s
  ${data.form.title}  form agreement, ${spell(data.form.edition)}.
</p>
<p>
  To cancel your request before the other side signs, visit
  <a href=https://${domain}/cancel/${data.cancel}>this link</a>.
</p>`
}

function randomCapability (callback) {
  crypto.randomBytes(32, function (error, bytes) {
    if (error) {
      callback(error)
    } else {
      callback(null, bytes.toString('hex'))
    }
  })
}

function startsWithVowel (string) {
  return ['a', 'e', 'i', 'o', 'u', 'y']
    .includes(string[0].toLowerCase())
}
