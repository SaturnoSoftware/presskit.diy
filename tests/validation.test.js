/**
 * Input Validation Tests
 *
 * Tests for:
 * - Data validation rules
 * - Type checking
 * - Constraint enforcement
 * - Boundary conditions
 */

const fs = require('fs-extra')
const path = require('path')
const os = require('os')
const { loadDataFile } = require('../lib/core/loader')

describe('Input Validation', () => {
  let tempDir

  beforeEach(() => {
    tempDir = path.join(os.tmpdir(), `presskit-validation-test-${Date.now()}`)
    fs.ensureDirSync(tempDir)
  })

  afterEach(() => {
    fs.removeSync(tempDir)
  })

  describe('Required Field Validation', () => {
    it('should reject company without type', () => {
      const data = { title: 'Test' }
      fs.writeFileSync(path.join(tempDir, 'data.json'), JSON.stringify(data))

      expect(() => {
        loadDataFile(path.join(tempDir, 'data.json'))
      }).toThrow(/type/)
    })

    it('should reject company without title', () => {
      const data = { type: 'company' }
      fs.writeFileSync(path.join(tempDir, 'data.json'), JSON.stringify(data))

      expect(() => {
        loadDataFile(path.join(tempDir, 'data.json'))
      }).toThrow(/title/)
    })

    it('should reject product without type', () => {
      const data = { title: 'Test' }
      fs.writeFileSync(path.join(tempDir, 'data.json'), JSON.stringify(data))

      expect(() => {
        loadDataFile(path.join(tempDir, 'data.json'))
      }).toThrow(/type/)
    })

    it('should reject product without title', () => {
      const data = { type: 'product' }
      fs.writeFileSync(path.join(tempDir, 'data.json'), JSON.stringify(data))

      expect(() => {
        loadDataFile(path.join(tempDir, 'data.json'))
      }).toThrow(/title/)
    })

    it('should accept company with only required fields', () => {
      const data = {
        type: 'company',
        title: 'Test Company'
      }
      fs.writeFileSync(path.join(tempDir, 'data.json'), JSON.stringify(data))

      const parsed = loadDataFile(path.join(tempDir, 'data.json'))
      expect(parsed.type).toBe('company')
      expect(parsed.title).toBe('Test Company')
    })

    it('should accept product with only required fields', () => {
      const data = {
        type: 'product',
        title: 'Test Product'
      }
      fs.writeFileSync(path.join(tempDir, 'data.json'), JSON.stringify(data))

      const parsed = loadDataFile(path.join(tempDir, 'data.json'))
      expect(parsed.type).toBe('product')
      expect(parsed.title).toBe('Test Product')
    })
  })

  describe('Type Validation', () => {
    it('should reject non-string type', () => {
      const data = { type: 123, title: 'Test' }
      fs.writeFileSync(path.join(tempDir, 'data.json'), JSON.stringify(data))

      expect(() => {
        loadDataFile(path.join(tempDir, 'data.json'))
      }).toThrow()
    })

    it('should reject non-string title', () => {
      const data = { type: 'company', title: 123 }
      fs.writeFileSync(path.join(tempDir, 'data.json'), JSON.stringify(data))

      expect(() => {
        loadDataFile(path.join(tempDir, 'data.json'))
      }).toThrow()
    })

    it('should handle website URL as string gracefully', () => {
      const data = {
        type: 'company',
        title: 'Test',
        website: 'https://example.com'
      }
      fs.writeFileSync(path.join(tempDir, 'data.json'), JSON.stringify(data))

      const parsed = loadDataFile(path.join(tempDir, 'data.json'))
      expect(parsed.website).toBe('https://example.com')
    })

    it('should reject non-array for socials', () => {
      const data = {
        type: 'company',
        title: 'Test',
        socials: { name: 'Twitter', link: 'https://example.com' }
      }
      fs.writeFileSync(path.join(tempDir, 'data.json'), JSON.stringify(data))

      expect(() => {
        loadDataFile(path.join(tempDir, 'data.json'))
      }).toThrow(/must be an array/)
    })

    it('should reject non-array for platforms', () => {
      const data = {
        type: 'product',
        title: 'Test',
        platforms: { name: 'Windows' }
      }
      fs.writeFileSync(path.join(tempDir, 'data.json'), JSON.stringify(data))

      expect(() => {
        loadDataFile(path.join(tempDir, 'data.json'))
      }).toThrow(/must be an array/)
    })
  })

  describe('Enum Validation', () => {
    it('should reject invalid type value', () => {
      const data = {
        type: 'invalid-type',
        title: 'Test'
      }
      fs.writeFileSync(path.join(tempDir, 'data.json'), JSON.stringify(data))

      expect(() => {
        loadDataFile(path.join(tempDir, 'data.json'))
      }).toThrow()
    })

    it('should accept "company" type', () => {
      const data = { type: 'company', title: 'Test' }
      fs.writeFileSync(path.join(tempDir, 'data.json'), JSON.stringify(data))

      const parsed = loadDataFile(path.join(tempDir, 'data.json'))
      expect(parsed.type).toBe('company')
    })

    it('should accept "product" type', () => {
      const data = { type: 'product', title: 'Test' }
      fs.writeFileSync(path.join(tempDir, 'data.json'), JSON.stringify(data))

      const parsed = loadDataFile(path.join(tempDir, 'data.json'))
      expect(parsed.type).toBe('product')
    })

    it('should reject type with wrong case', () => {
      const data = { type: 'Company', title: 'Test' }
      fs.writeFileSync(path.join(tempDir, 'data.json'), JSON.stringify(data))

      expect(() => {
        loadDataFile(path.join(tempDir, 'data.json'))
      }).toThrow()
    })
  })

  describe('Array Element Validation', () => {
    it('should accept socials item without name (data lenient)', () => {
      const data = {
        type: 'company',
        title: 'Test',
        socials: [{ link: 'https://example.com' }]
      }
      fs.writeFileSync(path.join(tempDir, 'data.json'), JSON.stringify(data))

      const parsed = loadDataFile(path.join(tempDir, 'data.json'))
      expect(parsed.socials).toBeDefined()
    })

    it('should accept socials item without link (data lenient)', () => {
      const data = {
        type: 'company',
        title: 'Test',
        socials: [{ name: 'Website' }]
      }
      fs.writeFileSync(path.join(tempDir, 'data.json'), JSON.stringify(data))

      const parsed = loadDataFile(path.join(tempDir, 'data.json'))
      expect(parsed.socials).toBeDefined()
    })

    it('should accept valid socials item', () => {
      const data = {
        type: 'company',
        title: 'Test',
        socials: [{ name: 'Website', link: 'https://example.com' }]
      }
      fs.writeFileSync(path.join(tempDir, 'data.json'), JSON.stringify(data))

      const parsed = loadDataFile(path.join(tempDir, 'data.json'))
      expect(parsed.socials.length).toBe(1)
      expect(parsed.socials[0].name).toBe('Website')
    })

    it('should accept credits item without person (data lenient)', () => {
      const data = {
        type: 'company',
        title: 'Test',
        credits: [{ role: 'Developer' }]
      }
      fs.writeFileSync(path.join(tempDir, 'data.json'), JSON.stringify(data))

      const parsed = loadDataFile(path.join(tempDir, 'data.json'))
      expect(parsed.credits).toBeDefined()
    })

    it('should accept credits item without role (data lenient)', () => {
      const data = {
        type: 'company',
        title: 'Test',
        credits: [{ person: 'John Doe' }]
      }
      fs.writeFileSync(path.join(tempDir, 'data.json'), JSON.stringify(data))

      const parsed = loadDataFile(path.join(tempDir, 'data.json'))
      expect(parsed.credits).toBeDefined()
    })

    it('should accept valid credits item', () => {
      const data = {
        type: 'company',
        title: 'Test',
        credits: [{ person: 'John Doe', role: 'Developer' }]
      }
      fs.writeFileSync(path.join(tempDir, 'data.json'), JSON.stringify(data))

      const parsed = loadDataFile(path.join(tempDir, 'data.json'))
      expect(parsed.credits.length).toBe(1)
    })

    it('should handle multiple array items', () => {
      const data = {
        type: 'company',
        title: 'Test',
        socials: [
          { name: 'Website', link: 'https://example.com' },
          { name: 'Twitter', link: 'https://twitter.com' },
          { name: 'GitHub', link: 'https://github.com' }
        ]
      }
      fs.writeFileSync(path.join(tempDir, 'data.json'), JSON.stringify(data))

      const parsed = loadDataFile(path.join(tempDir, 'data.json'))
      expect(parsed.socials.length).toBe(3)
    })

    it('should handle mixed valid/invalid array elements', () => {
      const data = {
        type: 'company',
        title: 'Test',
        socials: [
          'invalid-string',
          { name: 'Valid', link: 'https://example.com' }
        ]
      }
      fs.writeFileSync(path.join(tempDir, 'data.json'), JSON.stringify(data))

      const parsed = loadDataFile(path.join(tempDir, 'data.json'))
      expect(parsed.socials).toBeDefined()
    })
  })

  describe('Nested Object Validation', () => {
    it('should accept address object with lines', () => {
      const data = {
        type: 'company',
        title: 'Test',
        address: {
          line: ['Line 1', 'Line 2']
        }
      }
      fs.writeFileSync(path.join(tempDir, 'data.json'), JSON.stringify(data))

      const parsed = loadDataFile(path.join(tempDir, 'data.json'))
      expect(parsed.address.line.length).toBe(2)
    })

    it('should reject address with non-array lines', () => {
      const data = {
        type: 'company',
        title: 'Test',
        address: {
          line: 'should-be-array'
        }
      }
      fs.writeFileSync(path.join(tempDir, 'data.json'), JSON.stringify(data))

      expect(() => {
        loadDataFile(path.join(tempDir, 'data.json'))
      }).toThrow()
    })

    it('should accept description as string', () => {
      const data = {
        type: 'company',
        title: 'Test',
        description: 'Company description'
      }
      fs.writeFileSync(path.join(tempDir, 'data.json'), JSON.stringify(data))

      const parsed = loadDataFile(path.join(tempDir, 'data.json'))
      expect(typeof parsed.description).toBe('string')
    })

    it('should accept description with markdownFile', () => {
      const descFile = path.join(tempDir, 'desc.md')
      fs.writeFileSync(descFile, '# Description\n\nThis is a test.')

      const data = {
        type: 'company',
        title: 'Test',
        description: { markdownFile: 'desc.md' }
      }
      fs.writeFileSync(path.join(tempDir, 'data.json'), JSON.stringify(data))

      const parsed = loadDataFile(path.join(tempDir, 'data.json'))
      expect(parsed.description).toBeDefined()
    })
  })

  describe('String Length Validation', () => {
    it('should accept empty string for optional fields', () => {
      const data = {
        type: 'company',
        title: 'Test',
        website: '',
        phone: ''
      }
      fs.writeFileSync(path.join(tempDir, 'data.json'), JSON.stringify(data))

      const parsed = loadDataFile(path.join(tempDir, 'data.json'))
      expect(parsed.website).toBe('')
    })

    it('should accept very long titles', () => {
      const longTitle = 'A'.repeat(500)
      const data = {
        type: 'company',
        title: longTitle
      }
      fs.writeFileSync(path.join(tempDir, 'data.json'), JSON.stringify(data))

      const parsed = loadDataFile(path.join(tempDir, 'data.json'))
      expect(parsed.title.length).toBe(500)
    })

    it('should accept single character title', () => {
      const data = {
        type: 'company',
        title: 'A'
      }
      fs.writeFileSync(path.join(tempDir, 'data.json'), JSON.stringify(data))

      const parsed = loadDataFile(path.join(tempDir, 'data.json'))
      expect(parsed.title).toBe('A')
    })
  })

  describe('Special Character Validation', () => {
    it('should accept HTML special characters in strings', () => {
      const data = {
        type: 'company',
        title: 'Test & Co. <Inc>'
      }
      fs.writeFileSync(path.join(tempDir, 'data.json'), JSON.stringify(data))

      const parsed = loadDataFile(path.join(tempDir, 'data.json'))
      expect(parsed.title).toBe('Test & Co. <Inc>')
    })

    it('should accept quotes in strings', () => {
      const data = {
        type: 'company',
        title: 'Company "The Best" Studios'
      }
      fs.writeFileSync(path.join(tempDir, 'data.json'), JSON.stringify(data))

      const parsed = loadDataFile(path.join(tempDir, 'data.json'))
      expect(parsed.title).toContain('"')
    })

    it('should accept backslashes in strings', () => {
      const data = {
        type: 'company',
        title: 'Company\\Division\\Studios'
      }
      fs.writeFileSync(path.join(tempDir, 'data.json'), JSON.stringify(data))

      const parsed = loadDataFile(path.join(tempDir, 'data.json'))
      expect(parsed.title).toContain('\\')
    })

    it('should accept newlines in strings', () => {
      const data = {
        type: 'company',
        title: 'Company\nName'
      }
      fs.writeFileSync(path.join(tempDir, 'data.json'), JSON.stringify(data))

      const parsed = loadDataFile(path.join(tempDir, 'data.json'))
      expect(parsed.title).toContain('\n')
    })

    it('should accept unicode characters in strings', () => {
      const data = {
        type: 'company',
        title: 'Société Française 日本語中文'
      }
      fs.writeFileSync(path.join(tempDir, 'data.json'), JSON.stringify(data))

      const parsed = loadDataFile(path.join(tempDir, 'data.json'))
      expect(parsed.title).toContain('日本語')
    })

    it('should accept emoji in strings', () => {
      const data = {
        type: 'company',
        title: 'Game Studios 🎮🎯'
      }
      fs.writeFileSync(path.join(tempDir, 'data.json'), JSON.stringify(data))

      const parsed = loadDataFile(path.join(tempDir, 'data.json'))
      expect(parsed.title).toContain('🎮')
    })
  })

  describe('Null and Undefined Handling', () => {
    it('should accept null for optional fields', () => {
      const data = {
        type: 'company',
        title: 'Test',
        website: null,
        phone: null
      }
      fs.writeFileSync(path.join(tempDir, 'data.json'), JSON.stringify(data))

      const parsed = loadDataFile(path.join(tempDir, 'data.json'))
      expect(parsed).toBeDefined()
    })

    it('should reject null for required title', () => {
      const data = {
        type: 'company',
        title: null
      }
      fs.writeFileSync(path.join(tempDir, 'data.json'), JSON.stringify(data))

      expect(() => {
        loadDataFile(path.join(tempDir, 'data.json'))
      }).toThrow()
    })

    it('should handle missing optional fields gracefully', () => {
      const data = {
        type: 'company',
        title: 'Test'
        // No socials, website, phone, etc.
      }
      fs.writeFileSync(path.join(tempDir, 'data.json'), JSON.stringify(data))

      const parsed = loadDataFile(path.join(tempDir, 'data.json'))
      expect(parsed.socials).toBeUndefined()
    })
  })

  describe('Empty Collections', () => {
    it('should accept empty socials array', () => {
      const data = {
        type: 'company',
        title: 'Test',
        socials: []
      }
      fs.writeFileSync(path.join(tempDir, 'data.json'), JSON.stringify(data))

      const parsed = loadDataFile(path.join(tempDir, 'data.json'))
      expect(Array.isArray(parsed.socials)).toBe(true)
      expect(parsed.socials.length).toBe(0)
    })

    it('should accept empty credits array', () => {
      const data = {
        type: 'company',
        title: 'Test',
        credits: []
      }
      fs.writeFileSync(path.join(tempDir, 'data.json'), JSON.stringify(data))

      const parsed = loadDataFile(path.join(tempDir, 'data.json'))
      expect(Array.isArray(parsed.credits)).toBe(true)
      expect(parsed.credits.length).toBe(0)
    })

    it('should accept empty address lines array', () => {
      const data = {
        type: 'company',
        title: 'Test',
        address: { line: [] }
      }
      fs.writeFileSync(path.join(tempDir, 'data.json'), JSON.stringify(data))

      const parsed = loadDataFile(path.join(tempDir, 'data.json'))
      expect(parsed.address.line.length).toBe(0)
    })
  })
})
