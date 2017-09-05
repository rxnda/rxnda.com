var html = require('../routes/html')

var asterisk = require('./asterisk')
var input = require('./input')

module.exports = function (page, postData) {
  return html`
<section class=field>
  <label>Their Email</label>
  ${asterisk()}
  <input
      name=signatures-recipient-email
      type=email
      required
      value=${
        postData
          ? escape(postData.signatures.recipient.email)
          : '""'
      }>
</section>
${rest(page)}
  `
}

function rest (signature) {
  if (Array.isArray(signature.entities)) {
    // Entity Signatory
    return (
      input(
        'signatures-recipient-company', 'Their Company Name',
        [
          'Optionally enter the legal name of the other ' +
          'side’s company.',
          'For example: “TheirCo, LLC”',
          'If you leave this blank, the recipient can fill it out.'
        ]
      ) +
      input(
        'signatures-recipient-form', 'Their Company’s Legal Form',
        [
          'Enter the legal form of their company.',
          'For example: “limited liability company”',
          'If you leave this blank, the recipient can fill it out.'
        ]
      ) +
      input(
        'signatures-recipient-jurisdiction',
        'Their Company’s Legal jurisdiction',
        [
          'Enter the legal jurisdiction under whose laws their ' +
          'company is formed.',
          'For example: “Delaware”',
          'If you leave this blank, the recipient can fill it out.'
        ]
      ) +
      input(
      'signatures-recipient-name', 'Their Name',
        [
          'Optionally name who will sign for the other side.',
          'If you leave this blank, the recipient can fill it out.'
        ]
      ) +
      input(
        'signatures-recipient-title', 'Their Title',
        [
          'Optionally enter their title at the company.',
          'For example: “Chief Executive Officer”',
          'If you leave this blank, the recipient can fill it out.'
        ]
      )
    )
  } else {
    // Individual Signatory
    return (
      input(
        'signatures-recipient-name', 'Their Name',
        [
          'Enter the other side’s full legal name.',
          'For example: “Jane Doe”',
          'If you leave this blank, the recipient can fill it out.'
        ]
     )
    )
  }
}
