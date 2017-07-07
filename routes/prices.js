var trumpet = require('trumpet')
var readTemplate = require('./read-template')
var pump = require('pump')

module.exports = function (configuration, request, response) {
  var body = trumpet()
  response.setHeader('Content-Type', 'text/html; charset=ASCII')
  pump(readTemplate('prices.html'), body)
  body.selectAll('span.use-price', function (span) {
    span
      .createWriteStream()
      .end('$' + configuration.prices.use)
  })
  pump(body, response)
}
