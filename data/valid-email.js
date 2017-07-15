/* eslint-disable */
// Source: https://html.spec.whatwg.org/multipage/input.html#e-mail-state-(type%3Demail)
var RE = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
/* eslint-enable */

module.exports = function (argument) {
  return RE.test(argument)
}
