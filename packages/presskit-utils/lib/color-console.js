'use strict'

const chalk = require('chalk')

function colorize (colorizer, args) {
  return Array.from(args).map(el => colorizer(el))
}

function error () {
  console.error.apply(null, colorize(chalk.red, arguments))
}

function warn () {
  console.warn.apply(null, colorize(chalk.yellow, arguments))
}

module.exports = {
  __colorize: colorize,
  error,
  warn,
  log: console.log
}
