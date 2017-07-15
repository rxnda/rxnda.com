var escape = require('escape-html')
var pump = require('pump')
var readTemplate = require('./read-template')
var trumpet = require('trumpet')

module.exports = function forms (configuration, request, response) {
  var body = trumpet()
  response.setHeader('Content-Type', 'text/html; charset=ASCII')
  pump(body, response)
  pump(readTemplate('wizard.html'), body)
  body
    .select('#forms')
    .createWriteStream()
    .end(wizard(configuration))
}

function wizard (configuration) {
  return questions(configuration) + result(configuration)
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
                `<select name='${question.name}'>` +
                '<option value=null>(select one)</option>' +
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

function result (configuration) {
  return `<section id=result></section>`
}
