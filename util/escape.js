var html = require('escape-html')

module.exports = function escape (string) {
  return html(string)
    .replace(/“/g, '&ldquo;')
    .replace(/”/g, '&rdquo;')
    .replace(/‘/g, '&lsquo;')
    .replace(/’/g, '&rsquo;')
}
