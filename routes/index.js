var elide = require('../data/elide')
var fs = require('fs')
var hash = require('commonform-hash')
var path = require('path')
var pump = require('pump')
var replacestream = require('replacestream')
var send = require('send')

var routes = module.exports = require('http-hash')()

staticTemplate('/', 'homepage.html')
staticTemplate('/lawyers', 'lawyers.html')
staticTemplate('/businessfolk', 'businessfolk.html')
staticTemplate('/plans', 'plans.html')

routes.set('/send', require('./wizard'))
routes.set('/prices', require('./prices'))
routes.set('/send/:title/:edition', require('./send'))
routes.set('/countersign/:capability', require('./countersign'))
routes.set('/view/:capability', require('./view'))
routes.set('/cancel/:capability', require('./cancel'))

routes.set('/wizard-data.js', function (configuration, request, response) {
  response.setHeader('Content-Type', 'application/javascript')
  response.end(
    'window.wizard = ' + JSON.stringify(configuration.wizard)
  )
})

routes.set('/form-data.js', function (configuration, request, response) {
  response.setHeader('Content-Type', 'application/javascript')
  response.end(
    'window.forms = ' + JSON.stringify(
      Object.keys(configuration.forms).reduce(function (forms, key) {
        forms[key] = configuration.forms[key].map(function (element) {
          var elided = elide(element, 'commonform', 'directions', 'signatures')
          elided.hash = hash(element.commonform)
          return elided
        })
        return forms
      }, {}),
      null, 2
    )
  )
})

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

staticFile('wizard.js')
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
