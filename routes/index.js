var path = require('path')
var pump = require('pump')
var send = require('send')

var routes = module.exports = require('http-hash')()

staticTemplate('/', 'homepage.html')
staticTemplate('/lawyers', 'lawyers.html')
staticTemplate('/businessfolk', 'businessfolk.html')

routes.set('/forms', require('./forms'))
routes.set('/prices', require('./prices'))
routes.set('/send/:title/:edition', require('./send'))

staticFile('normalize.css')
staticFile('styles.css')

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
