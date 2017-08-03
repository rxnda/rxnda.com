module.exports = function (scripts) {
  return `
<footer role=contentinfo>
  <ul>
    <li><a href=https://github.com/rxnda target=_blank>GitHub</a></li>
    <li><a href=/terms#terms>Terms</a></li>
    <li><a href=/terms#privacy>Privacy</a></li>
  </ul>
</footer>
${
  Array.prototype.slice.call(arguments)
    .map(function (script) {
      return script === 'stripe'
        ? 'https://js.stripe.com/v3/'
        : '/' + script + '.js'
    })
    .map(function (script) {
      return `<script src=${script}></script>`
    })
    .join('')
}
</body>
</html>`
}
