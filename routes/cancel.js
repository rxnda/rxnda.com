var cancelPath = require('../data/cancel-path')
var cancelledMessage = require('../messages/cancelled')
var chargePath = require('../data/charge-path')
var ecb = require('ecb')
var email = require('../email')
var escape = require('../util/escape')
var expirationDate = require('../data/expiration-date')
var expired = require('../data/expired')
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

module.exports = function cancel (request, response) {
  var signCapability
  var data
  runSeries([
    function readCancelFile (done) {
      var cancelFile = cancelPath(request.params.capability)
      readJSONFile(cancelFile, ecb(done, function (parsed) {
        signCapability = parsed
        done()
      }))
    },
    function readSignFile (done) {
      var signFile = signPath(signCapability)
      readJSONFile(signFile, ecb(done, function (parsed) {
        data = parsed
        done()
      }))
    }
  ], function (error) {
    if (error) {
      /* istanbul ignore else */
      if (error.code === 'ENOENT') return respond404()
      return internalError(request, response, error)
    }
    if (expired(data)) return respond404()
    if (request.method === 'POST') return post(request, response, data)
    get(request, response, data)
  })

  function respond404 () {
    notFound(request, response, [
      'If you followed a link to this page to cancel an NDA offer ' +
      'the offer may have expired, the other side may have ' +
      'declined, or it may have been deleted from the system after ' +
      'countersigning.'
    ])
  }
}

function get (request, response, data) {
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

function post (request, response, data) {
  runSeries([
    function rmFiles (done) {
      runSeries([
        function rmSignFile (done) {
          fs.unlink(signPath(data.sign), done)
        },
        continueOnError(function rmCancelFile (done) {
          fs.unlink(cancelPath(data.cancel), done)
        }),
        continueOnError(function rmChargeFile (done) {
          fs.unlink(chargePath(data.sign), done)
        })
      ], done)
    },
    function emailConfirmations (done) {
      email(request.log, cancelledMessage(data), done)
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
