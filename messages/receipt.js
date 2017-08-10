var longDate = require('../util/long-date')
var billingEMail = require('./billing-email')

module.exports = function (configuration, data) {
  var sender = data.send.signatures.sender
  var domain = configuration.domain
  return {
    to: sender.email,
    subject: 'Your ' + domain + ' Receipt',
    html: billingEMail(
      longDate(new Date()),
      data.send.price.toString() + '.00'
    )
  }
}
