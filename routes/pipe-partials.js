var readTemplate = require('./read-template')
var pump = require('pump')

var partials = {
  'nav[role=navigation]': 'nav.html',
  'footer[role=contentinfo]': 'footer.html'
}

module.exports = function (body) {
  Object.keys(partials).forEach(function (selector) {
    pump(
      readTemplate(partials[selector]),
      body.select(selector).createWriteStream()
    )
  })
}
