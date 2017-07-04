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
  var stripe = window.Stripe(STRIPE_PUBLIC_KEY)
  var elements = stripe.elements()
  var card = elements.create('card')
  card.mount('#card')
  var form = document.forms[0]
  form.addEventListener('submit', function (event) {
    event.preventDefault()
    stripe.createToken(card).then(function (result) {
      if (result.error) {
        var errorElement = document.getElementById('card-errors')
        errorElement.textContent = result.error.message
      } else {
        var input = document.createElement('input')
        input.setAttribute('type', 'hidden')
        input.setAttribute('name', 'token')
        input.setAttribute('value', result.token.id)
        form.appendChild(input)
        form.submit()
        var button = document.getElementById('submitButton')
        button.setAttribute('disabled', true)
        button.value = 'Sending...'
      }
    })
  })
})
