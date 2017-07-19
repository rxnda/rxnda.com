var commonformHTML = require('commonform-html')
var ecb = require('ecb')
var internalError = require('./internal-error')
var readPrivacyPolicy = require('../data/read-privacy-policy')
var readTerms = require('../data/read-terms')
var runParallel = require('run-parallel')

var banner = require('../partials/banner')
var footer = require('../partials/footer')
var html = require('./html')
var nav = require('../partials/nav')
var preamble = require('../partials/preamble')

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
    /* istanbul ignore if */
    if (error) {
      internalError(configuration, request, response, error)
    } else {
      response.setHeader('Content-Type', 'text/html; charset=ASCII')
      response.end(html`
${preamble()}
${banner()}
${nav()}
<main>
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
  </article>
</main>
${footer()}`)
    }
  })
}
