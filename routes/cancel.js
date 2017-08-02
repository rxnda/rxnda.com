var cancelPath = require('../data/cancel-path')
var chargePath = require('../data/charge-path')
var ecb = require('ecb')
var email = require('../email')
var escape = require('../util/escape')
var expirationDate = require('../data/expiration-date')
var expired = require('../data/expired')
var formatEmail = require('../util/format-email')
var fs = require('fs')
var internalError = require('./internal-error')
var notFound = require('./not-found')
var novalidate = require('../util/novalidate')
var readJSONFile = require('../data/read-json-file')
var runSeries = require('run-series')
var signPath = require('../data/sign-path')
var spell = require('reviewers-edition-spell')
var xtend = require('xtend')

var banner = require('../partials/banner')
var footer = require('../partials/footer')
var html = require('./html')
var nav = require('../partials/nav')
var preamble = require('../partials/preamble')

module.exports = function cancel (configuration, request, response) {
  var signCapability
  var data
  runSeries([
    function readCancelFile (done) {
      var cancelFile = cancelPath(
        configuration, request.params.capability
      )
      readJSONFile(cancelFile, ecb(done, function (parsed) {
        signCapability = parsed
        done()
      }))
    },
    function readSignFile (done) {
      var signFile = signPath(configuration, signCapability)
      readJSONFile(signFile, ecb(done, function (parsed) {
        data = parsed
        done()
      }))
    }
  ], function (error) {
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
      'If you followed a link to this page to cancel an NDA offer ' +
      'the offer may have expired, the other side may have ' +
      'cancelled, or it may have been deleted from our system after ' +
      'countersigning.'
    ])
  }
}

function get (configuration, request, response, data) {
  var recipient = data.signatures.recipient
  var sender = data.signatures.sender
  var expires = expirationDate(data)
  response.setHeader('Content-Type', 'text/html; charset=ASCII')
  response.end(html`
${preamble('Cancel')}
${banner()}
<main>
  <form
    method=post
    action=/cancel/${data.cancel}
    ${novalidate(request)}>
    <p>
      ${escape(sender.name)}
      (<a href="mailto:${encodeURIComponent(sender.email)}"
        >${escape(sender.email)}</a>)
      offered to enter into an NDA with
      ${escape(
        recipient.company || recipient.name || recipient.email
      )}
      on the terms of an RxNDA standard form NDA.
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
        value='Cancel or Decline this Offer'>
  </form>
</main>
${footer('cancel')}`)
}

function post (configuration, request, response, data) {
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
          fs.unlink(signPath(configuration, data.sign), done)
        },
        continueOnError(function rmCancelFile (done) {
          fs.unlink(cancelPath(configuration, data.cancel), done)
        }),
        continueOnError(function rmChargeFile (done) {
          fs.unlink(chargePath(configuration, data.sign), done)
        })
      ], done)
    },
    function emailConfirmations (done) {
      email(configuration, {
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
    /* istanbul ignore if */
    if (error) {
      request.log.error(error)
      response.statusCode = 500
      response.end()
    } else {
      var sender = data.signatures.sender
      var senderName = sender.company || sender.name
      var recipient = xtend(
        data.signatures.recipient,
        data.countersign
      )
      var form = data.form
      response.setHeader('Content-Type', 'text/html; charset=ASCII')
      response.end(html`
${preamble('Cancelled')}
${banner()}
${nav()}
<main>
  <h2 class=canceled>NDA Canceled!</h2>
  <p>
    You have canceled a nondisclosure agreement offered
    by ${escape(recipient.name)}
    ${
      recipient.company
        ? 'on behalf of ' + escape(recipient.company)
        : ''
    }
    with ${escape(senderName)} on the terms of the
    ${escape(form.title)} form agreement,
    ${escape(spell(form.edition))}.
  </p>
</main>
${footer()}`)
    }
  })

  function continueOnError (task) {
    return function (done) {
      task(function (error) {
        /* istanbul ignore if */
        if (error) {
          request.log.error(error, 'continuing')
        }
        done()
      })
    }
  }
}
