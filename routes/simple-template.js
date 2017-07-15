var pipePartials = require('./pipe-partials')
var pump = require('pump')
var readTemplate = require('./read-template')
var trumpet = require('trumpet')

module.exports = function simpleTemplate (file) {
  return function (configuration, request, response) {
    response.setHeader('Content-Type', 'text/html; charset=UTF-8')
    var body = trumpet()
    pipePartials(body)
    pump(readTemplate(file), body)
    pump(body, response)
  }
}
