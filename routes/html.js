module.exports = function (/*strings, values... */) {
  var strings = arguments[0]
  var values = Array.prototype.slice.call(arguments, 1)
  var result = ''
  strings.forEach(function (string, index) {
    result += string
    if (index < values.length) {
      result += toString(values[index])
    }
  })
  return result.trim()
}

function toString (value) {
  /* istanbul ignore else */
  if (value === false || value === undefined) {
    return ''
  } else if (Array.isArray(value)) {
    return value.join('')
  } else if (typeof value === 'string') {
    return value
  } else {
    throw 'Invalid template value ' + typeof value + JSON.stringify(value)
  }
}
