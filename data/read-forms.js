var ecb = require('ecb')
var glob = require('glob')
var hash = require('commonform-hash')
var path = require('path')
var readJSONFile = require('./read-json-file')
var runParallel = require('run-parallel')
var validate = require('./validate')

module.exports = function (configuration, callback) {
  var pattern = path.join(configuration.directory, 'forms', '*.json')
  var result = {}
  glob(pattern, ecb(callback, function (files) {
    runParallel(
      files.map(function (file) {
        return function (done) {
          readJSONFile(file, ecb(done, function (json) {
            if (!validate(json)) {
              done(new Error('Invalid record in ' + file))
            } else {
              var title = json.title
              if (!result.hasOwnProperty(title)) {
                result[title] = []
              }
              json.hash = hash(json.commonform)
              result[title].push(json)
              done()
            }
          }))
        }
      }),
      ecb(callback, function () {
        callback(null, result)
      })
    )
  }))
}
