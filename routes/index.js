var fs = require('fs')
var path = require('path')
var pump = require('pump')
var replacestream = require('replacestream')
var send = require('send')

var routes = module.exports = require('http-hash')()

staticTemplate('/', 'homepage.html')
staticTemplate('/lawyers', 'lawyers.html')
staticTemplate('/businessfolk', 'businessfolk.html')
staticTemplate('/plans', 'plans.html')

routes.set('/forms', require('./forms'))
routes.set('/prices', require('./prices'))
routes.set('/send/:title/:edition', require('./send'))
routes.set('/countersign/:capability', require('./countersign'))
routes.set('/view/:capability', require('./view'))
routes.set('/cancel/:capability', require('./cancel'))

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

function staticTemplate (pathname, file) {
  var filePath = path.join(__dirname, '..', 'templates', file)
  routes.set(pathname, function (configuration, request, response) {
    pump(send(request, filePath), response)
  })
}

function staticFile (file) {
  var filePath = path.join(__dirname, '..', 'static', file)
  routes.set('/' + file, function (configuration, request, response) {
    pump(send(request, filePath), response)
  })
}
