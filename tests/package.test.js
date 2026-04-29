'use strict'

const pkg = require('../package.json')

describe('package metadata', () => {
  it('uses presskit-diy as the package name', () => {
    expect(pkg.name).toBe('presskit-diy')
  })

  it('defines the presskit-diy CLI entry point', () => {
    expect(pkg.bin['presskit-diy']).toBe('bin/presskit-diy')
  })

  it('defines the compatibility presskit CLI alias', () => {
    expect(pkg.bin.presskit).toBe('bin/presskit')
  })

  it('exposes the main library entry point', () => {
    expect(pkg.main).toBe('lib/index.js')
  })

  it('defines the test script', () => {
    expect(pkg.scripts.test).toContain('jest')
  })

  it('defines the build script', () => {
    expect(pkg.scripts.build).toContain('presskit-diy build')
  })

  it('defines Saturno build metadata', () => {
    expect(Number.isInteger(pkg.build)).toBe(true)
  })

  it('defines the development start script', () => {
    expect(pkg.scripts.start).toContain('--watch --dev')
  })

  it('depends on xml2js for xml parsing support', () => {
    expect(pkg.dependencies.xml2js).toBeDefined()
  })

  it('depends on sharp for thumbnail generation', () => {
    expect(pkg.dependencies.sharp).toBeDefined()
  })

  it('uses jest as the node test environment', () => {
    expect(pkg.jest.testEnvironment).toBe('node')
  })
})
