module.exports = process.env.NODE_ENV === 'test'
  ? function novalidate (request) {
    if (request.query.novalidate) {
      return 'novalidate'
    }
  }
  : function novalidate () {
    return ''
  }
