var concat = require('./concat')
var http = require('http')
var server = require('./server')
var tape = require('tape')

tape.test('GET /send/Testing/1e1d', function (test) {
  server(function (port, closeServer) {
    http.request({
      port: port,
      path: '/send/Testing/1e1d'
    })
      .once('response', function (response) {
        test.equal(
          response.statusCode, 200,
          'responds 200'
        )
        concat(response, function (error, body) {
          test.ifError(error)
          test.assert(
            body.includes('This is a draft form'),
            'shows draft warning'
          )
          test.end()
          closeServer()
        })
      })
      .end()
  })
})

tape.test('GET /send/Testing/1e', function (test) {
  server(function (port, closeServer) {
    http.request({
      port: port,
      path: '/send/Testing/1e'
    })
      .once('response', function (response) {
        test.equal(
          response.statusCode, 200,
          'responds 200'
        )
        concat(response, function (error, body) {
          test.ifError(error)
          test.assert(
            !body.includes('This is a draft form'),
            'does not show draft warning'
          )
          test.end()
          closeServer()
        })
      })
      .end()
  })
})
