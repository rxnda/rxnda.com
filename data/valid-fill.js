module.exports = function validPost (prescription, data) {
  var errors = []

  Object.keys(prescription)
    .filter(function (key) {
      return (
        key.indexOf('signatures-') === 0 ||
        key.indexOf('directions-') === 0
      )
    })
    .forEach(function (key) {
      if (data[key] !== prescription[key]) {
        errors.push({
          name: key,
          message: 'You must use the values set by the prescription.'
        })
      }
    })

  return errors
}
