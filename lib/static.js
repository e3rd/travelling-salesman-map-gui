const sleep = ms => new Promise(r => setTimeout(r, ms))

const factorial = x => (x > 1) ? x * factorial(x - 1) : 1

/**
 * Are elements of the arrays equal?
 * https://stackoverflow.com/a/39967517/2036148
 * @param {Array} a
 * @param {Array} b
 * @returns {Boolean}
 */
function arraysEqual(a, b) {
    return a.length === b.length && a.every((el, ix) => el === b[ix])
  }
