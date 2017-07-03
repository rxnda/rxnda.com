var fs = require('fs')
var path = require('path')
var pump = require('pump')

module.exports = function (
  configuration, request, response, file, contentType
) {
  pump(
    fs.createReadStream(path.join(__dirname, '..', 'static', file)),
    response,
    function (error) {
      if (error) {
        response.statusCode = 500
        response.end()
      }
    }
  )
}
