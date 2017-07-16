var trumpet = require('trumpet')
var readTemplate = require('./read-template')
var pump = require('pump')

module.exports = function pricing (configuration, request, response) {
  response.setHeader('Content-Type', 'text/html; charset=ASCII')
  var body = trumpet()
  pump(readTemplate('pricing.html'), body)
  body.selectAll('span.use-price', function (span) {
    span
      .createWriteStream()
      .end('$' + configuration.prices.use)
  })
  pump(body, response)
}
