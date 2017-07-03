var trumpet = require('trumpet')
var readTemplate = require('./read-template')
var pump = require('pump')

module.exports = function (configuration, request, response) {
  var body = trumpet()
  response.setHeader('Content-Type', 'text/html; charset=ASCII')
  pump(readTemplate('prices.html'), body)
  body.select('span#use-price')
    .createWriteStream()
    .end('$' + configuration.prices.use)
  body.select('span#prescription-price')
    .createWriteStream()
    .end('$' + configuration.prices.prescription)
  pump(body, response)
}
