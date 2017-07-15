module.exports = function notFound (
  configuration, request, response
) {
  response.statusCode = 404
  response.end()
}
