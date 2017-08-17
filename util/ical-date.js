module.exports = function icalDate (date) {
  return (
    date.getFullYear().toString() +
    pad((date.getMonth() + 1).toString()) +
    pad(date.getDate().toString()) +
    'T' +
    pad(date.getHours().toString()) +
    pad(date.getMinutes().toString()) +
    pad(date.getSeconds().toString()) +
    'Z'
  )
}

function pad (string) {
  return string.length < 2 ? '0' + string : string
}
