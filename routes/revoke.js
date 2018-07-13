var ecb = require('ecb')
var email = require('../email')
var escape = require('../util/escape')
var expired = require('../data/expired')
var prescriptionPath = require('../data/prescription-path')
var fs = require('fs')
var internalError = require('./internal-error')
var notFound = require('./not-found')
var novalidate = require('../util/novalidate')
var readJSONFile = require('../data/read-json-file')
var revokePath = require('../data/revoke-path')
var revokedMessage = require('../messages/revoked')
var runSeries = require('run-series')
var spell = require('reviewers-edition-spell')

var banner = require('../partials/banner')
var footer = require('../partials/footer')
var html = require('./html')
var nav = require('../partials/nav')
var preamble = require('../partials/preamble')

module.exports = function revoke (request, response) {
  var fillCapability
  var data
  runSeries([
    function readRevokeFile (done) {
      var revokeFile = revokePath(request.params.capability)
      readJSONFile(revokeFile, ecb(done, function (parsed) {
        fillCapability = parsed
        done()
      }))
    },
    function readPrescriptionFile (done) {
      var prescriptionFile = prescriptionPath(fillCapability)
      readJSONFile(prescriptionFile, ecb(done, function (parsed) {
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
      'If you followed a link to this page to revoke an NDA ' +
      'prescription, the prescription may have expired, ' +
      'or it may have been revoked already.'
    ])
  }
}

function get (request, response, data) {
  var sender = data.signatures.sender
  var form = data.form
  var attorney = data.attorney
  response.setHeader('Content-Type', 'text/html; charset=ASCII')
  response.end(html`
${preamble('Revoke')}
${banner()}
<main>
  <form
    method=post
    action=/revoke/${data.revoke}
    ${novalidate(request)}>
    <p>
      ${escape(attorney.name)}
      (<a href="mailto:${encodeURIComponent(attorney.email)}"
        >${escape(attorney.email)}</a>)
      prescribed ${form.title}, ${spell(form.edition)},
      for use by
      ${escape(sender.company || sender.name)}
      on ${escape(new Date(data.timestamp).toLocaleDateString())}.
    </p>
    <input
        id=submitButton
        type=submit
        value='Revoke this Prescription'>
  </form>
</main>
${footer('cancel')}`)
}

function post (request, response, data) {
  runSeries([
    function rmFiles (done) {
      runSeries([
        function rmPrescriptionFile (done) {
          fs.unlink(prescriptionPath(data.fill), done)
        },
        continueOnError(function rmRevokeFile (done) {
          fs.unlink(revokePath(data.revoke), done)
        })
      ], done)
    },
    function emailConfirmations (done) {
      email(request.log, revokedMessage(data), done)
    }
  ], function (error) {
    /* istanbul ignore if */
    if (error) {
      request.log.error(error)
      response.statusCode = 500
      return response.end()
    }
    response.setHeader('Content-Type', 'text/html; charset=ASCII')
    response.end(html`
${preamble('Revoked')}
${banner()}
${nav()}
<main>
  <h2 class=revoked>Prescription Revoked!</h2>
  <p>
    You have revoked the prescription.
  </p>
</main>
${footer()}`)
  })

  function continueOnError (task) {
    return function (done) {
      task(function (error) {
        /* istanbul ignore if */
        if (error) request.log.error(error, 'continuing')
        done()
      })
    }
  }
}
