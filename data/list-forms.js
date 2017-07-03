var ecb = require('ecb')
var fs = require('fs')
var glob = require('glob')
var parse = require('json-parse-errback')
var path = require('path')
var runParallel = require('run-parallel')

module.exports = function (configuration, callback) {
  var pattern = path.join(configuration.directory, 'forms', '*.json')
  var result = {}
  glob(pattern, ecb(callback, function (files) {
    runParallel(
      files.map(function (file) {
        return function (done) {
          fs.readFile(file, ecb(done, function (buffer) {
            parse(buffer, ecb(done, function (json) {
              var title = json.title
              if (!result.hasOwnProperty(title)) {
                result[title] = []
              }
              result[title].push({
                file: file,
                edition: json.edition,
                released: json.released,
                description: json.description
              })
              done()
            }))
          }))
        }
      }),
      ecb(callback, function () {
        callback(null, result)
      })
    )
  }))
}
