var fs = require('fs')
var handler = require('../')
var http = require('http')
var os = require('os')
var path = require('path')

module.exports = function (test) {
  var prefix = path.join(os.tmpdir(), 'rxnda')
  fs.mkdtemp(prefix, function (error, directory) {
    if (error) {
      throw error
    }
    var configuration = {
      directory: directory
    }
    http.createServer()
      .on('request', function (request, response) {
        handler(configuration, request, response)
      })
      .listen(0, function onceListening () {
        var server = this
        var port = server.address().port
        test(port, function closeServer () {
          server.close()
        })
      })
  })
}
