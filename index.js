var uuid = require('uuid')

module.exports = function (configuration, request, response) {
  // Logging
  var log = configuration.log
  response.log = log.child({request: uuid.v4()})
  response.log.info(request)
  response.once('finish', function () {
    response.log.info(response)
  })

  response.end()
}
