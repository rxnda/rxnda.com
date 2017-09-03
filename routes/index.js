var fs = require('fs')
var path = require('path')
var pump = require('pump')
var etagged = require('./etagged')
var replacestream = require('replacestream')
var send = require('send')

var routes = module.exports = require('http-hash')()

routes.set('/', require('./homepage'))
routes.set('/key', require('./key'))
routes.set('/questions', require('./questions'))
routes.set('/future', require('./future'))
routes.set('/help', require('./help'))
routes.set('/lists', require('./lists'))
routes.set('/send', require('./wizard'))
routes.set('/pricing', require('./pricing'))
routes.set('/terms', require('./terms'))
routes.set('/verify', require('./verify'))
routes.set('/register', require('./register'))
routes.set('/attorney/:capability', require('./attorney'))
routes.set('/prescribe/:title/:edition', require('./prescribe'))
routes.set('/send/:title/:edition', require('./send'))
routes.set('/fill/:capability', require('./fill'))
routes.set('/countersign/:capability', require('./countersign'))
routes.set('/view/:capability', require('./view'))
routes.set('/cancel/:capability', require('./cancel'))
routes.set('/revoke/:capability', require('./revoke'))

routes.set('/forms', require('./forms'))
routes.set('/forms/:title', require('./forms'))
routes.set('/forms/:title/:edition', require('./forms'))
routes.set('/docx/:title/:edition', require('./docx'))

routes.set('/send.js', function (configuration, request, response) {
  response.setHeader('Content-Type', 'application/javascript')
  var filePath = path.join(__dirname, '..', 'static', 'send.js')
  pump(
    fs.createReadStream(filePath),
    replacestream(
      'STRIPE_PUBLIC_KEY',
      JSON.stringify(configuration.stripe.public)
    ),
    response
  )
})

staticFile('countersign.js')
staticFile('cancel.js')
staticFile('normalize.css')
staticFile('styles.css')
routes.set('/robots.txt', etagged(
  'text/plain',
  [
    'User-Agent: *',
    'Disallow: /cancel/',
    'Disallow: /countersign/',
    'Disallow: /view/'
  ].join('\n')
))

function staticFile (file) {
  var filePath = path.join(__dirname, '..', 'static', file)
  routes.set('/' + file, function (configuration, request, response) {
    pump(send(request, filePath), response)
  })
}
