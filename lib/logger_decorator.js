var chalk = require('chalk')
var leftPad = require('left-pad')

function pad (str, ignoreFirstLine) {
  if(str instanceof Error) pad(str.stack.toString(), true)
  
  var strWithNewLinesPadded = str.replace(/(?:\r\n|\r|\n)/g, '\n' + ' '.repeat(26))
  return ignoreFirstLine
    ? strWithNewLinesPadded
    : leftPad(strWithNewLinesPadded, 26)
}

var Logger = {
  log: function(msg) {
    console.log(chalk.cyan(pad('[TRUFFLE SOLIDITY LOG]')), pad(msg, true))
  },
  error: function(msg) {
    console.log(chalk.red(pad('[TRUFFLE SOLIDITY ERROR]')), pad(msg, true))
  },
  warn: function(msg) {
    console.log(chalk.yellow(pad('[TRUFFLE SOLIDITY WARNING]')), pad(msg, true))
  }
}

module.exports = Logger;
