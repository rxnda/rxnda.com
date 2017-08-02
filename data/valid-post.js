var analyze = require('commonform-analyze')
var sameArray = require('./same-array')
var validEMail = require('w3-is-email')

module.exports = function validPost (data, form) {
  var formBlanks = analyze(form.commonform).blanks
  var sender = data.signatures.sender
  var recipient = data.signatures.recipient
  var page = form.signatures[0]
  var errors = []

  if (data.terms !== 'accepted') {
    errors.push({
      name: 'terms',
      message: 'You must accept the terms to use this service.'
    })
  }

  // Sender
  isString(
    sender.name,
    'signatures-sender-name',
    'You must provide your name.'
  )

  isString(
    sender.signature,
    'signatures-sender-signature',
    'You must sign to send.'
  )

  if (sender.name !== sender.signature) {
    errors.push({
      name: 'signatures-sender-signature',
      message: 'Your signature must match your name exactly.'
    })
  }

  isEMail(
    sender.email,
    'signatures-sender-email',
    'You must provide a valid e-mail address.'
  )

  // Signature Page
  if (page.entities) {
    isString(
      sender.company,
      'signatures-sender-company',
      'You must provide your company\u2019s name.'
    )

    isString(
      sender.form,
      'signatures-sender-form',
      'You must provide your company\u2019s legal form.'
    )

    isString(
      sender.jurisdiction,
      'signatures-sender-jurisdiction',
      'You must provide your company\u2019s legal jurisdiction.'
    )

    isString(
      sender.title,
      'signatures-sender-title',
      'You must provide your title.'
    )
  }

  (page.information || [])
    .filter(function (element) {
      return element !== 'date' && element !== 'email'
    })
    .forEach(function (element) {
      isString(
        sender[element],
        'signatures-sender-' + element,
        'You must fill in ' + element
      )
    })

  // Recipient
  isString(
    recipient.email,
    'signatures-recipient-email',
    'You must provide the recipient\u2019s e-mail address.'
  )

  isEMail(
    recipient.email,
    'signatures-recipient-email',
    'You must provide a valid e-mail address.'
  )

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
          message: 'Direction ' + (index + 1) + ' must specify a value.'
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

  // Payment
  if (!data.token && !data.coupon) {
    errors.push({
      message: 'Provide payment.'
    })
  }

  return errors

  function isString (value, name, message) {
    if (!value) {
      errors.push({
        name: name,
        message: message
      })
    }
  }

  function isEMail (value, name, message) {
    if (!value || !validEMail(value)) {
      errors.push({
        name: name,
        message: message
      })
    }
  }
}
