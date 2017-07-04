/* istanbul ignore next */
module.exports = function (configuration, request, response, error) {
  request.log.error(error)
  response.statusCode = 500
  response.end()
}
