var commonformHTML = require('commonform-html')
var internalError = require('./internal-error')
var load = require('../util/load')
var longDate = require('../util/long-date')
var methodNotAllowed = require('./method-not-allowed')
var readPrivacyPolicy = require('../data/read-privacy-policy')
var readTerms = require('../data/read-terms')

var banner = require('../partials/banner')
var footer = require('../partials/footer')
var html = require('./html')
var nav = require('../partials/nav')
var preamble = require('../partials/preamble')

module.exports = function terms (request, response) {
  if (request.method !== 'GET') {
    return methodNotAllowed.apply(null, arguments)
  }
  load({
    terms: readTerms,
    privacy: readPrivacyPolicy
  }, function (error, loaded) {
    /* istanbul ignore if */
    if (error) {
      return internalError(request, response, error)
    }
    var terms = loaded.terms
    var privacy = loaded.privacy
    response.setHeader('Content-Type', 'text/html; charset=ASCII')
    response.end(html`
${preamble('Terms')}
${banner()}
${nav()}
<main>
  <p>
    Jump to:
    <a href=#terms>Terms of Service</a> or
    <a href=#privacy>Privacy Policy</a>
  </p>
  <article id=terms class=commonform>
    ${commonformHTML(
      terms.commonform,
      terms.directions,
      {
        title: 'RxNDA Terms of Service',
        edition: (
          'Last Updated: ' +
          longDate(new Date(terms.updated))
        ),
        lists: true,
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
        edition: (
          'Last Updated: ' +
          longDate(new Date(privacy.updated))
        ),
        lists: true,
        html5: true
      }
    )}
  </article>
</main>
${footer()}`)
  })
}
