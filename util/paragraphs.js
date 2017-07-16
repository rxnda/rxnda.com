var escape = require('./escape')

module.exports = function paragraphs (array, className) {
  className = className || 'description'
  return array
    .map(function (element) {
      return `<p class=${className}>${escape(element)}</p>`
    })
    .join('')
}
