var decodeTitle = require('../util/decode-title')
var encodeTitle = require('../util/encode-title')
var escape = require('escape-html')
var internalError = require('./internal-error')
var notFound = require('./not-found')
var pump = require('pump')
var readTemplate = require('./read-template')
var revedCompare = require('reviewers-edition-compare')
var revedParse = require('reviewers-edition-parse')
var spell = require('reviewers-edition-spell')
var trumpet = require('trumpet')

module.exports = function (configuration, request, response) {
  var title = decodeTitle(request.params.title)
  if (!configuration.forms.hasOwnProperty(title)) {
    return notFound.apply(null, arguments)
  }
  var edition = configuration.forms[title].find(function (edition) {
    return edition.edition === request.params.edition
  })
  if (!edition) {
    return notFound.apply(null, arguments)
  }

  if (request.method === 'POST') {
    post(configuration, request, response, edition)
  } else {
    get(configuration, request, response, edition)
  }
}

function get (configuration, request, response, edition) {
  var body = trumpet()
  response.setHeader('Content-Type', 'text/html; charset=ASCII')
  pump(body, response)
  body.select('main')
    .createWriteStream()
    .end(form(edition))
  pump(readTemplate('send.html'), body)
}

function form (edition) {
  return (
`<form
    method=post
    action=/send/${encodeTitle(edition.title)}/${edition.edition}/>
  <h2>${escape(edition.title)}</h2>
  <p class=edition>${spell(edition.edition)}</p>
  <p>
    <a
        href=https://commonform.org/forms/${edition.hash}
        target=_blank
      >Review on commonform.org</a>
  </p>
  ${inputs()}
  <input type=submit value='Sign &amp; Send'>
</form>`
  )

  function inputs () {
    return edition
      .directions
      .map(function (direction) {
        return input(direction)
      })
      .join('')
  }

  function input (direction) {
    var keys = direction
      .blank
      .map(function (element) {
        return element.toString()
      })
      .join(',')
    return (
`
<p><label for='${keys}'>${direction.label}</label></p>
<p><input name='${keys}' type=text></p>
${notes(direction.notes)}
`
    )
  }
}

function notes (array) {
  return array
    .map(function (element) {
      return `<p>${escape(element)}</p>`
    })
    .join('')
}

function post (configuration, request, response, edition) {
  response.end()
}
