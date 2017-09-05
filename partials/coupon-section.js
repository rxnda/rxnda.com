var escape = require('../util/escape')
var html = require('../routes/html')

module.exports = function couponSection (coupon) {
  return html`
    <section id=payment>
      <h3>Coupon</h3>
      <input name=coupon type=hidden value="${escape(coupon)}">
      <p>Your coupon code entitles you to send for free.</p>
    </section>`
}
