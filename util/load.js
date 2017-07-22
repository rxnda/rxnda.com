var ecb = require('ecb')
var runParallel = require('run-parallel')

module.exports = function load (object, callback) {
  var loaded = {}
  runParallel(
    Object.keys(object).map(function (key) {
      return function task (done) {
        object[key](ecb(done, function (result) {
          loaded[key] = result
          done()
        }))
      }
    }),
    ecb(callback, function () {
      callback(null, loaded)
    })
  )
}
