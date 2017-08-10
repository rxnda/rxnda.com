var messageEMail = require('./message-email')

module.exports = function (configuration, data) {
  var sender = data.signatures.sender
  var recipient = data.signatures.recipient
  var recipientName = (
    recipient.company || recipient.name || recipient.email
  )
  var domain = configuration.domain
  return {
    to: sender.email + ',' + recipient.email,
    subject: 'NDA Offer Cancelled',
    html: messageEMail(
      'NDA Offer Cancelled',
      [
        `The offer to enter an NDA between ` +
        `${sender.company || sender.name} and ` +
        `${recipientName} has been cancelled.`,
        `${recipientName} may no longer countersign.`,
        `${domain} will not charge either side.`
      ]
    )
  }
}
