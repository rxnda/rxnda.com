var concat = require('./concat')
var http = require('http')
var server = require('./server')
var tape = require('tape')

tape.test('GET /terms', function (test) {
  server(function (port, closeServer) {
    http.request({
      port: port,
      path: '/terms'
    })
      .once('response', function (response) {
        test.equal(
          response.statusCode, 200,
          'responds 200'
        )
        var contentType = 'text/html; charset=ASCII'
        test.equal(
          response.headers['content-type'], contentType,
          contentType
        )
        concat(response, function (error, body) {
          test.ifError(error, 'no error')
          test.assert(
            body.includes('Terms of Service'),
            'includes "Terms of Service"'
          )
          test.assert(
            body.includes('Privacy Policy'),
            'includes "Privacy Policy"'
          )
          test.end()
          closeServer()
        })
      })
      .end()
  })
})
