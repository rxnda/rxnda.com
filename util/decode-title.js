module.exports = function (encoded) {
  return decodeURIComponent(encoded.replace(/_/g, ' '))
}
