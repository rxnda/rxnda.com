var paragraphs = require('./paragraphs')
var errorsFor = require('../util/errors-for')

var input = require('./input')

module.exports = function payment (postData, notes) {
  return `
    <section id=payment>
      <h3>Credit Card Payment</h3>
      <div id=card></div>
      <div id=card-errors></div>
      ${paragraphs(notes)}
      ${input({
        name: 'coupon',
        required: false,
        label: 'Coupon',
        notes: ['Enter a coupon code if you have one.'],
        errors: errorsFor('coupon', postData)
      })}
    </section>`
}
