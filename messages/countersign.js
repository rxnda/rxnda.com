var customerServiceCode = require('../util/customer-service-code')
var htmlEMail = require('./action-email')

module.exports = function (configuration, data) {
  var sender = data.signatures.sender
  var senderName = sender.company || sender.name
  var recipient = data.signatures.recipient
  var domain = configuration.domain
  return {
    to: recipient.email,
    subject: 'NDA from ' + senderName,
    html: htmlEMail(
      'NDA from ' + senderName,
      'Countersign an NDA from ' + senderName + ' online.',
      [
        `${senderName} offers to sign a agreement with ` +
        `${(recipient.company ? recipient.company : 'you')} ` +
        `using ${domain}, a simple online service for ` +
        `nondisclosure agreements.`
      ],
      `https://${domain}/countersign/${data.sign}`,
      'Review the Offer Online',
      [
        'Keep this link safe and secure. ' +
        'It is your digital key to review and sign the NDA.',
        'Customer service may ask you to share this  ' +
        'verification code if you request assistance:',
        customerServiceCode(configuration, data.sign, recipient.email)
      ]
    )
  }
}
