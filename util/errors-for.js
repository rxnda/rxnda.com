module.exports = function errorsFor (name, postData) {
  if (postData) {
    return postData.errors
      .filter(function (error) {
        return error.name === name
      })
      .map(function (error) {
        return error.message
      })
  }
  return []
}
