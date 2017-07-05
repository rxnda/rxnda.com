var fs = require('fs')
var parse = require('json-parse-errback')
var path = require('path')
var runParallelLimit = require('run-parallel-limit')
var runSeries = require('run-series')

module.exports = function (configuration, callback) {
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
            fs.readFile(file, function (error, json) {
              if (error) {
                fileLog.error(error)
                done()
              } else {
                parse(json, function (error, parsed) {
                  if (error) {
                    fileLog.error(error)
                    done()
                  } else {
                    var now = new Date()
                    var expiration = new Date(parsed.timestamp)
                    expiration.setDate(
                      expiration.getDate() + // creation
                      7 + // one week
                      1 // extra day
                    )
                    if (now.getTime() > expiration.getTime()) {
                      fileLog.info({expired: expiration}, 'expired')
                      runSeries(
                        [
                          path.join('signs', parsed.sign),
                          path.join('charge', parsed.sign),
                          path.join('cancel', parsed.cancel)
                        ].map(function (suffix) {
                          return function (done) {
                            fs.unlink(
                              path.join(directory, suffix),
                              function (error) {
                                log.error(error)
                                done()
                              }
                            )
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
