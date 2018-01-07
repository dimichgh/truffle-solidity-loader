var chalk = require('chalk')
var leftPad = require('left-pad')

function truffleSolidityLog (category, categoryChalk) {
  return function (msg) {
    console.log(
      chalk.cyan('[TRUFFLE SOLIDITY]'),
      categoryChalk(leftPad(category, 7)),
      msg
        .replace(/^(?:\r\n|\r|\n)+/, '') // trim line breaks if they exist at beginning of str
        .replace(/(?:\r\n|\r|\n)/g, '\n' + ' '.repeat(27)) // pad below lines
    )
  }
}

var Logger = {
  log: truffleSolidityLog('LOG', chalk.cyan),
  error: truffleSolidityLog('ERROR', chalk.red),
  warn: truffleSolidityLog('WARNING', chalk.yellow)
}

module.exports = Logger;
