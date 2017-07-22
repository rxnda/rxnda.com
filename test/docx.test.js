var http = require('http')
var server = require('./server')
var tape = require('tape')
var docxContentType = require('docx-content-type')

tape.test('GET /docx/{title}/{edition}', function (test) {
  server(function (port, closeServer) {
    http.request({
      port: port,
      path: '/docx/Testing/1e1d'
    })
      .once('response', function (response) {
        test.equal(
          response.statusCode, 200,
          'responds 200'
        )
        test.equal(
          response.headers['content-type'], docxContentType,
          docxContentType
        )
        test.end()
        closeServer()
      })
      .end()
  })
})

tape.test('GET /docx/{title}/{nonexistent}', function (test) {
  server(function (port, closeServer) {
    http.request({
      port: port,
      path: '/docx/Testing/1000e'
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

tape.test('GET /docx/{title}/{malformed}', function (test) {
  server(function (port, closeServer) {
    http.request({
      port: port,
      path: '/docx/Testing/Happy'
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

tape.test('GET /docx/{nonexistent}', function (test) {
  server(function (port, closeServer) {
    http.request({
      port: port,
      path: '/docx/Nonexistent'
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
