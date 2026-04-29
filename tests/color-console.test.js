'use strict'

const chalk = require('chalk')

const colorConsole = require('../lib/helpers/color-console')

describe('color console helpers', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('colorize()', () => {
    it.each([
      [[], []],
      [['text'], [chalk.red('text')]],
      [[1, true, 'text'], [chalk.red(1), chalk.red(true), chalk.red('text')]]
    ])('colorizes argument lists: %j', (input, expected) => {
      expect(colorConsole.__colorize(chalk.red, input)).toEqual(expected)
    })
  })

  describe('warn()', () => {
    it('forwards colorized arguments to console.warn', () => {
      const spy = jest.spyOn(console, 'warn').mockImplementation(() => {})

      colorConsole.warn('warning', 'message')

      expect(spy).toHaveBeenCalledWith(chalk.yellow('warning'), chalk.yellow('message'))
    })
  })

  describe('error()', () => {
    it('forwards colorized arguments to console.error', () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {})

      colorConsole.error('error', 'message')

      expect(spy).toHaveBeenCalledWith(chalk.red('error'), chalk.red('message'))
    })
  })
})
