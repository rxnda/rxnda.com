var commonformHTML = require('commonform-html')
var ecb = require('ecb')
var escape = require('escape-html')
var fs = require('fs')
var internalError = require('./internal-error')
var notFound = require('./not-found')
var parse = require('json-parse-errback')
var path = require('path')
var pump = require('pump')
var readTemplate = require('./read-template')
var runSeries = require('run-series')
var spell = require('reviewers-edition-spell')
var trumpet = require('trumpet')

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
      get(configuration, request, response, data)
    }
  })
}

function get (configuration, request, response, edition) {
  var body = trumpet()
  response.setHeader('Content-Type', 'text/html; charset=ASCII')
  pump(body, response)
  body.select('main')
    .createWriteStream()
    .end(content(configuration, edition))
  pump(readTemplate('view.html'), body)
}

function content (configuration, data) {
  return `
<article class=commonform>
  <h1>${escape(data.form.title)}</h1>
  <p class=edition>${escape(spell(data.form.edition))}</p>
  ${commonformHTML(
    data.form.commonform,
    data.directions,
    {html5: true}
  )}
</article>`
}
