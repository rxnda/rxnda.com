var encodeTitle = require('../util/encode-title')
var escape = require('../util/escape')
var internalError = require('./internal-error')
var pump = require('pump')
var readEditions = require('../data/read-editions')
var readTemplate = require('./read-template')
var readWizard = require('../data/read-wizard')
var revedCompare = require('reviewers-edition-compare')
var trumpet = require('trumpet')

module.exports = function forms (configuration, request, response) {
  readWizard(configuration, function (error, wizard) {
    if (error) {
      internalError(configuration, request, response, error)
    } else {
      var query = request.query
      var queryKeys = Object.keys(query)
      if (queryKeys.length === 0) {
        var body = trumpet()
        response.setHeader('Content-Type', 'text/html; charset=ASCII')
        pump(body, response)
        pump(readTemplate('wizard.html'), body)
        body
          .select('#wizard')
          .createWriteStream()
          .end(ui(wizard))
      } else {
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
            return Object.keys(comparing).every(function (comparingKey) {
              return comparing[comparingKey] === query[comparingKey]
            })
          })
          if (!title) {
            response.statusCode = 400
            response.end()
          } else {
            readEditions(
              configuration, title,
              function (error, editions) {
                if (error) {
                  internalError(configuration, request, response, error)
                } else if (editions === false) {
                  internalError(configuration, request, response, error)
                } else {
                  var latest = editions
                    .sort(revedCompare)
                    .reverse()
                    [0]
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
    }
  })
}

function ui (wizard) {
  return (
    questions(wizard) +
    '<input type=submit value="Find My Form">'
  )
}

function questions (wizard) {
  return wizard.questions
    .map(function (question) {
      return (
        `<p>` +
        question.content
          .map(function (element) {
            if (typeof element === 'string') {
              return escape(element)
            } else if (element.select) {
              return (
                `<select name='${escape(question.name)}' required>` +
                '<option value=""></option>' +
                element.select
                  .map(option)
                  .join('\n') +
                '</select>'
              )
            }
          })
          .join('') +
        '</p>'
      )
    })
    .join('\n')
}

function option (data) {
  return `<option value='${escape(data.value)}'>${escape(data.text)}</option>`
}
