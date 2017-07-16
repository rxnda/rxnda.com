var encodeTitle = require('../util/encode-title')
var escape = require('../util/escape')
var pump = require('pump')
var readTemplate = require('./read-template')
var trumpet = require('trumpet')

module.exports = function forms (configuration, request, response) {
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
      .end(wizard(configuration))
  } else {
    var valid = configuration
      .wizard
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
      var mapping = configuration.wizard.mapping
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
        response.statusCode = 303
        response.setHeader(
          'Location',
          '/send' +
          '/' + encodeTitle(title) +
          '/' + configuration.forms[title][0].edition
        )
        response.end()
      }
    }
  }
}

function wizard (configuration) {
  return (
    questions(configuration) +
    '<input type=submit value="Find My Form">'
  )
}

function questions (configuration) {
  return configuration.wizard.questions
    .map(function (question) {
      return (
        `<p>` +
        question.content
          .map(function (element) {
            if (typeof element === 'string') {
              return escape(element)
            } else if (element.select) {
              return (
                `<select name='${question.name}' required>` +
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
  return `<option value='${data.value}'>${escape(data.text)}</option>`
}
