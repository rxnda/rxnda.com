module.exports = function validSignPost (data, form) {
  var page = form.signatures[1]
  return (
    // Sender
    data.name &&
    data.signature &&
    data.name === data.signature &&
    // Signature Page
    (
      !page.entities ||
      (
        data.company &&
        data.jurisdiction &&
        data.form &&
        data.title
      )
    ) &&
    (page.information || [])
      .filter(function (element) {
        return (
          element !== 'email' &&
          element !== 'date'
        )
      })
      .every(function (element) {
        return data[element] && typeof data[element] === 'string'
      }) &&
    true
  )
}
