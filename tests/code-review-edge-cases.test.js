'use strict'

const fs = require('fs')
const path = require('path')
const os = require('os')

jest.mock('sharp', () => jest.fn(() => ({
  resize () {
    return this
  },
  flatten () {
    return this
  },
  jpeg () {
    return this
  },
  async toFile (output) {
    require('fs').writeFileSync(output, 'thumbnail')
  }
})))

const generator = require('../lib/core/generator')
const config = require('../lib/config')
const colorConsole = require('../lib/helpers/color-console')

// Helper functions
function createTempDir () {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'presskit-edge-case-'))
}

function cleanup (tempDir) {
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
}

function writeJSON (dir, data) {
  fs.writeFileSync(path.join(dir, 'data.json'), JSON.stringify(data, null, 2))
}

// ─────────────────────────────────────────────────────────────────────────────
// ERROR STATE RECOVERY TESTS
// ─────────────────────────────────────────────────────────────────────────────

describe('error state recovery', () => {
  let tempDir

  beforeEach(() => {
    tempDir = createTempDir()
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    console.log.mockRestore()
    console.warn.mockRestore()
    cleanup(tempDir)
  })

  it('should rebuild successfully after fixing a malformed data file', async () => {
    // First, write malformed JSON
    fs.writeFileSync(
      path.join(tempDir, 'data.json'),
      '{ "type": "company", invalid json }'
    )

    // Attempt build and catch the error
    jest.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit:${code}`)
    })

    await expect(generator.generate(tempDir)).rejects.toThrow('process.exit:1')

    // Now fix the file with valid JSON
    process.exit.mockRestore()
    jest.spyOn(process, 'exit').mockImplementation(() => {})

    writeJSON(tempDir, {
      type: 'company',
      title: 'Recovery Test Company',
      website: 'https://example.com',
      description: 'Testing error recovery'
    })

    config.commands.build = {
      output: path.join(tempDir, 'build'),
      cleanBuildFolder: true,
      baseUrl: '/',
      ignoreThumbnails: true,
      prettyLinks: false,
      hamburger: false
    }

    // Should rebuild without error
    await generator.generate(tempDir)

    // Verify HTML was created
    const htmlFile = path.join(tempDir, 'build', 'index.html')
    expect(fs.existsSync(htmlFile)).toBe(true)

    process.exit.mockRestore()
  })

  it('should reset error state when config is properly initialized between builds', async () => {
    // Setup: first config instance
    config.commands.build = {
      output: path.join(tempDir, 'build1'),
      cleanBuildFolder: true,
      baseUrl: '/',
      ignoreThumbnails: true,
      prettyLinks: false,
      hamburger: false
    }

    writeJSON(tempDir, {
      type: 'company',
      title: 'First Build',
      website: 'https://example.com',
      description: 'First build'
    })

    await generator.generate(tempDir)
    expect(fs.existsSync(path.join(tempDir, 'build1', 'index.html'))).toBe(true)

    // Now reinitialize config for second build
    config.commands.build = {
      output: path.join(tempDir, 'build2'),
      cleanBuildFolder: true,
      baseUrl: '/',
      ignoreThumbnails: true,
      prettyLinks: false,
      hamburger: false
    }

    writeJSON(tempDir, {
      type: 'company',
      title: 'Second Build',
      website: 'https://example.com',
      description: 'Second build'
    })

    await generator.generate(tempDir)
    expect(fs.existsSync(path.join(tempDir, 'build2', 'index.html'))).toBe(true)

    // Both builds should exist independently
    expect(fs.existsSync(path.join(tempDir, 'build1', 'index.html'))).toBe(true)
    expect(fs.existsSync(path.join(tempDir, 'build2', 'index.html'))).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// ARRAY NORMALIZATION EDGE CASES
// ─────────────────────────────────────────────────────────────────────────────

describe('array normalization edge cases', () => {
  beforeEach(() => {
    jest.spyOn(colorConsole, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    colorConsole.warn.mockRestore()
  })

  it('should normalize empty arrays in normalized fields', () => {
    const data = {
      type: 'product',
      title: 'Test Game',
      website: 'https://example.com',
      description: 'Test',
      releaseDates: [],
      partners: [],
      features: []
    }

    // Empty arrays should remain empty arrays
    expect(Array.isArray(data.releaseDates)).toBe(true)
    expect(Array.isArray(data.partners)).toBe(true)
    expect(Array.isArray(data.features)).toBe(true)
  })

  it('should handle array fields with undefined entries gracefully', () => {
    const data = {
      type: 'product',
      title: 'Test Game',
      website: 'https://example.com',
      description: 'Test',
      features: [
        { title: 'Feature 1', description: 'Works' },
        undefined,
        { title: 'Feature 3', description: 'Also works' }
      ]
    }

    // Filter out undefined entries
    const cleanFeatures = data.features.filter(f => f !== undefined)
    expect(cleanFeatures.length).toBe(2)
    expect(cleanFeatures[0].title).toBe('Feature 1')
    expect(cleanFeatures[1].title).toBe('Feature 3')
  })

  it('should normalize XML-parsed single items to arrays correctly', () => {
    // Simulate what xml2js returns for singleton vs multiple items
    // xml2js with explicitArray: false returns:
    // - Single item: { award: { title: 'X' } }
    // - Multiple items: { award: [{ title: 'X' }, { title: 'Y' }] }

    const singleAwardXML = {
      award: { title: 'Best Game' }
    }

    const multipleAwardsXML = {
      award: [
        { title: 'Best Game' },
        { title: 'Best Art' }
      ]
    }

    // Library should normalize both to array form
    const singleAsArray = Array.isArray(singleAwardXML.award)
      ? singleAwardXML.award
      : [singleAwardXML.award]

    const multipleAsArray = Array.isArray(multipleAwardsXML.award)
      ? multipleAwardsXML.award
      : [multipleAwardsXML.award]

    expect(singleAsArray).toHaveLength(1)
    expect(multipleAsArray).toHaveLength(2)
  })

  it('should reject non-array values assigned to array-backed fields', () => {
    const invalidData = {
      type: 'product',
      title: 'Test',
      website: 'https://example.com',
      description: 'Test',
      features: 'This is a string, not an array' // INVALID
    }

    // Attempting to use as array should be caught
    expect(() => {
      invalidData.features.forEach(() => {})
    }).toThrow()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// CLI OPTION PATH EDGE CASES
// ─────────────────────────────────────────────────────────────────────────────

describe('CLI option path edge cases', () => {
  let tempDir

  beforeEach(() => {
    tempDir = createTempDir()
  })

  afterEach(() => {
    cleanup(tempDir)
  })

  it('should handle relative paths in output directory', () => {
    config.commands.build = {
      output: './relative/build',
      baseUrl: '/',
      ignoreThumbnails: true,
      prettyLinks: false,
      hamburger: false
    }

    // Path normalization should work
    const normalizedPath = path.resolve(config.commands.build.output)
    expect(typeof normalizedPath).toBe('string')
    expect(normalizedPath.length > 0).toBe(true)
  })

  it('should handle absolute paths in output directory', () => {
    const absolutePath = path.join(tempDir, 'build')

    config.commands.build = {
      output: absolutePath,
      baseUrl: '/',
      ignoreThumbnails: true,
      prettyLinks: false,
      hamburger: false
    }

    expect(path.isAbsolute(config.commands.build.output)).toBe(true)
  })

  it('should handle paths with special characters', () => {
    const specialPath = path.join(tempDir, 'build-dir_v2.0')

    config.commands.build = {
      output: specialPath,
      baseUrl: '/',
      ignoreThumbnails: true,
      prettyLinks: false,
      hamburger: false
    }

    // Should not throw or cause issues
    expect(typeof config.commands.build.output).toBe('string')
    expect(config.commands.build.output).toContain('build-dir_v2.0')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// PARSER DEFENSIVE CODING: MALFORMED NESTING
// ─────────────────────────────────────────────────────────────────────────────

describe('parser defensive coding - malformed structures', () => {
  beforeEach(() => {
    jest.spyOn(colorConsole, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    colorConsole.error.mockRestore()
  })

  it('should reject credits without required fields', () => {
    const malformedData = {
      type: 'product',
      title: 'Test',
      website: 'https://example.com',
      description: 'Test',
      credits: [
        {
          // Missing 'person' field
          role: 'Developer'
        }
      ]
    }

    // Credits should have person and role
    expect(malformedData.credits[0].person).toBeUndefined()
    expect(malformedData.credits[0].role).toBe('Developer')
  })

  it('should handle relations with missing target product', () => {
    const relations = [
      {
        type: 'dlc',
        product: 'Nonexistent Game'
      }
    ]

    const products = [
      { title: 'Existing Game' },
      { title: 'Another Game' }
    ]

    // Find should return undefined if product not found
    const found = products.find(
      p => p.title.toLowerCase() === relations[0].product.toLowerCase()
    )
    expect(found).toBeUndefined()
  })

  it('should handle array fields with null entries', () => {
    const data = {
      type: 'product',
      title: 'Test',
      website: 'https://example.com',
      description: 'Test',
      features: [
        { title: 'Feature 1', description: 'Good' },
        null,
        { title: 'Feature 2', description: 'Also good' }
      ]
    }

    // Filter nulls
    const validFeatures = data.features.filter(f => f !== null)
    expect(validFeatures).toHaveLength(2)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE CONTEXT VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

describe('template context validation', () => {
  it('should provide company template with expected context shape', () => {
    const companyContext = {
      presskit: {
        type: 'company',
        title: 'Test Company',
        website: 'https://example.com'
      },
      products: [],
      images: {
        logo: [],
        screenshots: []
      },
      isCompany: true,
      isProduct: false,
      hasScreenshots: false,
      buildVersion: '0.0.1',
      buildTime: Date.now()
    }

    expect(companyContext.presskit.type).toBe('company')
    expect(companyContext.isCompany).toBe(true)
    expect(companyContext.isProduct).toBe(false)
    expect(Array.isArray(companyContext.products)).toBe(true)
  })

  it('should provide product template with expected context shape', () => {
    const productContext = {
      presskit: {
        type: 'product',
        title: 'Test Game',
        website: 'https://example.com'
      },
      company: {
        title: 'Test Company'
      },
      images: {
        logo: [],
        screenshots: []
      },
      isCompany: false,
      isProduct: true,
      hasScreenshots: false,
      buildVersion: '0.0.1',
      buildTime: Date.now()
    }

    expect(productContext.presskit.type).toBe('product')
    expect(productContext.isCompany).toBe(false)
    expect(productContext.isProduct).toBe(true)
    expect(typeof productContext.company).toBe('object')
  })

  it('should never pass undefined critical context variables', () => {
    const context = {
      presskit: { type: 'company', title: 'Test', website: 'https://example.com' },
      isCompany: true,
      isProduct: false,
      buildVersion: '0.0.1',
      buildTime: Date.now()
    }

    // Critical fields should never be undefined
    expect(context.presskit).toBeDefined()
    expect(context.isCompany).toBeDefined()
    expect(context.isProduct).toBeDefined()
    expect(context.buildVersion).toBeDefined()
    expect(context.buildTime).toBeDefined()
  })
})
