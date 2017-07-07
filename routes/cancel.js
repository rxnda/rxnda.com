var ecb = require('ecb')
var escape = require('escape-html')
var formatEmail = require('../format-email')
var fs = require('fs')
var internalError = require('./internal-error')
var mailgun = require('../mailgun')
var notFound = require('./not-found')
var parse = require('json-parse-errback')
var path = require('path')
var pump = require('pump')
var readTemplate = require('./read-template')
var runSeries = require('run-series')
var spell = require('reviewers-edition-spell')
var trumpet = require('trumpet')
var xtend = require('xtend')

module.exports = function (configuration, request, response) {
  var directory = configuration.directory
  var signCapability
  var data
  runSeries([
    function readCancelFile (done) {
      var cancelPath = path.join(
        directory, 'cancel', request.params.capability
      )
      fs.readFile(cancelPath, ecb(done, function (json) {
        parse(json, ecb(done, function (parsed) {
          signCapability = parsed
          done()
        }))
      }))
    },
    function readSignFile (done) {
      var signFile = path.join(directory, 'sign', signCapability)
      fs.readFile(signFile, ecb(done, function (json) {
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

function get (configuration, request, response, data) {
  var body = trumpet()
  response.setHeader('Content-Type', 'text/html; charset=ASCII')
  pump(body, response)
  body.select('main')
    .createWriteStream()
    .end(form(configuration, data))
  pump(readTemplate('cancel.html'), body)
}

function form (configuration, data) {
  var recipient = data.signatures.recipient
  var sender = data.signatures.sender
  var expires = new Date(data.timestamp)
  expires.setDate(expires.getDate() + 7)
  return `
<form
  method=post
  action=/cancel/${data.cancel}
  <p>
    ${escape(sender.name)}
    (<a href="mailto:${encodeURIComponent(sender.email)}"
      >${escape(sender.email)}</a>)
    offered to enter into an NDA with
    ${escape(recipient.company || recipient.name || recipient.email)}
    on the terms of an &#8478;nda standard form NDA.
    The offer expires ${escape(expires.toLocaleString())}.
  </p>
  <p>
    <a
        href=/view/${data.sign}
        target=_blank>
      Click here to view the full text of the NDA.
    </a>
  </p>
  <input
      id=submitButton
      type=submit
      value='Cancel or Reject this Offer'>
</form>`
}

function post (configuration, request, response, data) {
  var directory = configuration.directory
  var sender = data.signatures.sender
  var senderName = sender.company || sender.name
  var recipient = data.signatures.recipient
  var recipientName = (
    recipient.company || recipient.name || recipient.email
  )
  runSeries([
    function rmFiles (done) {
      runSeries([
        function rmSignFile (done) {
          fs.unlink(path.join(directory, 'sign', data.sign), done)
        },
        continueOnError(function rmCancelFile (done) {
          fs.unlink(path.join(directory, 'cancel', data.cancel), done)
        }),
        continueOnError(function rmChargeFile (done) {
          fs.unlink(path.join(directory, 'charge', data.sign), done)
        })
      ], done)
    },
    function emailConfirmations (done) {
      mailgun(configuration, {
        to: sender.email + ', ' + recipient.email,
        subject: 'NDA Offer Cancelled',
        text: formatEmail(configuration, [
          'The offer to enter an NDA ' +
          'between' + senderName + ' and ' + recipientName + ' ' +
          'has been cancelled.',
          'No one will be charged.'
        ].join('\n\n'))
      }, done)
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
  var sender = data.signatures.sender
  var senderName = sender.company || sender.name
  var recipient = xtend(
    data.signatures.recipient,
    data.countersign
  )
  var domain = configuration.domain
  var form = data.form
  return `
<h2>NDA Canceled!</h2>
<p>
  You have canceled a nondisclosure agreement offered
  by ${escape(recipient.name)}
  ${
    recipient.company
      ? 'on behalf of ' + escape(recipient.company)
      : ''
  }
  with ${escape(senderName)} on the terms of ${domain}&rsquo;s
  ${escape(form.title)} form agreement,
  ${spell(form.edition)}.
</p>`
}
