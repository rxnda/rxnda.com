module.exports = function decodeTitle (encoded) {
  return decodeURIComponent(encoded.replace(/_/g, ' '))
}
