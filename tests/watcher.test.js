'use strict'

const path = require('upath')

const mockInit = jest.fn()
const mockReload = jest.fn()
const mockOn = jest.fn()
const mockWatch = jest.fn(() => ({ on: mockOn }))

jest.mock('browser-sync', () => ({
  create: jest.fn(() => ({
    init: mockInit,
    reload: mockReload
  }))
}))

jest.mock('chokidar', () => ({
  watch: mockWatch
}))

const config = require('../lib/config')
const { assets } = require('../lib/assets')
const {
  installWatcher,
  installDevelopmentWatcher,
  __getDataWatchPatterns: getDataWatchPatterns
} = require('../lib/helpers/watcher')

describe('watcher helpers', () => {
  beforeEach(() => {
    mockInit.mockClear()
    mockReload.mockClear()
    mockOn.mockClear()
    mockWatch.mockClear()

    config.commands.build = {
      output: '/tmp/build',
      port: 8080
    }
  })

  it('returns both XML and JSON watch patterns', () => {
    expect(getDataWatchPatterns('/project')).toEqual([
      path.join('/project', '**/data.xml'),
      path.join('/project', '**/data.json')
    ])
  })

  it('installs the simple watcher for both XML and JSON data files', () => {
    installWatcher('/project', jest.fn())

    expect(mockInit).toHaveBeenCalledWith({
      server: '/tmp/build',
      port: 8080,
      ui: false,
      open: false,
      logLevel: 'silent'
    })

    expect(mockWatch).toHaveBeenCalledWith([
      path.join('/project', '**/data.xml'),
      path.join('/project', '**/data.json')
    ], {
      ignored: /(^|[/\\])\../,
      persistent: true
    })
  })

  it('installs the development watcher for templates plus XML and JSON data files', () => {
    installDevelopmentWatcher('/project', jest.fn())

    expect(mockInit).toHaveBeenCalledWith({
      server: ['/tmp/build', assets],
      port: 8080,
      files: path.join(assets, '**/*.css'),
      ui: false,
      open: false
    })

    expect(mockWatch).toHaveBeenCalledWith([
      path.join(assets, '**/*.html'),
      path.join('/project', '**/data.xml'),
      path.join('/project', '**/data.json')
    ], {
      ignored: /(^|[/\\])\../,
      persistent: true
    })
  })

  it('reloads the browser when the simple watcher change callback fires', () => {
    const callback = jest.fn()

    installWatcher('/project', callback)

    const handler = mockOn.mock.calls.find(call => call[0] === 'change')[1]
    handler()

    expect(callback).toHaveBeenCalled()
    expect(mockReload).toHaveBeenCalled()
  })

  it('reloads the browser when the development watcher change callback fires', () => {
    const callback = jest.fn()

    installDevelopmentWatcher('/project', callback)

    const handler = mockOn.mock.calls.find(call => call[0] === 'change')[1]
    handler()

    expect(callback).toHaveBeenCalled()
    expect(mockReload).toHaveBeenCalled()
  })
})
