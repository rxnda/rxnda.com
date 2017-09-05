var errorsFor = require('../util/errors-for')
var html = require('../routes/html')

var asterisk = require('./asterisk')
var input = require('./input')
var paragraphs = require('./paragraphs')

module.exports = function (page, postData, priorValueOf) {
  return html`
<section class=ownSignature>
  <h4>Your Side&rsquo;s Signature</h4>
  ${senderBlock(page, postData, priorValueOf)}
  ${
    page.information
      .filter(function (name) {
        return name !== 'date'
      })
      .map(function (suffix) {
        var name = 'signatures-sender-' + suffix
        var prior = priorValueOf(suffix)
        return input(
          name,
          'Your ' + suffix[0].toUpperCase() + suffix.slice(1),
          [],
          prior,
          errorsFor(name, postData)
        )
      })
  }
</section>
  `
}

function senderBlock (signature, postData, priorValueOf) {
  if (Array.isArray(signature.entities)) {
    // Entity Signatory
    return (
      inputWithPrior(
        'signatures-sender-company', 'Your Company’s Name',
        [
          'Enter the legal name of your company.',
          'For example: “YourCo, Inc.”'
        ]
      ) +
      inputWithPrior(
        'signatures-sender-form', 'Your Company’s Legal Form',
        [
          'Enter the legal form of your company.',
          'For example: “corporation”'
        ]
      ) +
      inputWithPrior(
        'signatures-sender-jurisdiction',
        'Your Company’s Legal Jurisdiction',
        [
          'Enter the legal jurisdiction under whose laws ' +
          'your company is formed.',
          'For example: “Delaware”'
        ]
      ) +
      inputWithPrior(
        'signatures-sender-name', 'Your Name',
        ['Enter your full legal name.']
      ) +
      inputWithPrior(
        'signatures-sender-title', 'Your Title',
        [
          'Enter your title at your company.',
          'For example: “Chief Executive Officer”'
        ]
      ) +
      byline(postData)
    )
  } else {
    // Individual Signatory
    return (
      inputWithPrior(
        'signatures-sender-name', 'Your Name',
        ['Enter your full legal name.']
      ) +
      byline(postData)
    )
  }

  function inputWithPrior (name, label, notes) {
    return input(
      name, label, notes,
      priorValueOf(name),
      errorsFor(name, postData)
    )
  }
}

function byline (postData) {
  var errors = errorsFor('signatures-sender-signature', postData)
  return html`
<section class=field>
  <label>Signature</label>
  ${asterisk()}
  ${errors && paragraphs(errors, 'error')}
  <input
    id=signature
    class=signature
    name=signatures-sender-signature
    type=text
    autocomplete=off
    required>
  <p class=description>
    To sign the form, enter your name again, exactly as you did before.
  </p>
  <p class=warning>
    By signing here and clicking Sign &amp; Send below, you offer to
    enter into a legally binding contract, on the terms of the form,
    with the other side.
  </p>
</section>`
}
