module.exports = function (title) {
  return encodeURIComponent(title.replace(/ /g, '_'))
}
