var Busboy = require('busboy')
var attorneyPath = require('../data/attorney-path')
var encodeTitle = require('../util/encode-title')
var escape = require('../util/escape')
var internalError = require('./internal-error')
var methodNotAllowed = require('./method-not-allowed')
var notFound = require('./not-found')
var pump = require('pump')
var readEdition = require('../data/read-edition')
var readEditions = require('../data/read-editions')
var readJSONFile = require('../data/read-json-file')
var readTitles = require('../data/read-titles')
var revedCompare = require('reviewers-edition-compare')
var revedParse = require('reviewers-edition-parse')
var runParallel = require('run-parallel')
var runWaterfall = require('run-waterfall')
var sanitize = require('../util/sanitize-path-component')
var spell = require('reviewers-edition-spell')

var banner = require('../partials/banner')
var footer = require('../partials/footer')
var html = require('./html')
var nav = require('../partials/nav')
var paragraphs = require('../partials/paragraphs')
var preamble = require('../partials/preamble')

module.exports = function forms (configuration, request, response) {
  var method = request.method
  if (method === 'GET' || method === 'POST') {
    var attorneyFile = attorneyPath(
      configuration, request.params.capability
    )
    readJSONFile(attorneyFile, function (error, attorney) {
      attorney.capability = request.params.capability
      if (error) {
        return notFound(configuration, request, response, [
          'There isn’t any attorney with that ID.'
        ])
      }
      if (method === 'GET') {
        get(configuration, request, response, attorney)
      } else if (method === 'POST') {
        post(configuration, request, response, attorney)
      }
    })
  } else {
    methodNotAllowed.apply(null, arguments)
  }
}

function get (configuration, request, response) {
  runWaterfall([
    readTitles.bind(null, configuration),
    function (titles, done) {
      runParallel(titles.map(function (title) {
        return function (done) {
          readEditions(
            configuration, sanitize(title),
            function (error, editions) {
              if (error) return done(error)
              var listOfEditions = editions
                .filter(function (edition) {
                  return !revedParse(edition).draft
                })
              if (listOfEditions.length === 0) {
                listOfEditions = editions
              }
              listOfEditions.sort(revedCompare)
              listOfEditions.reverse()
              var latestEdition = listOfEditions[0]
              readEdition(
                configuration, title, latestEdition,
                function (error, latest) {
                  if (error) return done(error)
                  done(null, {
                    title: title,
                    editions: listOfEditions,
                    latest: latest
                  })
                }
              )
            }
          )
        }
      }), done)
    }
  ], function (error, forms) {
    /* istanbul ignore if */
    if (error) {
      return internalError(configuration, request, response, error)
    }
    forms.sort(function (a, b) {
      return a.title.localeCompare(b.title)
    })
    response.setHeader('Content-Type', 'text/html; charset=ASCII')
    response.end(html`
${preamble('Attorney')}
${banner()}
${nav()}
<main>
  <h2>Prescribe a Form</h2>
  <ul class=listOfForms>
    ${forms.map(function (form) {
      return html`
        <li>
          <form
              action=/attorney/${request.params.capability}
              method=POST>
            <input type=hidden name=title value="${escape(form.title)}">
            <h3>
              <a
                  href=/forms/${escape(encodeTitle(form.title))}
                  target=_blank>
                ${escape(form.title)}
              </a>
            </h3>
            ${paragraphs(form.latest.notes)}
            <select name=edition>
              ${form.editions.map(function (edition, index) {
                return html`
                  <option value="${escape(edition)}">
                    ${escape(spell(edition))} (${escape(edition)})
                    ${index === 0 && '(latest)'}
                  </option>
                `
              })}
            </select>
            <input type=submit value=Prescribe>
          </form>
        </li>
      `
    })}
  </ul>
</main>
${footer()}
    `)
  })
}

function post (configuratoin, request, response, attorney) {
  var data = {}
  pump(
    request,
    new Busboy({headers: request.headers})
      .on('field', function (name, value) {
        if (value) value = value.trim()
        if (name === 'edition' || name === 'title') {
          data[name] = value
        }
      })
      .once('finish', function () {
        request.log.info({data: data})
        response.statusCode = 303
        response.setHeader(
          'Location',
          '/prescribe/' +
          encodeTitle(data.title) +
          '/' + escape(data.edition) +
          '?attorney=' + attorney.capability
        )
        response.end()
      })
  )
}
