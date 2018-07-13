var longDate = require('../util/long-date')
var billingEMail = require('./billing-email')

module.exports = function (data) {
  var sender = data.send.signatures.sender
  return {
    to: sender.email,
    subject: 'Your ' + process.env.DOMAIN + ' Receipt',
    html: billingEMail(
      longDate(new Date()),
      data.send.price.toString() + '.00'
    )
  }
}
