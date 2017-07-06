var http = require('http')
var server = require('./server')
var tape = require('tape')

tape.test('GET /nonexistent', function (test) {
  server(function (port, closeServer) {
    http.request({
      port: port,
      path: '/nonexistent'
    })
      .once('response', function (response) {
        var status = 404
        test.equal(
          response.statusCode, status,
          'responds ' + status
        )
        test.end()
        closeServer()
      })
      .end()
  })
})
