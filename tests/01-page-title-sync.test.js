/* eslint-env jest */
'use strict'

const fs = require('fs')
const path = require('path')
const os = require('os')
const config = require('../lib/config')

jest.mock('sharp', () => jest.fn(() => ({
  resize () { return this },
  flatten () { return this },
  jpeg () { return this },
  async toFile (output) { require('fs').writeFileSync(output, 'thumbnail') }
})))

jest.mock('../lib/helpers/watcher', () => ({
  installWatcher: jest.fn(),
  installDevelopmentWatcher: jest.fn()
}))

const generator = require('../lib/core/generator')

// Helpers
function createTempDir () {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'presskit-test-title-'))
}

function writeXML (dir, xml) {
  fs.writeFileSync(path.join(dir, 'data.xml'), xml)
}

function setupConfig (outputDir) {
  config.commands.build = {
    output: outputDir,
    ignoreThumbnails: true,
    baseUrl: '/',
    prettyLinks: false,
    hamburger: false
  }
}

describe('Page Title Syncing', () => {
  let tempDir
  let buildDir

  beforeEach(() => {
    tempDir = createTempDir()
    buildDir = path.join(tempDir, 'build')
    setupConfig(buildDir)
  })

  afterEach(() => {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true })
    } catch (e) {
      // Ignore cleanup errors
    }
  })

  test('product page title format is "{{presskit.title}} - Presskit"', async () => {
    writeXML(tempDir, `<?xml version="1.0" encoding="utf-8"?>
<product>
  <title>Amazing Game</title>
  <website>https://example.com</website>
  <description>Test</description>
  <credits><credit><person>Dev</person><role>Developer</role></credit></credits>
</product>`)
    await generator.generate(tempDir)
    const html = fs.readFileSync(path.join(buildDir, 'index.html'), 'utf-8')
    expect(html).toContain('<title>Amazing Game - Presskit</title>')
  })

  test('company page title format is "{{presskit.title}} - Presskit"', async () => {
    writeXML(tempDir, `<?xml version="1.0" encoding="utf-8"?>
<company>
  <title>Amazing Studio</title>
  <website>https://example.com</website>
  <description>Test</description>
  <press-contact><name>Contact</name></press-contact>
</company>`)
    await generator.generate(tempDir)
    const html = fs.readFileSync(path.join(buildDir, 'index.html'), 'utf-8')
    expect(html).toContain('<title>Amazing Studio - Presskit</title>')
  })

  test('page title handles special characters', async () => {
    writeXML(tempDir, `<?xml version="1.0" encoding="utf-8"?>
<product>
  <title>Game™ 2024</title>
  <website>https://example.com</website>
  <description>Test</description>
  <credits><credit><person>Dev</person><role>Developer</role></credit></credits>
</product>`)
    await generator.generate(tempDir)
    const html = fs.readFileSync(path.join(buildDir, 'index.html'), 'utf-8')
    expect(html).toContain('<title>Game™ 2024 - Presskit</title>')
  })

  test('page title format has correct spacing', async () => {
    writeXML(tempDir, `<?xml version="1.0" encoding="utf-8"?>
<product>
  <title>My Game</title>
  <website>https://example.com</website>
  <description>Test</description>
  <credits><credit><person>Dev</person><role>Developer</role></credit></credits>
</product>`)
    await generator.generate(tempDir)
    const html = fs.readFileSync(path.join(buildDir, 'index.html'), 'utf-8')
    expect(html).toMatch(/<title>My Game - Presskit<\/title>/)
    expect(html).not.toContain(' -  ')
    expect(html).not.toContain('  - ')
  })
})
