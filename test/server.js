var devNull = require('dev-null')
var fs = require('fs')
var handler = require('../')
var http = require('http')
var mkdirp = require('mkdirp')
var os = require('os')
var path = require('path')
var pino = require('pino')
var rimraf = require('rimraf')
var runSeries = require('run-series')

module.exports = function (test) {
  var prefix = path.join(os.tmpdir(), 'rxnda')
  fs.mkdtemp(prefix, function (error, directory) {
    if (error) {
      throw error
    }
    createForms(directory, function (error) {
      if (error) {
        throw error
      }
      var configuration = {
        directory: directory,
        log: pino({}, devNull())
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
                return
              })
            })
          })
        })
    })
  })
}

function createForms (directory, callback) {
  runSeries([
    function (done) {
      mkdirp(path.join(directory, 'forms'), done)
    },
    function (done) {
      fs.writeFile(
        path.join(directory, 'forms', 'example.json'),
        JSON.stringify({
          title: 'Example NDA',
          edition: '1e1d',
          released: '2017-07-03T03:13Z',
          description: 'a pretty terrible NDA',
          form: {
            content: ['This is not a very good NDA']
          }
        }),
        done
      )
    }
  ], callback)
}
