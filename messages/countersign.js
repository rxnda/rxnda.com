var customerServiceCode = require('../util/customer-service-code')
var actionEMail = require('./action-email')

module.exports = function (data) {
  var sender = data.signatures.sender
  var senderName = sender.company || sender.name
  var recipient = data.signatures.recipient
  return {
    to: recipient.email,
    subject: 'NDA from ' + senderName,
    html: actionEMail(
      'NDA from ' + senderName,
      'Countersign an NDA from ' + senderName + ' online.',
      [
        `${senderName} offers to sign a agreement with ` +
        `${(recipient.company ? recipient.company : 'you')} ` +
        `using ${process.env.DOMAIN}, a simple online service for ` +
        `nondisclosure agreements.`
      ],
      `https://${process.env.DOMAIN}/countersign/${data.sign}`,
      'Review Offer Online',
      [
        'Keep this link safe and secure. ' +
        'It is your digital key to review and sign the NDA.',
        'Customer service may ask you to share this  ' +
        'verification code if you request assistance:',
        customerServiceCode(data.sign, recipient.email)
      ]
    )
  }
}
