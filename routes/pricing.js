var escape = require('../util/escape')
var pump = require('pump')
var readTemplate = require('./read-template')
var trumpet = require('trumpet')

module.exports = function pricing (configuration, request, response) {
  response.setHeader('Content-Type', 'text/html; charset=ASCII')
  var body = trumpet()
  pump(readTemplate('pricing.html'), body)
  body.selectAll('span.use-price', function (span) {
    span
      .createWriteStream()
      .end(escape('$' + configuration.prices.use))
  })
  pump(body, response)
}
