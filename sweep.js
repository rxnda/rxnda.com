var cancelPath = require('./data/cancel-path')
var chargePath = require('./data/charge-path')
var expired = require('./data/expired')
var fs = require('fs')
var path = require('path')
var readJSONFile = require('./data/read-json-file')
var runParallelLimit = require('run-parallel-limit')
var runSeries = require('run-series')
var signPath = require('./data/sign-path')

module.exports = function sweep (configuration, callback) {
  var directory = configuration.directory
  var signs = path.join(directory, 'sign')
  var log = configuration.log.child({subsystem: 'filesweeper'})
  log.info('running')
  fs.readdir(signs, function (error, files) {
    if (error) {
      log.error(error)
      callback()
    } else {
      log.info(files.length.toString() + ' files')
      runParallelLimit(
        files.map(function (file) {
          file = path.join(signs, file)
          return function (done) {
            var fileLog = log.child({file: file})
            fileLog.info('reading')
            readJSONFile(file, function (error, parsed) {
              if (error) {
                fileLog.error(error)
                done()
              } else {
                if (expired(parsed)) {
                  fileLog.info('expired')
                  runSeries(
                    [
                      signPath(configuration, parsed.sign),
                      chargePath(configuration, parsed.sign),
                      cancelPath(configuration, parsed.cancel)
                    ].map(function (file) {
                      return function (done) {
                        fs.unlink(file, function (error) {
                          if (error) {
                            log.error(error)
                          }
                          done()
                        })
                      }
                    }),
                    done
                  )
                } else {
                  fileLog.info('OK')
                  done()
                }
              }
            })
          }
        }),
        3,
        function () {
          log.info('done')
          callback()
        }
      )
    }
  })
}
