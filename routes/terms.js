var commonformHTML = require('commonform-html')
var internalError = require('./internal-error')
var load = require('../util/load')
var methodNotAllowed = require('./method-not-allowed')
var readPrivacyPolicy = require('../data/read-privacy-policy')
var readTerms = require('../data/read-terms')

var banner = require('../partials/banner')
var footer = require('../partials/footer')
var html = require('./html')
var nav = require('../partials/nav')
var preamble = require('../partials/preamble')

module.exports = function terms (configuration, request, response) {
  if (request.method !== 'GET') {
    methodNotAllowed.apply(null, arguments)
    return
  }
  load({
    terms: readTerms.bind(null, configuration),
    privacy: readPrivacyPolicy.bind(null, configuration)
  }, function (error, loaded) {
    /* istanbul ignore if */
    if (error) {
      internalError(configuration, request, response, error)
    } else {
      var terms = loaded.terms
      var privacy = loaded.privacy
      response.setHeader('Content-Type', 'text/html; charset=ASCII')
      response.end(html`
${preamble('Terms')}
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
