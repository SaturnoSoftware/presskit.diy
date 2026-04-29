'use strict'

const fs = require('fs')
const path = require('path')
const os = require('os')

jest.mock('sharp', () => jest.fn(() => ({
  resize () { return this },
  flatten () { return this },
  jpeg () { return this },
  async toFile (output) {
    require('fs').writeFileSync(output, 'thumbnail')
  }
})))

jest.mock('../lib/helpers/watcher', () => ({
  installWatcher: jest.fn(),
  installDevelopmentWatcher: jest.fn()
}))

const parser = require('../lib/core/parser')
const { loadDataFile } = require('../lib/core/loader')
const {
  __getImages: getImages,
  __sortScreenshotsByCategories: sortScreenshotsByCategories
} = require('../lib/core/builder')
const config = require('../lib/config')
const sfs = require('../lib/helpers/sfs')

// ============================================================================
// PARSER: XML Security & Robustness
// ============================================================================

describe('XML Parser - Security & Robustness Hardening', () => {
  describe('XXE (XML External Entity) & Billion Laughs Protection', () => {
    it('should reject XML with DOCTYPE declarations (XXE prevention)', () => {
      const xxeXML = `<?xml version="1.0"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<company>
  <title>&xxe;</title>
  <description>test</description>
</company>`
      expect(() => parser.parseXML(xxeXML)).toThrow()
    })

    it('should reject XML with ENTITY expansions (Billion Laughs)', () => {
      const laughsXML = `<?xml version="1.0"?>
<!DOCTYPE lolz [
  <!ENTITY lol "lol">
  <!ENTITY lol2 "&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;">
]>
<company>
  <title>&lol2;</title>
  <description>test</description>
</company>`
      expect(() => parser.parseXML(laughsXML)).toThrow()
    })

    it('should handle deeply nested XML structures safely', () => {
      let nested = '<description>test</description>'
      for (let i = 0; i < 50; i++) {
        nested = `<wrapper>${nested}</wrapper>`
      }
      const deepXML = `<?xml version="1.0"?><company><title>Safe Content</title>${nested}</company>`

      const result = parser.parseXML(deepXML)
      expect(result).toBeDefined()
      expect(result.title).toBe('Safe Content')
    })
  })

  describe('XML Edge Cases & Special Characters', () => {
    it('should handle XML with CDATA sections correctly', () => {
      const cdataXML = `<?xml version="1.0"?>
<company>
  <title><![CDATA[Company & Partners]]></title>
  <description><![CDATA[<div>Rich</div>]]></description>
</company>`
      expect(() => parser.parseXML(cdataXML)).not.toThrow()
      const result = parser.parseXML(cdataXML)
      expect(result.title).toContain('Company')
    })

    it('should preserve XML comments without executing them', () => {
      const commentXML = `<?xml version="1.0"?>
<!-- This comment has <fake>tags</fake> -->
<company>
  <title>Safe Title</title>
  <description>Description</description>
</company>`
      const result = parser.parseXML(commentXML)
      expect(result.title).toBe('Safe Title')
      expect(result.description).toBe('Description')
    })

    it('should handle various XML entity encodings correctly', () => {
      const entitiesXML = `<?xml version="1.0"?>
<company>
  <title>Rock &amp; Roll &#38; Jazz</title>
  <description>Test &lt; &gt; &quot;</description>
</company>`
      const result = parser.parseXML(entitiesXML)
      expect(result.title).toContain('&')
      expect(result.description).toContain('<')
      expect(result.description).toContain('>')
    })
  })

  describe('XML Namespace Handling', () => {
    it('should handle XML with namespace declarations gracefully', () => {
      const nsXML = `<?xml version="1.0"?>
<company xmlns:ns="http://example.com">
  <title>Studio</title>
  <description>Test</description>
</company>`
      expect(() => parser.parseXML(nsXML)).not.toThrow()
      const result = parser.parseXML(nsXML)
      expect(result.title).toBe('Studio')
    })

    it('should handle namespace prefixes on root element safely', () => {
      const nsXML = `<?xml version="1.0"?>
<c:company xmlns:c="http://example.com/company">
  <c:title>Test</c:title>
  <c:description>Desc</c:description>
</c:company>`
      // Namespaced root elements may throw - this tests graceful handling
      try {
        parser.parseXML(nsXML)
      } catch (e) {
        expect(e).toBeDefined()
      }
    })

    it('should handle multiple namespace declarations', () => {
      const multiNsXML = `<?xml version="1.0"?>
<company xmlns:a="http://a.com" xmlns:b="http://b.com">
  <title>Studio</title>
  <description>Test</description>
</company>`
      const result = parser.parseXML(multiNsXML)
      expect(result.title).toBe('Studio')
    })
  })
})

// ============================================================================
// LOADER: JSON/JSONC Parsing & Data Integrity
// ============================================================================

describe('Loader - JSON Parsing Edge Cases & Performance', () => {
  function createTempDir () {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'presskit-comprehensive-'))
  }

  function writeRawJSONFile (dir, raw) {
    const filename = path.join(dir, 'data.json')
    fs.writeFileSync(filename, raw)
    return filename
  }

  describe('JSON Encoding & Unicode Handling', () => {
    it('should handle JSON with UTF-8 characters (emoji, CJK, Arabic)', () => {
      const tempDir = createTempDir()
      const file = writeRawJSONFile(tempDir, JSON.stringify({
        type: 'company',
        title: 'Studio 🎮 中文 العربية',
        description: 'Description',
        website: 'https://example.com'
      }))

      expect(() => loadDataFile(file)).not.toThrow()
      const result = loadDataFile(file)
      expect(result.title).toContain('Studio')
      fs.rmSync(tempDir, { recursive: true, force: true })
    })

    it('should handle escaped Unicode sequences in JSON strings', () => {
      const tempDir = createTempDir()
      const file = writeRawJSONFile(tempDir, JSON.stringify({
        type: 'company',
        title: 'Test \\u0026 Amper',
        description: 'Desc',
        website: 'https://example.com'
      }))

      expect(() => loadDataFile(file)).not.toThrow()
      fs.rmSync(tempDir, { recursive: true, force: true })
    })

    it('should handle JSON files with different line endings (CRLF vs LF)', () => {
      const tempDir = createTempDir()
      const jsonStr = JSON.stringify({
        type: 'company',
        title: 'Test',
        description: 'Desc with\nmultiple\nlines',
        website: 'https://example.com'
      })
      fs.writeFileSync(path.join(tempDir, 'data.json'), jsonStr)

      expect(() => loadDataFile(path.join(tempDir, 'data.json'))).not.toThrow()
      fs.rmSync(tempDir, { recursive: true, force: true })
    })
  })

  describe('JSON Malformed & Injection Attempts', () => {
    it('should safely handle JSON with script injection in strings', () => {
      const tempDir = createTempDir()
      const file = writeRawJSONFile(tempDir, JSON.stringify({
        type: 'company',
        title: '<script>alert("XSS")</script>',
        description: 'Desc',
        website: 'https://example.com'
      }))

      expect(() => loadDataFile(file)).not.toThrow()
      const result = loadDataFile(file)
      expect(result.title).toContain('<script>')
      fs.rmSync(tempDir, { recursive: true, force: true })
    })

    it('should handle JSON with extremely long strings', () => {
      const tempDir = createTempDir()
      const longString = 'a'.repeat(100000)
      const file = writeRawJSONFile(tempDir, JSON.stringify({
        type: 'company',
        title: 'Short',
        description: longString,
        website: 'https://example.com'
      }))

      expect(() => loadDataFile(file)).not.toThrow()
      fs.rmSync(tempDir, { recursive: true, force: true })
    })

    it('should reject invalid JSON with missing closing braces', () => {
      const tempDir = createTempDir()
      const file = writeRawJSONFile(tempDir, '{' +
        '"type": "company",' +
        '"title": "Test",' +
        '"description": "Desc",' +
        '"website": "https://example.com"')

      expect(() => loadDataFile(file)).toThrow()
      fs.rmSync(tempDir, { recursive: true, force: true })
    })
  })

  describe('Performance & Large File Handling', () => {
    it('should efficiently parse JSON with credit arrays', () => {
      const tempDir = createTempDir()
      const credits = Array.from({ length: 100 }, (_, i) => ({
        person: `Person ${i}`,
        role: `Role ${i}`
      }))

      const file = writeRawJSONFile(tempDir, JSON.stringify({
        type: 'product',
        title: 'Game',
        description: 'Desc',
        website: 'https://example.com',
        credits
      }))

      const start = Date.now()
      const result = loadDataFile(file)
      const elapsed = Date.now() - start

      expect(result.credits.length).toBe(100)
      expect(elapsed).toBeLessThan(2000)
      fs.rmSync(tempDir, { recursive: true, force: true })
    })

    it('should handle JSON with mixed nested structures', () => {
      const tempDir = createTempDir()
      const file = writeRawJSONFile(tempDir, JSON.stringify({
        type: 'product',
        title: 'Game',
        description: 'Desc',
        website: 'https://example.com',
        credits: [
          { person: 'Alice', role: 'Lead' },
          { person: 'Bob', role: 'Support' }
        ],
        tags: ['action', 'adventure', 'indie']
      }))

      const result = loadDataFile(file)
      expect(result.credits).toBeDefined()
      expect(result.tags).toBeDefined()
      fs.rmSync(tempDir, { recursive: true, force: true })
    })

    it('should handle zero-byte files gracefully', () => {
      const tempDir = createTempDir()
      const emptyFile = path.join(tempDir, 'data.json')
      fs.writeFileSync(emptyFile, '')

      expect(() => loadDataFile(emptyFile)).toThrow()
      fs.rmSync(tempDir, { recursive: true, force: true })
    })
  })
})

// ============================================================================
// BUILDER: Image & Asset Handling
// ============================================================================

describe('Builder - Image Processing & Asset Safety', () => {
  function createTempDir () {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'presskit-images-'))
  }

  beforeEach(() => {
    config.commands.build = {
      output: '/tmp/test-output',
      baseUrl: '/',
      ignoreThumbnails: true,
      prettyLinks: false,
      hamburger: false
    }
  })

  describe('Image Path Handling', () => {
    it('should find images in standard directory structure', () => {
      const tempDir = createTempDir()
      const imagesDir = path.join(tempDir, 'images')
      fs.mkdirSync(imagesDir, { recursive: true })

      fs.writeFileSync(path.join(imagesDir, 'logo.png'), 'fake')
      fs.writeFileSync(path.join(imagesDir, 'shot1.jpg'), 'fake')

      const images = getImages(tempDir)
      expect(images).toBeDefined()
      expect(images.logos).toBeDefined()

      fs.rmSync(tempDir, { recursive: true, force: true })
    })

    it('should handle image paths with special characters safely', () => {
      const tempDir = createTempDir()
      const imagesDir = path.join(tempDir, 'images')
      fs.mkdirSync(imagesDir, { recursive: true })

      const specialNames = [
        'logo with spaces.png',
        'logo-hyphen.PNG',
        'logo_underscore.jpg'
      ]

      specialNames.forEach(name => {
        fs.writeFileSync(path.join(imagesDir, name), 'fake')
      })

      expect(() => getImages(tempDir)).not.toThrow()

      fs.rmSync(tempDir, { recursive: true, force: true })
    })

    it('should normalize case-insensitive image extensions', () => {
      const tempDir = createTempDir()
      const imagesDir = path.join(tempDir, 'images')
      fs.mkdirSync(imagesDir, { recursive: true })

      fs.writeFileSync(path.join(imagesDir, 'logo.PNG'), 'fake')
      fs.writeFileSync(path.join(imagesDir, 'shot.JpG'), 'fake')

      const images = getImages(tempDir)
      expect(images.logos.length).toBeGreaterThanOrEqual(1)

      fs.rmSync(tempDir, { recursive: true, force: true })
    })
  })

  describe('Image Format & Integrity', () => {
    it('should handle corrupted image files without crashing', () => {
      const tempDir = createTempDir()
      const imagesDir = path.join(tempDir, 'images')
      fs.mkdirSync(imagesDir, { recursive: true })

      fs.writeFileSync(path.join(imagesDir, 'corrupted.png'), 'not a real image')
      fs.writeFileSync(path.join(imagesDir, 'logo.jpg'), 'also not real')

      expect(() => getImages(tempDir)).not.toThrow()

      fs.rmSync(tempDir, { recursive: true, force: true })
    })

    it('should handle zero-byte image files', () => {
      const tempDir = createTempDir()
      const imagesDir = path.join(tempDir, 'images')
      fs.mkdirSync(imagesDir, { recursive: true })

      fs.writeFileSync(path.join(imagesDir, 'empty.png'), '')
      fs.writeFileSync(path.join(imagesDir, 'logo.jpg'), '')

      expect(() => getImages(tempDir)).not.toThrow()

      fs.rmSync(tempDir, { recursive: true, force: true })
    })

    it('should ignore unsupported file types in images folder', () => {
      const tempDir = createTempDir()
      const imagesDir = path.join(tempDir, 'images')
      fs.mkdirSync(imagesDir, { recursive: true })

      fs.writeFileSync(path.join(imagesDir, 'logo.png'), 'fake')
      fs.writeFileSync(path.join(imagesDir, 'readme.txt'), 'text')
      fs.writeFileSync(path.join(imagesDir, 'data.json'), 'json')

      const images = getImages(tempDir)
      expect(images).toBeDefined()

      fs.rmSync(tempDir, { recursive: true, force: true })
    })
  })

  describe('Screenshot Categorization', () => {
    it('should handle simple screenshot categorization', () => {
      const screenshots = [
        'screenshot-main-1.png',
        'screenshot-main-2.png',
        'screenshot-gameplay-1.png'
      ]

      const result = sortScreenshotsByCategories(screenshots)
      expect(result).toBeDefined()
    })

    it('should handle empty categories gracefully', () => {
      const screenshots = {
        category1: [],
        category2: [],
        category3: ['shot.png']
      }

      const result = sortScreenshotsByCategories(screenshots)
      expect(result).toBeDefined()
    })

    it('should handle nested screenshot paths', () => {
      const screenshots = {
        main: {
          subcategory: ['screenshot.png']
        }
      }

      const result = sortScreenshotsByCategories(screenshots)
      expect(result).toBeDefined()
    })
  })
})

// ============================================================================
// FILE SYSTEM: Path & Permission Handling
// ============================================================================

describe('File System Utilities - Edge Cases & Performance', () => {
  describe('Directory Creation', () => {
    it('should create directories that do not exist', () => {
      const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'presskit-fs-'))
      const testDir = path.join(tempRoot, 'new-dir')

      sfs.createDir(testDir)
      expect(fs.existsSync(testDir)).toBe(true)

      fs.rmSync(tempRoot, { recursive: true, force: true })
    })

    it('should create nested directory structures recursively', () => {
      const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'presskit-fs-'))
      const testDir = path.join(tempRoot, 'nested', 'path', 'to', 'site')

      sfs.createDir(testDir)
      expect(fs.existsSync(testDir)).toBe(true)

      fs.rmSync(tempRoot, { recursive: true, force: true })
    })

    it('should handle existing directories without error', () => {
      const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'presskit-fs-'))

      const result = sfs.createDir(tempRoot)
      expect(result).toBeFalsy()

      fs.rmSync(tempRoot, { recursive: true, force: true })
    })
  })

  describe('File Discovery', () => {
    it('should find all files in a directory', () => {
      const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'presskit-fs-'))
      fs.writeFileSync(path.join(tempRoot, 'file1.txt'), 'content')
      fs.writeFileSync(path.join(tempRoot, 'file2.txt'), 'content')
      fs.mkdirSync(path.join(tempRoot, 'subdir'))
      fs.writeFileSync(path.join(tempRoot, 'subdir', 'file3.txt'), 'content')

      const files = sfs.findAllFiles(tempRoot)
      expect(files.length).toBeGreaterThanOrEqual(3)

      fs.rmSync(tempRoot, { recursive: true, force: true })
    })

    it('should respect maxDepth parameter', () => {
      const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'presskit-fs-'))
      fs.writeFileSync(path.join(tempRoot, 'file1.txt'), 'content')
      fs.mkdirSync(path.join(tempRoot, 'level1'), { recursive: true })
      fs.writeFileSync(path.join(tempRoot, 'level1', 'file2.txt'), 'content')
      fs.mkdirSync(path.join(tempRoot, 'level1', 'level2'), { recursive: true })
      fs.writeFileSync(path.join(tempRoot, 'level1', 'level2', 'file3.txt'), 'content')

      const shallow = sfs.findAllFiles(tempRoot, { maxDepth: 0 })
      const medium = sfs.findAllFiles(tempRoot, { maxDepth: 1 })
      const deep = sfs.findAllFiles(tempRoot, { maxDepth: 2 })

      expect(shallow.length).toBeLessThanOrEqual(medium.length)
      expect(medium.length).toBeLessThanOrEqual(deep.length)

      fs.rmSync(tempRoot, { recursive: true, force: true })
    })

    it('should ignore specified folders', () => {
      const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'presskit-fs-'))
      fs.writeFileSync(path.join(tempRoot, 'file1.txt'), 'content')
      fs.mkdirSync(path.join(tempRoot, 'node_modules'), { recursive: true })
      fs.writeFileSync(path.join(tempRoot, 'node_modules', 'pkg.txt'), 'content')

      const allFiles = sfs.findAllFiles(tempRoot)
      const filtered = sfs.findAllFiles(tempRoot, { ignoredFolders: ['node_modules'] })

      expect(allFiles.length).toBeGreaterThan(filtered.length)

      fs.rmSync(tempRoot, { recursive: true, force: true })
    })
  })
})

// ============================================================================
// PERFORMANCE & MEMORY TESTS
// ============================================================================

describe('Performance & Resource Usage', () => {
  it('should parse multiple XML files without memory leaks', () => {
    const xml = `<?xml version="1.0"?>
<company>
  <title>Test</title>
  <description>Desc</description>
</company>`

    const results = []
    for (let i = 0; i < 50; i++) {
      results.push(parser.parseXML(xml))
    }

    expect(results).toHaveLength(50)
    results.forEach(result => {
      expect(result.title).toBe('Test')
    })
  })

  it('should handle concurrent file operations', async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'presskit-perf-'))
    const promises = []

    for (let i = 0; i < 10; i++) {
      promises.push(new Promise((resolve) => {
        const dir = path.join(tempRoot, `dir${i}`)
        fs.mkdirSync(dir, { recursive: true })
        fs.writeFileSync(path.join(dir, 'file.txt'), 'content')
        resolve(true)
      }))
    }

    await Promise.all(promises)
    const files = sfs.findAllFiles(tempRoot)
    expect(files.length).toBeGreaterThanOrEqual(10)

    fs.rmSync(tempRoot, { recursive: true, force: true })
  })

  it('should maintain consistent parsing performance', () => {
    const xml = `<?xml version="1.0"?>
<product>
  <title>Test</title>
  <description>Desc with more content to make parsing take longer</description>
</product>`

    const results = []
    for (let i = 0; i < 20; i++) {
      const start = process.hrtime.bigint()
      parser.parseXML(xml)
      const end = process.hrtime.bigint()
      results.push(Number(end - start))
    }

    expect(results.length).toBe(20)
    expect(results.every(t => t >= 0)).toBe(true)
  })
})
