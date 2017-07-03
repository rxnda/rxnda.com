var http = require('http')
var server = require('./server')
var tap = require('tap')

tap.test('GET /', function (test) {
  server(function (port, closeServer) {
    http.request({
      port: port
    })
      .once('response', function (response) {
        test.equal(
          response.statusCode, 200,
          'responds 200'
        )
        test.end()
        closeServer()
      })
      .end()
  })
})
