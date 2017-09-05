var html = require('../routes/html')

module.exports = function (postData) {
  if (postData && postData.errors) {
    return html`
      <p class=error>
        Look below for
        ${postData.errors.length === 1 ? 'another box' : 'more boxes'}
        like this one.
      </p>
    `
  } else {
    return ''
  }
}
