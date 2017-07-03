var internalError = require('./internal-error')
var readTemplate = require('./read-template')

module.exports = function (configuration, request, response) {
  readTemplate('index.html', function (error, html) {
    /* istanbul ignore if */
    if (error) {
      internalError.apply(this, arguments)
    } else {
      response.setHeader('Content-Type', 'text/html; charset=UTF-8')
      response.end(html)
    }
  })
}
