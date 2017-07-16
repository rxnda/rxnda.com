var commonformHTML = require('commonform-html')
var pump = require('pump')
var readTemplate = require('./read-template')
var trumpet = require('trumpet')

module.exports = function terms (configuration, request, response) {
  var body = trumpet()
  response.setHeader('Content-Type', 'text/html; charset=ASCII')
  pump(body, response)
  body.select('main')
    .createWriteStream()
    .end(content(configuration))
  pump(readTemplate('terms.html'), body)
}

function content (configuration) {
  var terms = configuration.terms
  var privacy = configuration.privacy
  return `
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
`
}
