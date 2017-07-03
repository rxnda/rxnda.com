/* istanbul ignore next */
module.exports = function (configuration, request, response) {
  request.log.error(error)
  response.statusCode = 500
  response.end()
}
