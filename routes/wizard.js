var encodeTitle = require('../util/encode-title')
var escape = require('../util/escape')
var internalError = require('./internal-error')
var readEditions = require('../data/read-editions')
var readWizard = require('../data/read-wizard')
var revedCompare = require('reviewers-edition-compare')

var banner = require('../partials/banner')
var footer = require('../partials/footer')
var formsOverview = require('../partials/forms-overview')
var html = require('./html')
var nav = require('../partials/nav')
var preamble = require('../partials/preamble')

module.exports = function forms (configuration, request, response) {
  readWizard(configuration, function (error, wizard) {
    /* istanbul ignore if */
    if (error) {
      internalError(configuration, request, response, error)
    } else {
      var queryKeys = Object.keys(request.query)
      if (queryKeys.length === 0) {
        showForm(configuration, request, response, wizard)
      } else {
        redirect(configuration, request, response, wizard)
      }
    }
  })
}

function showForm (configuration, request, response, wizard) {
  response.setHeader('Content-Type', 'text/html; charset=ASCII')
  response.end(html`
${preamble('Send')}
${banner()}
${nav()}
<main>
  <h2>Send an RxNDA Form</h2>
  <section id=about>
    <p>
      RxNDA publishes <a href=/forms
        >several nondisclosure agreements</a>
      for different needs and situations.
      Use this short form to find a form to fit your needs.
    </p>
  </section>
  ${formsOverview()}
  <section>
    <h3>Find Your Form</h3>
    <form id=wizard action=/send method=GET>
      ${wizard.questions.map(function (question) {
        return html`
          <p>
          ${question.content.map(function (element) {
            return typeof element === 'string'
              ? escape(element)
              : html`
                <select name='${escape(question.name)}' required>
                  <option value=""></option>
                  ${element.select.map(function (data) {
                    return html`
                      <option value='${escape(data.value)}'
                        >${escape(data.text)}</option>`
                  })}
                </select>`
          })}
          </p>`
      })}
      <input type=submit value="Find My Form">
    </form>
  </section>
</main>
${footer()}
</body>
</html>`)
}

function redirect (configuration, request, response, wizard) {
  var query = request.query
  var valid = wizard
    .questions
    .every(function (question) {
      return (
        // The query has an answer to the question.
        query[question.name] &&
        // The query value is a valid value.
        question.content
          .find(function (element) {
            return element.select
          })
          .select
          .some(function (option) {
            return option.value === query[question.name]
          })
      )
    })
  if (!valid) {
    response.statusCode = 400
    response.end()
  } else {
    var mapping = wizard.mapping
    var title = Object.keys(mapping).find(function (key) {
      var comparing = mapping[key]
      return Object.keys(comparing).every(function (key) {
        return comparing[key] === query[key]
      })
    })
    if (!title) {
      response.statusCode = 400
      response.end()
    } else {
      readEditions(
        configuration, title,
        function (error, editions) {
          /* istanbul ignore if */
          if (error) {
            internalError(configuration, request, response, error)
          } else if (editions === false) {
            internalError(configuration, request, response, error)
          } else {
            var latest = editions
              .sort(revedCompare)
              .reverse()[0]
            response.statusCode = 303
            response.setHeader(
              'Location',
              '/send' +
              '/' + encodeTitle(title) +
              '/' + latest
            )
            response.end()
          }
        }
      )
    }
  }
}
