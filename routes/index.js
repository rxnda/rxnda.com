var fs = require('fs')
var path = require('path')
var pump = require('pump')
var replacestream = require('replacestream')
var send = require('send')

var routes = module.exports = require('http-hash')()

routes.set('/', require('./homepage'))
routes.set('/questions', require('./questions'))
routes.set('/future', require('./future'))
routes.set('/send', require('./wizard'))
routes.set('/pricing', require('./pricing'))
routes.set('/terms', require('./terms'))
routes.set('/send/:title/:edition', require('./send'))
routes.set('/countersign/:capability', require('./countersign'))
routes.set('/view/:capability', require('./view'))
routes.set('/cancel/:capability', require('./cancel'))

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
staticFile('robots.txt')

function staticFile (file) {
  var filePath = path.join(__dirname, '..', 'static', file)
  routes.set('/' + file, function (configuration, request, response) {
    pump(send(request, filePath), response)
  })
}
