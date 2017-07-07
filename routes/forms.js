var clone = require('../data/clone')
var encodeTitle = require('../util/encode-title')
var escape = require('escape-html')
var pump = require('pump')
var readTemplate = require('./read-template')
var revedCompare = require('reviewers-edition-compare')
var revedParse = require('reviewers-edition-parse')
var trumpet = require('trumpet')

module.exports = function (configuration, request, response) {
  var body = trumpet()
  response.setHeader('Content-Type', 'text/html; charset=ASCII')
  pump(body, response)
  pump(readTemplate('forms.html'), body)
  var list = body.select('#forms').createWriteStream()
  var forms = clone(configuration.forms)
  // TODO Show forms with latest updates first.
  Object.keys(forms).forEach(function (title) {
    var editions = forms[title].sort(function (a, b) {
      return revedCompare(a.edition, b.edition)
    })
    var current = editions.find(function (edition) {
      return revedParse(edition.edition).draft === undefined
    })
    var displayed = current || editions[0]
    list.write('<section class=form>')
    list.write(`<h3>${escape(title)}</h3>`)
    list.write(
`<p class=edition>
  ${current ? 'Current' : 'Latest'}
  Edition: ${escape(displayed.edition)}
</p>`
    )
    list.write('<section class=description>')
    displayed.description.forEach(function (string) {
      list.write(`<p class=description>${escape(string)}</p>`)
    })
    list.write(
  `<p class=send>
    <a href=/send/${encodeTitle(title)}/${displayed.edition}
      >Sign and send this NDA.</a>
  </p>`
    )
    list.write('</section>')
    list.write(
`
<p class=commonform>
  View the text of this edition of the form
  <a
    href=https://commonform.org/forms/${displayed.hash}
    target=_blank
    >on CommonForm.org</a>.
</p>
`
  )
    list.write(
`
<p class=repository>
  To give submit feedback or propose changes to this form, visit
  <a
    href=${displayed.repository}
    target=_blank
    >${displayed.repository}</a>.
</p>
`
  )
    list.write('</section>')
  })
  list.end()
}
