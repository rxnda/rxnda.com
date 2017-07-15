module.exports = function elide () {
  var args = Array.prototype.slice.call(arguments)
  var object = args[0]
  var drop = args.slice(1)
  var returned = {}
  Object.keys(object).forEach(function (key) {
    if (drop.includes(key)) {
      returned[key] = 'ELIDED'
    } else {
      returned[key] = object[key]
    }
  })
  return returned
}
