var escape = require('../util/escape')
var stylesheets = require('./stylesheets')

module.exports = function (title) {
  return `
<!doctype html>
<html lang=en>
  <head>
    <meta charset=ASCII>
    <title>RxNDA${title ? (' / ' + escape(title)) : ''}</title>
    ${stylesheets}
  </head>
  <body>`
}
