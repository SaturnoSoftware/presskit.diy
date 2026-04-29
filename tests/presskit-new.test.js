'use strict'

describe('presskit-new CLI', () => {
  let runNewCommand
  let originalArgv
  let cwdSpy

  beforeEach(() => {
    jest.resetModules()
    originalArgv = process.argv.slice()
    runNewCommand = jest.fn()
    cwdSpy = jest.spyOn(process, 'cwd').mockReturnValue('/tmp/presskit-cli-cwd')

    jest.doMock('../lib/index', () => ({
      runNewCommand
    }))
  })

  afterEach(() => {
    process.argv = originalArgv
    cwdSpy.mockRestore()
    jest.dontMock('../lib/index')
  })

  function loadCli (args) {
    process.argv = ['node', 'bin/presskit-new.js', ...args]
    jest.isolateModules(() => {
      require('../bin/presskit-new')
    })
  }

  it('uses company as the default scaffold type', () => {
    loadCli([])

    expect(runNewCommand).toHaveBeenCalledWith('company', '/tmp/presskit-cli-cwd')
  })

  it('uses the current working directory as the default destination', () => {
    loadCli(['-t', 'product'])

    expect(runNewCommand).toHaveBeenCalledWith('product', '/tmp/presskit-cli-cwd')
  })

  it('passes an explicit destination to runNewCommand', () => {
    loadCli(['./site'])

    expect(runNewCommand).toHaveBeenCalledWith('company', './site')
  })

  it('passes an explicit product type to runNewCommand', () => {
    loadCli(['./site', '-t', 'product'])

    expect(runNewCommand).toHaveBeenCalledWith('product', './site')
  })

  it('passes an explicit company type to runNewCommand', () => {
    loadCli(['./site', '-t', 'company'])

    expect(runNewCommand).toHaveBeenCalledWith('company', './site')
  })

  it('passes windows-style destinations through to the library boundary unchanged', () => {
    loadCli(['C:\\workspace\\presskit'])

    expect(runNewCommand).toHaveBeenCalledWith('company', 'C:\\workspace\\presskit')
  })
})
