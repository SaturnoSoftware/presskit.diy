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
  return fs.mkdtempSync(path.join(os.tmpdir(), 'presskit-test-cleanup-'))
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

describe('HTML Cleanup - Orphaned Elements', () => {
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

  describe('Videos section', () => {
    test('videos section not rendered when trailers is empty', async () => {
      writeXML(tempDir, `<?xml version="1.0" encoding="utf-8"?>
<product>
  <title>Test Game</title>
  <website>https://example.com</website>
  <description>Test</description>
  <credits><credit><person>Dev</person><role>Developer</role></credit></credits>
</product>`)
      await generator.generate(tempDir)
      const html = fs.readFileSync(path.join(buildDir, 'index.html'), 'utf-8')
      expect(html).not.toContain('<h2 id="videos">Videos</h2>')
      expect(html).not.toContain('There are currently no trailers')
    })

    test('videos section rendered when trailers present', async () => {
      writeXML(tempDir, `<?xml version="1.0" encoding="utf-8"?>
<product>
  <title>Test Game</title>
  <website>https://example.com</website>
  <description>Test</description>
  <credits><credit><person>Dev</person><role>Developer</role></credit></credits>
  <trailers>
    <trailer name="Trailer 1">https://www.youtube.com/embed/abc123</trailer>
  </trailers>
</product>`)
      await generator.generate(tempDir)
      const html = fs.readFileSync(path.join(buildDir, 'index.html'), 'utf-8')
      expect(html).toContain('<h2 id="videos">Videos</h2>')
    })
  })

  describe('Logo section', () => {
    test('logo section not rendered when no logos', async () => {
      writeXML(tempDir, `<?xml version="1.0" encoding="utf-8"?>
<product>
  <title>Test Game</title>
  <website>https://example.com</website>
  <description>Test</description>
  <credits><credit><person>Dev</person><role>Developer</role></credit></credits>
</product>`)
      await generator.generate(tempDir)
      const html = fs.readFileSync(path.join(buildDir, 'index.html'), 'utf-8')
      expect(html).not.toContain('<h2 id="logo">Logo & Icon</h2>')
      expect(html).not.toContain('There are currently no logos')
    })

    test('logo section rendered when logos present', async () => {
      // Note: This test requires actual logo files on disk
      // For now, we focus on the cleanup behavior when logos are absent
      // TODO: Add file-based logo tests when integrating with full test suite
    })
  })

  describe('Awards section', () => {
    test('awards section not rendered when empty', async () => {
      writeXML(tempDir, `<?xml version="1.0" encoding="utf-8"?>
<product>
  <title>Test Game</title>
  <website>https://example.com</website>
  <description>Test</description>
  <credits><credit><person>Dev</person><role>Developer</role></credit></credits>
</product>`)
      await generator.generate(tempDir)
      const html = fs.readFileSync(path.join(buildDir, 'index.html'), 'utf-8')
      expect(html).not.toContain('<h2 id="awards">Awards & Recognition</h2>')
    })

    test('awards section rendered when present', async () => {
      writeXML(tempDir, `<?xml version="1.0" encoding="utf-8"?>
<product>
  <title>Test Game</title>
  <website>https://example.com</website>
  <description>Test</description>
  <credits><credit><person>Dev</person><role>Developer</role></credit></credits>
  <awards>
    <award description="Best Game" info="2024"/>
  </awards>
</product>`)
      await generator.generate(tempDir)
      const html = fs.readFileSync(path.join(buildDir, 'index.html'), 'utf-8')
      expect(html).toContain('<h2 id="awards">Awards & Recognition</h2>')
    })
  })

  describe('Quotes section', () => {
    test('quotes section not rendered when empty', async () => {
      writeXML(tempDir, `<?xml version="1.0" encoding="utf-8"?>
<product>
  <title>Test Game</title>
  <website>https://example.com</website>
  <description>Test</description>
  <credits><credit><person>Dev</person><role>Developer</role></credit></credits>
</product>`)
      await generator.generate(tempDir)
      const html = fs.readFileSync(path.join(buildDir, 'index.html'), 'utf-8')
      expect(html).not.toContain('<h2 id="articles">Selected Articles</h2>')
    })

    test('quotes section rendered when present', async () => {
      writeXML(tempDir, `<?xml version="1.0" encoding="utf-8"?>
<product>
  <title>Test Game</title>
  <website>https://example.com</website>
  <description>Test</description>
  <credits><credit><person>Dev</person><role>Developer</role></credit></credits>
  <quotes>
    <quote description="Great game!" name="Reviewer" link="https://example.com" website="Example"/>
  </quotes>
</product>`)
      await generator.generate(tempDir)
      const html = fs.readFileSync(path.join(buildDir, 'index.html'), 'utf-8')
      expect(html).toContain('<h2 id="articles">Selected Articles</h2>')
    })
  })

  describe('Additionals section', () => {
    test('additionals section not rendered when empty', async () => {
      writeXML(tempDir, `<?xml version="1.0" encoding="utf-8"?>
<product>
  <title>Test Game</title>
  <website>https://example.com</website>
  <description>Test</description>
  <credits><credit><person>Dev</person><role>Developer</role></credit></credits>
</product>`)
      await generator.generate(tempDir)
      const html = fs.readFileSync(path.join(buildDir, 'index.html'), 'utf-8')
      expect(html).not.toContain('<h2 id="links">Additional Links</h2>')
    })

    test('additionals section rendered when present', async () => {
      writeXML(tempDir, `<?xml version="1.0" encoding="utf-8"?>
<product>
  <title>Test Game</title>
  <website>https://example.com</website>
  <description>Test</description>
  <credits><credit><person>Dev</person><role>Developer</role></credit></credits>
  <additionals>
    <additional title="Website" description="Visit us" link="https://example.com"/>
  </additionals>
</product>`)
      await generator.generate(tempDir)
      const html = fs.readFileSync(path.join(buildDir, 'index.html'), 'utf-8')
      expect(html).toContain('<h2 id="links">Additional Links</h2>')
    })
  })

  describe('Team section', () => {
    test('credits section not rendered when empty', async () => {
      writeXML(tempDir, `<?xml version="1.0" encoding="utf-8"?>
<product>
  <title>Test Game</title>
  <website>https://example.com</website>
  <description>Test</description>
</product>`)
      await generator.generate(tempDir)
      const html = fs.readFileSync(path.join(buildDir, 'index.html'), 'utf-8')
      expect(html).not.toContain('<h2 id="credits">Test Game Credits</h2>')
    })

    test('contacts section not rendered when empty', async () => {
      writeXML(tempDir, `<?xml version="1.0" encoding="utf-8"?>
<product>
  <title>Test Game</title>
  <website>https://example.com</website>
  <description>Test</description>
  <credits><credit><person>Dev</person><role>Developer</role></credit></credits>
</product>`)
      await generator.generate(tempDir)
      const html = fs.readFileSync(path.join(buildDir, 'index.html'), 'utf-8')
      expect(html).not.toContain('<h2 id="contact">Contact</h2>')
    })
  })

  describe('Images section', () => {
    test('images section not rendered when no screenshots', async () => {
      writeXML(tempDir, `<?xml version="1.0" encoding="utf-8"?>
<product>
  <title>Test Game</title>
  <website>https://example.com</website>
  <description>Test</description>
  <credits><credit><person>Dev</person><role>Developer</role></credit></credits>
</product>`)
      await generator.generate(tempDir)
      const html = fs.readFileSync(path.join(buildDir, 'index.html'), 'utf-8')
      expect(html).not.toContain('<h2 id="images">Images</h2>')
    })
  })
})
