var commonformHTML = require('commonform-html')
var decodeTitle = require('../util/decode-title')
var ecb = require('ecb')
var encodeTitle = require('../util/encode-title')
var escape = require('../util/escape')
var internalError = require('./internal-error')
var notFound = require('./not-found')
var readEdition = require('../data/read-edition')
var readEditions = require('../data/read-editions')
var readTitles = require('../data/read-titles')
var revedCompare = require('reviewers-edition-compare')
var runParallel = require('run-parallel')
var sanitize = require('../util/sanitize-path-component')
var spell = require('reviewers-edition-spell')

var banner = require('../partials/banner')
var draftWarning = require('../partials/draft-warning')
var footer = require('../partials/footer')
var formattingNote = require('../partials/formatting-note')
var formsOverview = require('../partials/forms-overview')
var html = require('./html')
var nav = require('../partials/nav')
var paragraphs = require('../partials/paragraphs')
var preamble = require('../partials/preamble')

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
  readTitles(configuration, function (error, titles) {
    /* istanbul ignore if */
    if (error) {
      internalError(configuration, request, response, error)
    } else {
      var list = ''
      runParallel(
        titles.map(function (title) {
          return function (done) {
            readEditions(
              configuration, sanitize(title),
              ecb(done, function (editions) {
                editions = editions
                  .sort(revedCompare)
                  .reverse()
                var latestEdition = editions[0]
                readEdition(
                  configuration, title, latestEdition,
                  ecb(done, function (latest) {
                    var encoded = encodeTitle(title)
                    list += `
<li>
  <h3>${escape(title)}</h3>
  ${paragraphs(latest.description)}
  <p>
    <a href=/send/${escape(encoded)}/${escape(latestEdition)}
      >Sign &amp; send the latest edition online.</a>
  </p>
  <p>
    <a href=/docx/${escape(encoded)}/${escape(latestEdition)}
      >Download the latest edition as .docx for Microsoft Word.</a>
  </p>
  <p>
    <a href=/forms/${escape(encoded)}/${escape(latestEdition)}
      >Read the latest edition online.</a>
  </p>
  <p>
    <a href=/forms/${escape(encoded)}
      >View all available editions.</a>
  </p>
</li>`
                    done()
                  })
                )
              })
            )
          }
        }),
        function (error) {
          /* istanbul ignore if */
          if (error) {
            internalError(configuration, request, response, error)
          } else {
            response.setHeader(
              'Content-Type', 'text/html; charset=ASCII'
            )
            response.end(html`
${preamble('Forms')}
${banner()}
${nav()}
<main>
  <h2>Forms</h2>
  ${formsOverview()}
  <ul id=list class=listOfForms>${list}</ul>
</main>
${footer()}`)
          }
        }
      )
    }
  })
}

function listEditions (configuration, request, response) {
  var title = decodeTitle(request.params.title)
  readEditions(
    configuration, sanitize(title),
    fail(function (editions) {
      if (editions === false) {
        notFound(configuration, request, response, [
          'There isn’t any form by that title.'
        ])
      } else {
        var list = ''
        runParallel(
          editions.map(function (edition) {
            return function (done) {
              readEdition(
                configuration, title, edition,
                ecb(done, function (data) {
                  list += `
<li>
  <h3>${escape(title)}</h3>
  <p class=edition>${escape(spell(edition))}</p>
  <p class=published>
    Published ${escape(new Date(data.released).toLocaleDateString())}
  </p>
  ${draftWarning(edition)}
  ${paragraphs(data.description)}
  <p>
    <a href=/docx/${escape(encodeTitle(title))}/${escape(edition)}
      >Download .docx for Microsoft Word</a>
  </p>
  <p>
    <a href=/forms/${escape(encodeTitle(title))}/${escape(edition)}
      >Read Online</a>
  </p>
  <p>
    <a href=/send/${escape(encodeTitle(title))}/${escape(edition)}
      >Sign and Send</a>
  </p>
</li>`
                  done()
                })
              )
            }
          }),
          fail(function () {
            response.setHeader(
              'Content-Type', 'text/html; charset=ASCII'
            )
            response.end(html`
${preamble(title)}
${banner()}
${nav()}
<main>
  <h2>${escape(title)}</h2>
  <ul id=list class=listOfForms>${list}</ul>
  ${formsOverview()}
</main>
${footer()}`)
          })
        )
      }
    })
  )

  function fail (callback) {
    return function (error, value) {
      /* istanbul ignore if */
      if (error) {
        internalError(configuration, request, response, error)
      } else {
        callback(value)
      }
    }
  }
}

function showEdition (configuration, request, response) {
  var title = decodeTitle(request.params.title)
  var edition = request.params.edition
  readEdition(
    configuration, sanitize(title), sanitize(edition),
    function (error, data) {
      /* istanbul ignore if */
      if (error) {
        internalError(configuration, request, response, error)
      } else if (data === false) {
        notFound(configuration, request, response, [
          'There isn’t any such edition of the form.'
        ])
      } else {
        response.setHeader('Content-Type', 'text/html; charset=ASCII')
        response.end(html`
${preamble(data.title + ' ' + data.edition)}
<main>
  <h1>${escape(data.title)}, ${escape(data.edition)}</h1>
  ${formattingNote()}
  <article class=commonform>
  ${commonformHTML(data.commonform, [], {
    title: data.title,
    edition: spell(data.edition),
    html5: true,
    lists: true
  }).replace(/[•]/g, '__________')}
  </article>
</main>
${footer()}`)
      }
    }
  )
}
