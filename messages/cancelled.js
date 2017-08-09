var formatEmail = require('../util/format-email')

module.exports = function (configuration, data) {
  var sender = data.signatures.sender
  var recipient = data.signatures.recipient
  return {
    to: sender.email,
    subject: 'NDA Offer Cancelled',
    text: formatEmail(configuration, `
The offer to enter an NDA between 
${sender.company || sender.name} and 
${recipient.company || recipient.name || recipient.email} 
has been cancelled.
`.trim().replace(/ \n/g, ' '))
  }
}
