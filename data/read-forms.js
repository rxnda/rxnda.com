var ecb = require('ecb')
var fs = require('fs')
var glob = require('glob')
var hash = require('commonform-hash')
var parse = require('json-parse-errback')
var path = require('path')
var runParallel = require('run-parallel')
var validate = require('./validate')

module.exports = function (configuration, callback) {
  var pattern = path.join(configuration.directory, 'forms', '*.json')
  var result = {}
  glob(pattern, ecb(callback, function (files) {
    runParallel(
      files.map(function (file) {
        return function (done) {
          fs.readFile(file, ecb(done, function (buffer) {
            parse(buffer, ecb(done, function (json) {
              if (!validate(json)) {
                done(new Error('Invalid record in ' + file))
              } else {
                var title = json.title
                if (!result.hasOwnProperty(title)) {
                  result[title] = []
                }
                json.hash = hash(json.form)
                result[title].push(json)
                done()
              }
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
