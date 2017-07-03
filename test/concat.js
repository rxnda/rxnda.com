module.exports = function (stream, callback) {
  var buffer = []
  stream
    .on('data', function (chunk) {
      buffer.push(chunk)
    })
    .once('error', function (error) {
      callback(error)
    })
    .once('end', function () {
      var body = Buffer.concat(buffer)
      callback(null, body.toString())
    })
}
