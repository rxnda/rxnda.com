var commonformHTML = require('commonform-html')
var decodeTitle = require('../util/decode-title')
var ecb = require('ecb')
var encodeTitle = require('../util/encode-title')
var escape = require('../util/escape')
var internalError = require('./internal-error')
var longDate = require('../util/long-date')
var methodNotAllowed = require('./method-not-allowed')
var notFound = require('./not-found')
var readEdition = require('../data/read-edition')
var readEditions = require('../data/read-editions')
var readTitles = require('../data/read-titles')
var revedCompare = require('reviewers-edition-compare')
var revedParse = require('reviewers-edition-parse')
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

module.exports = function forms (request, response) {
  if (request.method === 'GET') {
    if (!request.params.title) return listForms(request, response)
    if (!request.params.edition) return listEditions(request, response)
    return showEdition(request, response)
  }
  methodNotAllowed.apply(null, arguments)
}

function listForms (request, response) {
  readTitles(function (error, titles) {
    /* istanbul ignore if */
    if (error) {
      return internalError(request, response, error)
    }
    var list = ''
    runParallel(
      titles.map(function (title) {
        return function (done) {
          readEditions(
            sanitize(title),
            ecb(done, function (editions) {
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
                title, latestEdition,
                ecb(done, function (latest) {
                  var encoded = encodeTitle(title)
                  list += `
<li>
  <h3>${escape(title)}</h3>
  ${paragraphs(latest.notes)}
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
          return internalError(request, response, error)
        }
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
  <h3>Overview</h3>
  <p>Sixteen standard RxNDA forms are available, covering all combinations of:</p>
  <ol>
    <li>broad (B) or narrow (N) definition of confidential information</li>
    <li>one-way (1W) or two-way (2W) confidentiality obligations</li>
    <li>
      business-to-business (B2B),
      business-to-individual (B2I),
      individual-to-business (I2B), and
      individual-to-individual (I2I)
    </li>
  </ol>
  <p>
    All sixteen variants come from a single template,
    and share most language in common,
    making them easy to review and compare:
  </p>
  <table class=formsTable>
    <thead>
      <tr>
        <td colspan=3></td>
        <th>Broad</th>
        <th>Narrow</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th rowspan=4>One-Way</th>
        <th rowspan=2>From Business</th>
        <th>To Business</th>
        <td><a href=/forms/B-1W-B2B>B-1W-B2B</a></td>
        <td><a href=/forms/N-1W-B2B>N-1W-B2B</a></td>
      </tr>
      <tr>
        <th>To Individual</th>
        <td><a href=/forms/B-1W-B2I>B-1W-B2I</a></td>
        <td><a href=/forms/N-1W-B2I>N-1W-B2I</a></td>
      </tr>
      <tr>
        <th rowspan=2>From Individual</th>
        <th>To Business</th>
        <td><a href=/forms/B-1W-I2B>B-1W-I2B</a></td>
        <td><a href=/forms/N-1W-I2B>N-1W-I2B</a></td>
      </tr>
      <tr>
        <th>To Individual</th>
        <td><a href=/forms/B-1W-I2I>B-1W-I2I</a></td>
        <td><a href=/forms/N-1W-I2I>N-1W-I2I</a></td>
      </tr>
      <tr>
        <th rowspan=4>Two-Way</th>
        <th rowspan=2>From Business</th>
        <th>To Business</th>
        <td><a href=/forms/B-2W-B2B>B-2W-B2B</a></td>
        <td><a href=/forms/N-2W-B2B>N-2W-B2B</a></td>
      </tr>
      <tr>
        <th>To Individual</th>
        <td><a href=/forms/B-2W-B2I>B-2W-B2I</a></td>
        <td><a href=/forms/N-2W-B2I>N-2W-B2I</a></td>
      </tr>
      <tr>
        <th rowspan=2>From Individual</th>
        <th>To Business</th>
        <td><a href=/forms/B-2W-I2B>B-2W-I2B</a></td>
        <td><a href=/forms/N-2W-I2B>N-2W-I2B</a></td>
      </tr>
      <tr>
        <th>To Individual</th>
        <td><a href=/forms/B-2W-I2I>B-2W-I2I</a></td>
        <td><a href=/forms/N-2W-I2I>N-2W-I2I</a></td>
      </tr>
    </tbody>
  </table>
  <h3>Updates</h3>
  <p>
    For the latest news on RxNDA forms,
    <a href=/lists>subscribe to our lawyers mailing list</a>.
  </p>
  <ul id=list class=listOfForms>${list}</ul>
</main>
${footer()}`)
      }
    )
  })
}

function listEditions (request, response) {
  var title = decodeTitle(request.params.title)
  readEditions(
    sanitize(title),
    fail(function (editions) {
      if (editions === false) {
        return notFound(request, response, [
          'There isn’t any form by that title.'
        ])
      }
      var list = ''
      var listOfEditions = editions
        .filter(function (edition) {
          return !revedParse(edition).draft
        })
      if (listOfEditions.length === 0) {
        listOfEditions = editions
      }
      runParallel(
        listOfEditions
          .sort(revedCompare)
          .reverse()
          .map(function (edition) {
            return function (done) {
              readEdition(
                title, edition,
                ecb(done, function (data) {
                  list += `
<li>
  <h3>${escape(title)}</h3>
  <p class=edition>${escape(spell(edition))}</p>
  <p class=published>
    Published ${escape(longDate(new Date(data.published)))}
  </p>
  ${draftWarning(edition)}
  ${paragraphs(data.notes)}
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
    })
  )

  function fail (callback) {
    return function (error, value) {
      /* istanbul ignore if */
      if (error) return internalError(request, response, error)
      callback(value)
    }
  }
}

function showEdition (request, response) {
  var title = decodeTitle(request.params.title)
  var edition = request.params.edition
  readEdition(
    sanitize(title), sanitize(edition),
    function (error, data) {
      /* istanbul ignore if */
      if (error) {
        return internalError(request, response, error)
      }
      if (data === false) {
        return notFound(request, response, [
          'There isn’t any such edition of the form.'
        ])
      }
      response.setHeader('Content-Type', 'text/html; charset=ASCII')
      response.end(html`
${banner()}
${preamble(data.title + ', ' + spell(data.edition))}
${nav()}
<main>
  <h1>${escape(data.title)}</h1>
  <p class=edition>${escape(spell(data.edition))}</p>
  <p>
    <a href="/send/${request.params.title}/${request.params.edition}">
      Sign &amp; Send this Form Online
    </a>
  </p>
  <p>
    <a href="/docx/${request.params.title}/${request.params.edition}">
      Download a .docx Copy
    </a>
  </p>
  <p>
    <a href="${escape(data.repository)}" target=_blank>
      View Development Files
    </a>
  </p>
  ${formattingNote()}
  <article class=commonform>
  ${commonformHTML(data.commonform, [], {
    html5: true,
    lists: true
  }).replace(/[•]/g, '__________')}
  </article>
</main>
${footer()}`)
    }
  )
}
