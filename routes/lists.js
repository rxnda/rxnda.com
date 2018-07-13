var Busboy = require('busboy')
var internalError = require('./internal-error')
var methodNotAllowed = require('./method-not-allowed')
var pump = require('pump')
var subscribe = require('../subscribe')

var banner = require('../partials/banner')
var footer = require('../partials/footer')
var html = require('./html')
var nav = require('../partials/nav')
var preamble = require('../partials/preamble')

var lists = ['lawyers@mail.rxnda.com']

module.exports = function (request, response) {
  if (request.method === 'GET') {
    get.apply(null, arguments)
  } else if (request.method === 'POST') {
    post.apply(null, arguments)
  } else {
    methodNotAllowed.apply(null, arguments)
  }
}

function get (request, response) {
  response.setHeader(
    'Content-Type', 'text/html; charset=ACII'
  )
  response.end(html`
${preamble('RxNDA Mailing Lists')}
${banner()}
${nav()}
<main>
  <h2>Mailing Lists</h2>
  <form method=POST action=/lists>
    <h3>Lawyers List</h3>
    <p>
      This list announces new form editions, new forms,
      and other items of interest to lawyers.
    <p>
    <input type=email name=address placeholder="Your E-Mail Address">
    <input type=hidden name=list value="${lists[0]}">
    <input type=submit value=Subscribe>
    <p>
      Your e-mail address will <em>not</em> be used for
      any other purpose.
      You can unsubscribe using the link at the bottom
      of each message from the list.
    </p>
  </form>
</main>
${footer()}`)
}

function post (request, response) {
  var address
  var list
  pump(
    request,
    new Busboy({headers: request.headers})
      .on('field', function (name, value) {
        if (name === 'address') {
          address = value.trim()
        } else if (name === 'list') {
          list = value.trim()
        }
      })
      .once('finish', function () {
        if (!address || !list || !lists.includes(list)) {
          response.statusCode = 400
          response.end()
        } else {
          subscribe(list, address, function (error) {
            if (error) {
              internalError(request, response, error)
            } else {
              response.setHeader(
                'Content-Type', 'text/html; charset=ACII'
              )
              response.end(html`
${preamble('RxNDA Mailing Lists')}
${banner()}
${nav()}
<main>
  <h2>Subscribed!</h2>
  <p>You are now subscribed to ${escape(list)}.</p>
</main>
${footer()}`)
            }
          })
        }
      })
  )
}
