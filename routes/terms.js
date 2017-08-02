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
    }
  })
}

function longDate (date) {
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    year: 'numeric',
    month: 'long'
  })
}
