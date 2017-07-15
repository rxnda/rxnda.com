module.exports = function validCountersignPost (data, form) {
  var page = form.signatures[1]
  var errors = []

  isString(
    data.name,
    'signatures-recipient-name',
    'You must provide your name.'
  )

  isString(
    data.signature,
    'signatures-recipient-signature',
    'You must sign to send.'
  )

  if (data.name !== data.signature) {
    errors.push({
      name: 'signatures-recipient-signature',
      message: 'Your signature must match your name exactly.'
    })
  }

  // Signature Page
  if (page.entities) {
    isString(
      data.company,
      'signatures-recipient-company',
      'You must provide your company\u2019s name.'
    )

    isString(
      data.form,
      'signatures-recipient-form',
      'You must provide your company\u2019s legal form.'
    )

    isString(
      data.jurisdiction,
      'signatures-recipient-jurisdiction',
      'You must provide your company\u2019s legal jurisdiction.'
    )

    isString(
      data.title,
      'signatures-recipient-title',
      'You must provide your title.'
    )
  }

  (page.information || [])
    .filter(function (element) {
      return element !== 'date' && element !== 'email'
    })
    .forEach(function (element) {
      isString(
        data[element],
        'signatures-recipient-' + element,
        'You must fill in ' + element
      )
    })

  return errors

  function isString (value, name, message) {
    if (!value) {
      errors.push({
        name: name,
        message: message
      })
    }
  }
}
