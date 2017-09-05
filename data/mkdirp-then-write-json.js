var fs = require('fs')
var path = require('path')
var mkdirp = require('mkdirp')
var runSeries = require('run-series')

module.exports = function (filePath, data, callback) {
  runSeries([
    function (done) {
      mkdirp(path.dirname(filePath), done)
    },
    function (done) {
      fs.writeFile(filePath, JSON.stringify(data), done)
    }
  ], callback)
}
