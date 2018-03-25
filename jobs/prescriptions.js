var email = require('../email')
var expired = require('../data/expired')
var expiredMessage = require('../messages/expired')
var fs = require('fs')
var path = require('path')
var prescriptionPath = require('../data/prescription-path')
var readJSONFile = require('../data/read-json-file')
var revokePath = require('../data/revoke-path')
var runParallelLimit = require('run-parallel-limit')
var runSeries = require('run-series')

module.exports = function (configuration, callback) {
  var directory = configuration.directory
  var prescriptions = path.join(directory, 'prescription')
  var log = configuration.log.child({subsystem: 'prescription sweeper'})
  log.info('running')
  fs.readdir(prescriptions, function (error, files) {
    /* istanbul ignore if */
    if (error) {
      log.error(error)
      return callback()
    }
    log.info(files.length.toString() + ' files')
    runParallelLimit(
      files.map(function (file) {
        file = path.join(prescriptions, file)
        return function (done) {
          var fileLog = log.child({file: file})
          fileLog.info('reading')
          readJSONFile(file, function (error, parsed) {
            /* istanbul ignore if */
            if (error) {
              fileLog.error(error)
              return done()
            }
            if (expired(parsed)) {
              fileLog.info('expired')
              runSeries(
                [
                  function (done) {
                    email(
                      configuration,
                      expiredMessage(configuration, parsed),
                      done
                    )
                  }
                ].concat([
                  revokePath(configuration, parsed.revoke),
                  prescriptionPath(configuration, parsed.fill)
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
                })),
                done
              )
            } else {
              fileLog.info('OK')
              done()
            }
          })
        }
      }),
      3,
      function () {
        callback()
      }
    )
  })
}
