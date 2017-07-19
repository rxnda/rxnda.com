module.exports = function (scripts) {
  return `
<footer role=contentinfo>
  <ul>
    <li><a href=/terms#terms>Terms</a></li>
    <li><a href=/terms#privacy>Privacy</a></li>
  </ul>
</footer>
${
  (scripts || [])
    .map(function (script) {
      return `<script src=/${script}></script>`
    })
    .join('')
}
</body>
</html>`
}
