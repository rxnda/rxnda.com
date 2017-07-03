var devNull = require('dev-null')
var fs = require('fs')
var handler = require('../')
var hash = require('commonform-hash')
var http = require('http')
var os = require('os')
var path = require('path')
var pino = require('pino')
var rimraf = require('rimraf')

module.exports = function (test) {
  var prefix = path.join(os.tmpdir(), 'rxnda')
  fs.mkdtemp(prefix, function (error, directory) {
    if (error) {
      throw error
    }
    var form = {
      content: [
        'This is not a very good NDA between ',
        {blank: ''}, ' and ', {blank: ''}, '.'
      ]
    }
    var configuration = {
      directory: directory,
      log: pino({}, devNull()),
      prices: {
        sending: 10,
        prescribing: 5
      },
      forms: {
        'Example NDA': [
          require('../example-directory/forms/example.json')
        ]
      }
    }
    http.createServer()
      .on('request', function (request, response) {
        handler(configuration, request, response)
      })
      .listen(0, function onceListening () {
        var server = this
        var port = server.address().port
        test(port, function closeServer () {
          server.close(function () {
            rimraf(directory, function () {
              // pass
            })
          })
        })
      })
  })
}
