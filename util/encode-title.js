module.exports = function encodeTitle (title) {
  return encodeURIComponent(title.replace(/ /g, '_'))
}
