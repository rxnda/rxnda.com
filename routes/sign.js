var Busboy = require('busboy')
var docx = require('commonform-docx')
var ecb = require('ecb')
var ed25519 = require('ed25519')
var escape = require('escape-html')
var escapeStringRegexp = require('escape-string-regexp')
var formatEmail = require('../format-email')
var fs = require('fs')
var internalError = require('./internal-error')
var mailgun = require('../mailgun')
var notFound = require('./not-found')
var ooxmlSignaturePages = require('ooxml-signature-pages')
var outlineNumbering = require('outline-numbering')
var parse = require('json-parse-errback')
var path = require('path')
var pump = require('pump')
var readJSONFile = require('../data/read-json-file')
var readTemplate = require('./read-template')
var runSeries = require('run-series')
var sameArray = require('../data/same-array')
var signPath = require('../data/sign-path')
var signatureProperties = require('../data/signature-properties')
var spell = require('reviewers-edition-spell')
var stringify = require('json-stable-stringify')
var stripe = require('stripe')
var trumpet = require('trumpet')
var validSignPost = require('../data/valid-sign-post')
var xtend = require('xtend')

module.exports = function (configuration, request, response) {
  var data
  runSeries([
    function readSignFile (done) {
      var signFile = signPath(configuration, request.params.capability)
      readJSONFile(signFile, ecb(done, function (parsed) {
        data = parsed
        done()
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

function get (configuration, request, response, data) {
  var body = trumpet()
  response.setHeader('Content-Type', 'text/html; charset=ASCII')
  pump(body, response)
  body.select('main')
    .createWriteStream()
    .end(form(configuration, data))
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
    on the terms of an &#8478;nda standard form NDA.
    You can accept the offer by countersigning online, at this address,
    until ${expires.toLocaleString()}.
  </p>
  ${data.directions.length !== 0 ? blanks() : ''}
  <p>
    <a
        href=/view/${data.sign}
        target=_blank>
      Click here to view the full text of the NDA.
    </a>
  </p>
  <p>
    <a
        href=/
        target=_blank>
      Click here to read more about Rxnda and how it works.
    </a>
  </p>
  <p>
    <a
        href=/cancel/${data.cancel}
        target=_blank>
      Click here to visit a page where you can decline this request.
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
            ' ' + escape(sender.jurisdiction) + ' ' +
            escape(sender.form)
          )
          : ' as an individual '
      }
      ${new Date(data.timestamp).toLocaleString()}.
    </p>
  </section>

  <section class=yourSignature>
    <h4>Your Signature</h4>
    ${recipientBlock(data.form.signatures[1], recipient)}
    ${byline(recipient)}
    ${
      data.form.signatures[1].information
        .filter(function (name) {
          return name !== 'email' && name !== 'date'
        })
        .map(function (name) {
          return input(
            'signatures-recipient-' + name,
            (name === 'date' ? '' : 'Your ') +
            name[0].toUpperCase() + name.slice(1),
            []
          )
        })
        .join('')
    }
    <section class=information>
      <p>Once you press Countersign:</p>
      <ol>
        <li>
          ${escape(data.address)} will e-mail both you and the other
          side, attaching a fully-signed Word copy of the NDA.
        </li>
        <li>
          ${escape(configuration.domain)} will charge the sender.
          You will not be charged.
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
        'Your Company&rsquo;s Legal Jurisdiction',
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

function startsWithVowel (string) {
  return ['a', 'e', 'i', 'o', 'u', 'y']
    .includes(string[0].toLowerCase())
}

function input (name, label, notes, value) {
  if (value) {
    return `
<section class=field>
  <label for=${name}>${label}</label>
  <input
      name=${name}
      value='${escape(value)}'
      type=text
      required
      readonly=readonly>
  ${value ? prefilled() : paragraphs(notes)}
</section>`
  } else {
    if (name.endsWith('address')) {
      return `
<section class=field>
  <label for='${name}'>${label}</label>
  ${asterisk()}
  <textarea
      rows=3
      name=${name}
      required
  ></textarea>
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
  }

  function prefilled () {
    if (notes.length === 0) {
      return ''
    } else {
      return `
<p class=note>
  The sender filled this blank out for you.
  If they did so incorrectly, tell them to resend the request.
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
    ${
      recipient.name
        ? `pattern="${escapeStringRegexp(recipient.name)}"`
        : ''
    }
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

function post (configuration, request, response, send) {
  var countersign = {}
  pump(
    request,
    new Busboy({headers: request.headers})
      .on('field', function (name, value) {
        if (value) {
          if (name.startsWith('signatures-recipient-')) {
            request.log.info(name + '=' + value)
            var key = name.slice(21)
            if (signatureProperties.includes(key)) {
              countersign[key] = value
                .trim()
                .replace(/\r?\n/, '\n')
            }
          }
        } else {
          request.log.info(name)
        }
      })
      .once('finish', function () {
        request.log.info({countersign: countersign})
        if (!validSignPost(countersign, send.form)) {
          response.statusCode = 400
          response.end()
        } else {
          countersign.date = new Date().toISOString()
          var data = {
            send: send,
            countersign: countersign,
            address: (
              configuration.mailgun.sender + '@' +
              configuration.mailgun.domain
            )
          }
          write(configuration, request, response, data)
        }
      })
  )
}

function write (configuration, request, response, data) {
  var directory = configuration.directory
  var sender = data.send.signatures.sender
  var senderName = sender.company || sender.name
  var recipient = xtend(
    data.send.signatures.recipient, data.countersign
  )
  var recipientName = (
    recipient.company || recipient.name || recipient.email
  )
  runSeries([
    function emailDOCX (done) {
      mailgun(configuration, {
        to: sender.email + ',' + recipient.email,
        subject: 'Signed NDA',
        text: formatEmail(configuration, [
          'Attached please find a countersigned copy of the NDA ' +
          'between' + senderName + ' and ' + recipientName + '.'
        ].join('\n\n')),
        docx: {
          data: makeDOCX(configuration, data),
          name: 'NDA.docx'
        }
      }, done)
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
          stripe.charges.capture(chargeID, ecb(done, function (charge) {
            request.log.info({charge: charge})
            done()
          }))
        },
        continueOnError(function rmChargeFile (done) {
          fs.unlink(chargeFile, done)
        })
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
      pump(readTemplate('agreed.html'), body)
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

function success (configuration, data) {
  var sender = data.send.signatures.sender
  var senderName = sender.company || sender.name
  var recipient = xtend(
    data.send.signatures.recipient,
    data.countersign
  )
  var domain = configuration.domain
  var form = data.send.form
  return `
<h2>NDA Agreed!</h2>
<p>
  You have countersigned a nondisclosure agreement
  ${
    recipient.company
      ? 'on behalf of ' + escape(recipient.company)
      : ''
  }
  with ${escape(senderName)} on the terms of ${domain}&rsquo;s
  ${escape(form.title)} form agreement,
  ${spell(form.edition)}.
</p>
<p>
  You will receive a fully-signed Word copy by e-mail
  from ${escape(data.address)} shortly.
</p>`
}

function makeDOCX (configuration, data) {
  var send = data.send
  var countersign = data.countersign
  var form = data.send.form
  var zip = docx(
    form.commonform,
    send.directions,
    {
      title: 'Rxnda ' + form.title + '\n' + spell(form.edition),
      numbering: outlineNumbering,
      indentMargins: false,
      centerTitle: true,
      after: ooxmlSignaturePages([
        // Sender Page
        prefilledSignaturePage(
          configuration,
          form.signatures[0],
          xtend(send.signatures.sender, {date: send.timestamp})
        ),
        // Recipient Page
        prefilledSignaturePage(
          configuration,
          form.signatures[1],
          xtend(send.signatures.recipient, countersign)
        )
      ])
    }
  )
  return zip.generate({output: 'nodebuffer'})
}

function prefilledSignaturePage (configuration, page, data) {
  var returned = clone(page)
  returned.name = data.name
  returned.meta = (
    'Signed via rxnda.com. Ed25519:\n' +
    ed25519.Sign(
      Buffer.from(stringify(data), 'utf8'),
      configuration.keys.private
    ).toString('hex')
  )
  if (returned.entities) {
    returned.entities = [
      {
        name: data.company,
        jurisdiction: data.jurisdiction,
        form: data.form,
        by: data.title
      }
    ]
  }
  returned.conformed = '/' + data.signature + '/'
  // Replace information array with prefilled information object.
  returned.information = returned.information
    .reduce(function (object, key) {
      object[key] = data[key]
      return object
    }, {})
  return returned
}

function clone (argument) {
  return JSON.parse(JSON.stringify(argument))
}
