var serveFile = require('./serve-file')
var path = require('path')
var send = require('send')

var routes = module.exports = require('http-hash')()

routes.set('/', require('./homepage'))

staticFile('normalize.css')
staticFile('styles.css')

function staticFile (file) {
  var filePath = path.join(__dirname, '..', 'static', file)
  routes.set('/' + file, function (configuration, request, response) {
    send(request, filePath).pipe(response)
  })
}
