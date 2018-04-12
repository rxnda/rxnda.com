var SUFFIX = '-evergreen'

module.exports = function (code) {
  return code.endsWith(SUFFIX)
}
