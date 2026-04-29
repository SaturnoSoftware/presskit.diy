'use strict'

const path = require('path')

describe('presskit-build CLI', () => {
  let runBuildCommand
  let originalArgv

  beforeEach(() => {
    jest.resetModules()
    originalArgv = process.argv.slice()
    runBuildCommand = jest.fn()

    jest.doMock('../lib/index', () => ({
      runBuildCommand
    }))
  })

  afterEach(() => {
    process.argv = originalArgv
    jest.dontMock('../lib/index')
  })

  function loadCli (args) {
    process.argv = ['node', 'bin/presskit-build.js', ...args]
    jest.isolateModules(() => {
      require('../bin/presskit-build')
    })
  }

  it('passes default build options to runBuildCommand', () => {
    loadCli([])

    expect(runBuildCommand).toHaveBeenCalledWith({
      entryPoint: undefined,
      cleanBuildFolder: undefined,
      ignoreThumbnails: undefined,
      prettyLinks: undefined,
      baseUrl: '/',
      css: 'light',
      hamburger: undefined,
      output: path.join(process.cwd(), 'build'),
      watch: undefined,
      port: 8080,
      dev: undefined
    })
  })

  it('passes the entry point argument to runBuildCommand', () => {
    loadCli(['data'])

    expect(runBuildCommand).toHaveBeenCalledWith(expect.objectContaining({
      entryPoint: 'data'
    }))
  })

  it('passes the output option to runBuildCommand', () => {
    loadCli(['-o', 'dist'])

    expect(runBuildCommand).toHaveBeenCalledWith(expect.objectContaining({
      output: 'dist'
    }))
  })

  it('passes windows-style output paths through to the library boundary unchanged', () => {
    loadCli(['-o', 'C:\\workspace\\presskit\\build'])

    expect(runBuildCommand).toHaveBeenCalledWith(expect.objectContaining({
      output: 'C:\\workspace\\presskit\\build'
    }))
  })

  it('passes the watch option to runBuildCommand', () => {
    loadCli(['-w'])

    expect(runBuildCommand).toHaveBeenCalledWith(expect.objectContaining({
      watch: true
    }))
  })

  it('passes the dev option to runBuildCommand', () => {
    loadCli(['-d'])

    expect(runBuildCommand).toHaveBeenCalledWith(expect.objectContaining({
      dev: true
    }))
  })

  it('passes the port option to runBuildCommand', () => {
    loadCli(['-p', '9000'])

    expect(runBuildCommand).toHaveBeenCalledWith(expect.objectContaining({
      port: '9000'
    }))
  })

  it('passes the clean build folder option to runBuildCommand', () => {
    loadCli(['-D'])

    expect(runBuildCommand).toHaveBeenCalledWith(expect.objectContaining({
      cleanBuildFolder: true
    }))
  })

  it('passes the pretty links option to runBuildCommand', () => {
    loadCli(['-L'])

    expect(runBuildCommand).toHaveBeenCalledWith(expect.objectContaining({
      prettyLinks: true
    }))
  })

  it('passes the collapse menu option to runBuildCommand', () => {
    loadCli(['-M'])

    expect(runBuildCommand).toHaveBeenCalledWith(expect.objectContaining({
      hamburger: true
    }))
  })

  it('passes the base url option to runBuildCommand', () => {
    loadCli(['-B', '/press'])

    expect(runBuildCommand).toHaveBeenCalledWith(expect.objectContaining({
      baseUrl: '/press'
    }))
  })

  it('passes the ignore thumbnails option to runBuildCommand', () => {
    loadCli(['-T'])

    expect(runBuildCommand).toHaveBeenCalledWith(expect.objectContaining({
      ignoreThumbnails: true
    }))
  })

  it('passes the css option to runBuildCommand', () => {
    loadCli(['-C', 'dark'])

    expect(runBuildCommand).toHaveBeenCalledWith(expect.objectContaining({
      css: 'dark'
    }))
  })

  it('passes all supported options together to runBuildCommand', () => {
    loadCli([
      'data',
      '-o', 'dist',
      '-w',
      '-d',
      '-p', '9999',
      '-D',
      '-L',
      '-M',
      '-B', '/kit',
      '-T',
      '-C', 'dark'
    ])

    expect(runBuildCommand).toHaveBeenCalledWith({
      entryPoint: 'data',
      cleanBuildFolder: true,
      ignoreThumbnails: true,
      prettyLinks: true,
      baseUrl: '/kit',
      css: 'dark',
      hamburger: true,
      output: 'dist',
      watch: true,
      port: '9999',
      dev: true
    })
  })
})
