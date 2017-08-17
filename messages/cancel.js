var customerServiceCode = require('../util/customer-service-code')
var htmlEMail = require('./action-email')
var spell = require('reviewers-edition-spell')

module.exports = function (configuration, data) {
  var sender = data.signatures.sender
  var recipient = data.signatures.recipient
  var form = data.form
  var domain = configuration.domain
  var recipientName = (
    recipient.company || recipient.name || recipient.email
  )
  return {
    to: sender.email,
    subject: 'Your ' + domain + ' Cancellation Link',
    html: htmlEMail(
      'Your ' + domain + ' Cancellation Link',
      'Cancel Offer ' + recipientName + ' Online',
      [
        `You offered to sign a nondisclosure agreement ` +
        `${sender.company ? ('on behalf of' + sender.company) : ''} ` +
        `with ${recipientName} on the terms of ${domain}'s  ` +
        `${form.title} form agreement, ${spell(form.edition)}.`
      ],
      `https://${domain}/cancel/${data.cancel}`,
      'Cancel Your Offer',
      [
        'Keep this link safe and secure. ' +
        'It is is your digital key to cancel the offer.',
        'Customer service may ask you to share this ' +
        'verification code if you request assistance:',
        customerServiceCode(configuration, data.cancel, sender.email)
      ]
    )
  }
}
