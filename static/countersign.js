document.addEventListener('DOMContentLoaded', function () {
  // Add an event handler to validate the signature <input>.
  var name = document.getElementById('name')
  document
    .getElementById('signature')
    .addEventListener('change', function (event) {
      if (name.value === this.value) {
        this.setCustomValidity('')
      } else {
        this.setCustomValidity(
          'Sign by typing your name again, exactly as above.'
        )
      }
    })
  document.forms[0].addEventListener('submit', function (event) {
    var button = document.getElementById('submitButton')
    button.setAttribute('disabled', true)
    button.value = 'Sending...'
  })
})
