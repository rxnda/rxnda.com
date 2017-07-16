var commonformHTML = require('commonform-html')
var decodeTitle = require('../util/decode-title')
var draftWarning = require('../util/draft-warning')
var encodeTitle = require('../util/encode-title')
var escape = require('../util/escape')
var notFound = require('./not-found')
var paragraphs = require('../util/paragraphs')
var pump = require('pump')
var readTemplate = require('./read-template')
var spell = require('reviewers-edition-spell')
var trumpet = require('trumpet')

module.exports = function forms (configuration, request, response) {
  if (request.method === 'GET') {
    if (!request.params.title) {
      listForms(configuration, request, response)
    } else {
      if (!request.params.edition) {
        listEditions(configuration, request, response)
      } else {
        showEdition(configuration, request, response)
      }
    }
  } else {
    response.statusCode = 405
    response.end()
  }
}

function listForms (configuration, request, response) {
  response.setHeader('Content-Type', 'text/html; charset=ASCII')
  var body = trumpet()
  pump(body, response)
  body.select('#list')
    .createWriteStream()
    .end(list())
  pump(readTemplate('forms.html'), body)
  function list () {
    return Object.keys(configuration.forms)
      .map(function (key) {
        var form = configuration.forms[key]
        var edition = form[0]
        return `
<li>
  <h3>${escape(key)}</h3>
  ${paragraphs(edition.description)}
  <p>
    <a href=/docx/${encodeTitle(key)}/${edition.edition}
      >Download the latest edition as .docx for Microsoft Word</a>
  </p>
  <p>
    <a href=/forms/${encodeTitle(key)}/${edition.edition}
      >Read the latest edition online</a>
  </p>
  <p>
    <a href=/forms/${encodeTitle(key)}
      >View all available editions</a>
  </p>
</li>`
      })
      .join('\n')
  }
}

function listEditions (configuration, request, response) {
  var title = decodeTitle(request.params.title)
  var form = configuration.forms[title]
  if (!form) return notFound.apply(this, arguments)
  response.setHeader('Content-Type', 'text/html; charset=ASCII')
  var body = trumpet()
  pump(body, response)
  body.select('h2')
    .createWriteStream()
    .end(title)
  body.select('#list')
    .createWriteStream()
    .end(list())
  pump(readTemplate('forms.html'), body)

  function list () {
    return form
      .map(function (edition) {
        return `
<li>
  <h3>${escape(edition.title)}</h3>
  <p class=edition>${escape(spell(edition.edition))}</p>
  <p class=published>
    Published ${escape(new Date(edition.released).toLocaleDateString())}
  </p>
  ${draftWarning(edition)}
  ${paragraphs(edition.description)}
  <p>
    <a href=/docx/${encodeTitle(title)}/${edition.edition}
      >Download .docx for Microsoft Word</a>
  </p>
  <p>
    <a href=/forms/${encodeTitle(title)}/${edition.edition}
      >Read Online</a>
  </p>
  <p>
    <a href=/send/${encodeTitle(title)}/${edition.edition}
      >Sign and Send</a>
  </p>
</li>`
      })
      .join('\n')
  }
}

function showEdition (configuration, request, response) {
  var title = decodeTitle(request.params.title)
  var form = configuration.forms[title]
  if (!form) return notFound.apply(this, arguments)
  var edition = form.find(function (element) {
    return element.edition === request.params.edition
  })
  if (!edition) return notFound.apply(this, arguments)
  response.setHeader('Content-Type', 'text/html; charset=ASCII')
  var body = trumpet()
  pump(body, response)
  body.select('title')
    .createWriteStream()
    .end(
      escape(edition.title) + ', ' +
      escape(edition.edition)
    )
  body.select('main')
    .createWriteStream()
    .end(content())
  pump(readTemplate('empty.html'), body)

  function content () {
    return `
<article class=commonform>
  ${commonformHTML(
    edition.commonform,
    [],
    {
      title: edition.title,
      edition: spell(edition.edition),
      html5: true,
      lists: true
    }
  )}
</article>`
      .replace(/[•]/g, '__________')
  }
}
