document.addEventListener('DOMContentLoaded', function () {
  document.forms[0].addEventListener('submit', function (event) {
    var button = document.getElementById('submitButton')
    button.setAttribute('disabled', true)
    button.value = 'Sending...'
  })
})
