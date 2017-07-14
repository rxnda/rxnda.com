var analyze = require('commonform-analyze')
var sameArray = require('./same-array')

module.exports = function (data, form) {
  var formBlanks = analyze(form.commonform).blanks
  var sender = data.signatures.sender
  var recipient = data.signatures.recipient
  var page = form.signatures[0]
  var errors = []

  // Sender

  if (!sender.name) {
    errors.push({
      name: 'signatures-sender-name',
      message: 'You must provide your name.'
    })
  }

  if (!sender.signature) {
    errors.push({
      name: 'signatures-sender-signature',
      message: 'You must sign to send.'
    })
  }

  if (sender.name !== sender.signature) {
    errors.push({
      name: 'signatures-sender-signature',
      message: 'Your signature must match your name exactly.'
    })
  }

  if (!sender.email) {
    errors.push({
      name: 'signatures-sender-email',
      message: 'Your must provide your e-mail address.'
    })
  }

  // Signature Page
  if (page.entities) {
    if (!sender.company) {
      errors.push({
        name: 'signatures-sender-company',
        message: 'You must provide your company\u2019s name.'
      })
    }

    if (!sender.form) {
      errors.push({
        name: 'signatures-sender-form',
        message: 'You must provide your company\u2019s legal form.'
      })
    }

    if (!sender.jurisdiction) {
      errors.push({
        name: 'signatures-sender-jurisdiction',
        message: 'You must provide your company\u2019s legal jurisdiction.'
      })
    }

    if (!sender.title) {
      errors.push({
        name: 'signatures-sender-title',
        message: 'You must provide your title.'
      })
    }
  }

  (page.information || [])
    .filter(function (element) {
      return element !== 'date'
    })
    .forEach(function (element) {
      if (!sender[element]) {
        errors.push({
          name: 'signatures-sender-' + element,
          message: 'You must fill in ' + element
        })
      }
    })

  // Recipient

  if (!recipient.email) {
    errors.push({
      name: 'signatures-recipient-email',
      message: 'You must provide the recipient\u2019s e-mail address.'
    })
  }

  // Directions

  if (!Array.isArray(data.directions)) {
    errors.push({
      message: 'Invalid directions.'
    })
  } else {
    data.directions.forEach(function (direction, index) {
      if (!direction.blank || !Array.isArray(direction.blank)) {
        errors.push({
          message: (
            'Direction ' + (index + 1) + ' must specify a blank.'
          )
        })
      }
      if (!direction.value) {
        errors.push({
          message: (
            'Direction ' + (index + 1) + ' must specify a value.'
          )
        })
      }
    })

    if (formBlanks.length !== data.directions.length) {
      errors.push({
        message: 'Provide a direction for each blank.'
      })
    }

    var unfilledBlanks = formBlanks.filter(function (emptyBlank) {
      return !data.directions.some(function (direction) {
        return sameArray(emptyBlank, direction.blank)
      })
    })
    if (unfilledBlanks.length !== 0) {
      unfilledBlanks.forEach(function (unfilledBlank) {
        errors.push({
          message: (
            'Provide a direction for blank at ' +
            JSON.stringify(unfilledBlank)
          )
        })
      })
    }
  }

  if (!data.token) {
    errors.push({
      message: 'Provide a payment token.'
    })
  }

  return errors
}
