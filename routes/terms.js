var commonformHTML = require('commonform-html')
var ecb = require('ecb')
var internalError = require('./internal-error')
var pump = require('pump')
var readPrivacyPolicy = require('../data/read-privacy-policy')
var readTemplate = require('./read-template')
var readTerms = require('../data/read-terms')
var runParallel = require('run-parallel')
var trumpet = require('trumpet')

module.exports = function terms (configuration, request, response) {
  var terms
  var privacy
  runParallel([
    function (done) {
      readTerms(configuration, ecb(done, function (data) {
        terms = data
        done()
      }))
    },
    function (done) {
      readPrivacyPolicy(configuration, ecb(done, function (data) {
        privacy = data
        done()
      }))
    }
  ], function (error) {
    if (error) {
      internalError(configuration, request, response, error)
    } else {
      var body = trumpet()
      response.setHeader('Content-Type', 'text/html; charset=ASCII')
      pump(body, response)
      body.select('main')
        .createWriteStream()
        .end(`
<article id=terms class=commonform>
  ${commonformHTML(
    terms.commonform,
    terms.directions,
    {
      title: 'RxNDA Terms of Service',
      edition: new Date(terms.updated)
        .toLocaleDateString(),
      html5: true
    }
  )}
</article>
<article id=privacy class=commonform>
  ${commonformHTML(
    privacy.commonform,
    privacy.directions,
    {
      title: 'RxNDA Privacy Policy',
      edition: new Date(privacy.updated)
        .toLocaleDateString(),
      html5: true
    }
  )}
</article>`)
      pump(readTemplate('terms.html'), body)
    }
  })
}
