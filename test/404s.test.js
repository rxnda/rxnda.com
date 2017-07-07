var concat = require('./concat')
var http = require('http')
var server = require('./server')
var tape = require('tape')

var IMPROBABLE_CAPABILITY = 'a'.repeat(64)

tape.test('GET /${nonexistent}', function (test) {
  server(function (port, closeServer) {
    http.request({
      port: port,
      path: '/nonexistent'
    })
      .once('response', function (response) {
        test.equal(
          response.statusCode, 404,
          'responds 404'
        )
        test.end()
        closeServer()
      })
      .end()
  })
})

tape.test('GET /view/${invalid}', function (test) {
  server(function (port, closeServer) {
    http.request({
      port: port,
      path: '/view/' + IMPROBABLE_CAPABILITY
    })
      .once('response', function (response) {
        test.equal(
          response.statusCode, 404,
          'responds 404'
        )
        test.end()
        closeServer()
      })
      .end()
  })
})

tape.test('GET /cancel/${invalid}', function (test) {
  server(function (port, closeServer) {
    http.request({
      port: port,
      path: '/cancel/' + IMPROBABLE_CAPABILITY
    })
      .once('response', function (response) {
        test.equal(
          response.statusCode, 404,
          'responds 404'
        )
        test.end()
        closeServer()
      })
      .end()
  })
})

tape.test('GET /countersign/${invalid}', function (test) {
  server(function (port, closeServer) {
    http.request({
      port: port,
      path: '/countersign/' + IMPROBABLE_CAPABILITY
    })
      .once('response', function (response) {
        test.equal(
          response.statusCode, 404,
          'responds 404'
        )
        test.end()
        closeServer()
      })
      .end()
  })
})

tape.test('GET /send/${just-title}', function (test) {
  server(function (port, closeServer) {
    http.request({
      port: port,
      path: '/send/Simple'
    })
      .once('response', function (response) {
        test.equal(
          response.statusCode, 404,
          'responds 404'
        )
        test.end()
        closeServer()
      })
      .end()
  })
})

tape.test('GET /send/${nonexistent}/${nonexistent}', function (test) {
  server(function (port, closeServer) {
    http.request({
      port: port,
      path: '/send/Nonexistent/1e'
    })
      .once('response', function (response) {
        test.equal(
          response.statusCode, 404,
          'responds 404'
        )
        test.end()
        closeServer()
      })
      .end()
  })
})
