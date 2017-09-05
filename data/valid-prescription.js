var VALID_TERMS = require('./valid-prescription-terms')
var analyze = require('commonform-analyze')
var sameArray = require('./same-array')
var validEMail = require('w3-is-email')

module.exports = function validPost (data, form) {
  var formBlanks = analyze(form.commonform).blanks
  var sender = data.signatures.sender
  var page = form.signatures[0]
  var errors = []

  if (data.terms !== 'accepted') {
    errors.push({
      name: 'terms',
      message: 'You must accept the terms to use this service.'
    })
  }

  isString(
    data.notes,
    'notes',
    'Notes must be a string.'
  )

  if (!data.expiration || !VALID_TERMS.includes(data.expiration)) {
    errors.push({
      name: 'expiration',
      message: 'Term must be one of the provided options.'
    })
  }

  isEMail(
    sender.email,
    'signatures-sender-email',
    'You must provide a valid e-mail address.'
  )

  if (page.entities) {
    isString(
      sender.company,
      'signatures-sender-company',
      'You must provide your client\u2019s name.'
    )

    isString(
      sender.form,
      'signatures-sender-form',
      'You must provide your client\u2019s legal form.'
    )

    isString(
      sender.jurisdiction,
      'signatures-sender-jurisdiction',
      'You must provide your client\u2019s legal jurisdiction.'
    )
  } else {
    isString(
      sender.name,
      'signatures-sender-name',
      'You must provide the client\u2019s name.'
    )
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
          message: 'Direction ' + (index + 1) + ' must specify a value.'
        })
      }
      var correspondsToBlank = formBlanks.some(function (emptyBlank) {
        return sameArray(emptyBlank, direction.blank)
      })
      if (!correspondsToBlank) {
        errors.push({
          message: (
            'Direction ' + (index + 1) + ' must specify a blank ' +
            'in the form.'
          )
        })
      }
    })
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
