var cancelPath = require('../data/cancel-path')
var chargePath = require('../data/charge-path')
var expired = require('../data/expired')
var fs = require('fs')
var path = require('path')
var readJSONFile = require('../data/read-json-file')
var runParallelLimit = require('run-parallel-limit')
var runSeries = require('run-series')
var signPath = require('../data/sign-path')

var CONCURRENCY = 3

module.exports = function sweep (serverLog, callback) {
  var signs = path.join(process.env.DIRECTORY, 'sign')
  var log = serverLog.child({subsystem: 'filesweeper'})
  log.info('running')
  fs.readdir(signs, function (error, files) {
    /* istanbul ignore if */
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
              /* istanbul ignore if */
              if (error) {
                fileLog.error(error)
                done()
              } else {
                if (expired(parsed)) {
                  fileLog.info('expired')
                  runSeries(
                    [
                      signPath(parsed.sign),
                      chargePath(parsed.sign),
                      cancelPath(parsed.cancel)
                    ].map(function (file) {
                      return function (done) {
                        fs.unlink(file, function (error) {
                          /* istanbul ignore if */
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
        CONCURRENCY,
        function () {
          callback()
        }
      )
    }
  })
}
