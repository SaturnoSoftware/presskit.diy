'use strict'

const fs = require('fs-extra')
const path = require('path')
const pkg = require('../package.json')

describe('Saturno wrapper contract', () => {
  const repoRoot = path.join(__dirname, '..')

  it('keeps an integer Saturno build number in package.json', () => {
    expect(Number.isInteger(pkg.build)).toBe(true)
  })

  it('provides a root build wrapper', () => {
    const buildScript = path.join(repoRoot, 'Scripts/build.ps1')
    expect(fs.existsSync(buildScript)).toBe(true)

    const content = fs.readFileSync(buildScript, 'utf8')
    expect(content).toContain('npm test -- --runInBand')
    expect(content).toContain('npm run build')
    expect(content).toContain('__BUILD')
  })

  it('provides a root package wrapper', () => {
    const packageScript = path.join(repoRoot, 'Scripts/package.ps1')
    expect(fs.existsSync(packageScript)).toBe(true)

    const content = fs.readFileSync(packageScript, 'utf8')
    expect(content).toContain('npm pack --pack-destination')
    expect(content).toContain('__DIST')
  })

  it('ignores Saturno build artifacts in git', () => {
    const gitignore = fs.readFileSync(path.join(repoRoot, '.gitignore'), 'utf8')
    expect(gitignore).toContain('__BUILD/')
    expect(gitignore).toContain('__DIST/')
  })

  it('keeps Saturno repo scripts out of the npm package artifact', () => {
    const npmignore = fs.readFileSync(path.join(repoRoot, '.npmignore'), 'utf8')
    expect(npmignore).toContain('Scripts/')
  })
})
