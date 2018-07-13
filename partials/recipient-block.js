var html = require('../routes/html')
var errorsFor = require('../util/errors-for')

var asterisk = require('./asterisk')
var input = require('./input')

module.exports = function (page, postData, sendData) {
  if (sendData) return rest(page, postData)
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

  function rest (signature) {
    if (Array.isArray(signature.entities)) {
      // Entity Signatory
      return (
        inputWithPrior(
          'signatures-recipient-company', 'Their Company Name',
          [
            'If you leave this blank, the recipient can fill it out.',
            'Enter the legal name of the other side’s company.',
            'For example: “TheirCo, LLC”'
          ],
          sendData && sendData.company
        ) +
        inputWithPrior(
          'signatures-recipient-form', 'Their Company’s Legal Form',
          [
            'If you leave this blank, the recipient can fill it out.',
            'Enter the legal form of their company.',
            'For example: “limited liability company”'
          ],
          sendData && sendData.form
        ) +
        inputWithPrior(
          'signatures-recipient-jurisdiction',
          'Their Company’s Legal Jurisdiction',
          [
            'If you leave this blank, the recipient can fill it out.',
            'Enter the legal jurisdiction under whose laws their ' +
            'company is formed.',
            'For example: “Delaware”'
          ],
          sendData && sendData.jurisdiction
        ) +
        inputWithPrior(
        'signatures-recipient-name', 'Their Name',
          [
            'If you leave this blank, the recipient can fill it out.',
            'Name who will sign for the other side.'
          ],
          sendData && sendData.name
        ) +
        inputWithPrior(
          'signatures-recipient-title', 'Their Title',
          [
            'If you leave this blank, the recipient can fill it out.',
            'Enter their title at the company.',
            'For example: “Chief Executive Officer”'
          ],
          sendData && sendData.title
        )
      )
    }
    // Individual Signatory
    return (
      inputWithPrior(
        'signatures-recipient-name', 'Their Name',
        [
          'If you leave this blank, the recipient can fill it out.',
          'Enter the other side’s full legal name.',
          'For example: “Jane Doe”'
        ],
        sendData && sendData.name
     )
    )
  }

  function inputWithPrior (name, label, notes, sendValue) {
    if (sendValue) {
      return input({
        name: name,
        required: false,
        label: label,
        notes: notes,
        prior: {
          value: sendValue,
          readonly: true,
          prefilled: true
        }
      })
    } else {
      var prior
      var suffix = name.split('-').reverse()[0]
      if (postData && postData[suffix]) {
        prior = {value: postData[suffix]}
      }
      return input({
        name: name,
        required: false,
        label: label,
        notes: notes,
        prior: prior,
        errors: errorsFor(name, postData)
      })
    }
  }
}
