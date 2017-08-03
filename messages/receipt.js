var formatEmail = require('../util/format-email')
var sameArray = require('../data/same-array')

module.exports = function (configuration, data) {
  var sender = data.signatures.sender
  var recipient = data.signatures.recipient
  var form = data.form
  var domain = configuration.domain
  return {
    to: sender.email,
    subject: 'Your ' + domain + ' Receipt',
    text: formatEmail(configuration, `
Thank you for sending an NDA with ${domain}.

Form: ${form.title}

Edition: ${form.edition}

${senderInfo(sender)}

${recipientInfo(recipient)}

${directions(data)}

${domain} will authorize a payment of
${data.price} United States Dollars now, but your
card will not be charged unless and until the
other side countersigns.
`.trim().replace(/ \n/g, ' '))
  }
}

function senderInfo (sender) {
  if (sender.company) {
    return `
From:

  Company: ${sender.company}, a ${sender.jurisdiction} ${sender.form}

  Signing: ${sender.name} <${sender.email}>, ${sender.title}

  Date: ${sender.date}
`.trim()
  } else {
    return `From: ${sender.name} <${sender.email}>`
  }
}

function recipientInfo (recipient) {
  if (recipient.company) {
    var returned = `To:\n\n  Company: ${recipient.company}`
    ;['Jurisdiction', 'Form', 'Title'].forEach(function (field) {
      var key = field.toLowerCase()
      if (recipient[key]) {
        returned += `\n\n  ${field}: ${recipient[key]}`
      }
    })
    returned += `\n\n  Signing: ${recipient.name || ''}`
    returned += `<${recipient.email}>`
    return returned
  } else {
    return `To: ${recipient.name || ''} <${recipient.email}>`
  }
}

function directions (data) {
  return data.form.directions
    .map(function (direction) {
      return (
        direction.label + ': ' +
        data.directions
          .find(function (element) {
            return sameArray(element.blank, direction.blank)
          })
          .value
      )
    })
    .join('\n\n')
}
