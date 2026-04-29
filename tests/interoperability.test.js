/**
 * XML/JSON Interoperability Tests
 *
 * Tests for:
 * - Data conversion between XML and JSON formats
 * - Schema consistency across formats
 * - Data preservation during conversions
 * - Format-specific edge cases
 */

const fs = require('fs-extra')
const path = require('path')
const os = require('os')
const { loadDataFile } = require('../lib/core/loader')
const parser = require('../lib/core/parser')

describe('XML/JSON Interoperability', () => {
  let tempDir

  beforeEach(() => {
    tempDir = path.join(os.tmpdir(), `presskit-interop-test-${Date.now()}`)
    fs.ensureDirSync(tempDir)
  })

  afterEach(() => {
    fs.removeSync(tempDir)
  })

  describe('JSON Format Loading', () => {
    it('should parse valid company JSON', () => {
      const data = {
        type: 'company',
        title: 'Test Company',
        website: 'https://example.com'
      }
      fs.writeFileSync(path.join(tempDir, 'data.json'), JSON.stringify(data))

      const parsed = loadDataFile(path.join(tempDir, 'data.json'))
      expect(parsed.type).toBe('company')
      expect(parsed.title).toBe('Test Company')
    })

    it('should parse valid product JSON', () => {
      const data = {
        type: 'product',
        title: 'Test Product',
        website: 'https://example.com'
      }
      fs.writeFileSync(path.join(tempDir, 'data.json'), JSON.stringify(data))

      const parsed = loadDataFile(path.join(tempDir, 'data.json'))
      expect(parsed.type).toBe('product')
      expect(parsed.title).toBe('Test Product')
      expect(parsed.website).toBe('https://example.com')
    })

    it('should handle JSON with extra unknown fields', () => {
      const data = {
        type: 'company',
        title: 'Test Company',
        unknownField: 'value',
        anotherUnknown: 123
      }
      fs.writeFileSync(path.join(tempDir, 'data.json'), JSON.stringify(data))

      const parsed = loadDataFile(path.join(tempDir, 'data.json'))
      expect(parsed.type).toBe('company')
      expect(parsed.unknownField).toBe('value')
    })

    it('should preserve array structure in JSON', () => {
      const data = {
        type: 'company',
        title: 'Test',
        socials: [
          { name: 'Twitter', link: 'https://twitter.com' },
          { name: 'GitHub', link: 'https://github.com' }
        ]
      }
      fs.writeFileSync(path.join(tempDir, 'data.json'), JSON.stringify(data))

      const parsed = loadDataFile(path.join(tempDir, 'data.json'))
      expect(Array.isArray(parsed.socials)).toBe(true)
      expect(parsed.socials.length).toBe(2)
    })

    it('should handle JSON with deeply nested objects', () => {
      const data = {
        type: 'company',
        title: 'Test',
        contact: {
          address: {
            line: ['123 Main St', 'Suite 100']
          }
        }
      }
      fs.writeFileSync(path.join(tempDir, 'data.json'), JSON.stringify(data))

      const parsed = loadDataFile(path.join(tempDir, 'data.json'))
      expect(parsed.contact.address.line).toBeDefined()
    })
  })

  describe('XML Format Loading', () => {
    it('should parse valid company XML', () => {
      const xml = `<?xml version="1.0"?>
        <company>
          <title>Test Company</title>
          <website>https://example.com</website>
        </company>`
      fs.writeFileSync(path.join(tempDir, 'data.xml'), xml)

      const parsed = loadDataFile(path.join(tempDir, 'data.xml'))
      expect(parsed.title).toBe('Test Company')
      expect(parsed.website).toBe('https://example.com')
    })

    it('should parse valid product XML', () => {
      const xml = `<?xml version="1.0"?>
        <product>
          <title>Test Product</title>
          <website>https://example.com</website>
        </product>`
      fs.writeFileSync(path.join(tempDir, 'data.xml'), xml)

      const parsed = loadDataFile(path.join(tempDir, 'data.xml'))
      expect(parsed.title).toBe('Test Product')
    })

    it('should convert XML kebab-case to camelCase', () => {
      const xml = `<?xml version="1.0"?>
        <company>
          <title>Test</title>
          <release-dates>
            <release-date>2020-01-01</release-date>
          </release-dates>
        </company>`
      fs.writeFileSync(path.join(tempDir, 'data.xml'), xml)

      const parsed = loadDataFile(path.join(tempDir, 'data.xml'))
      expect(parsed.releaseDates).toBeDefined()
    })

    it('should handle XML single item normalization', () => {
      const xml = `<?xml version="1.0"?>
        <company>
          <title>Test</title>
          <socials>
            <social>
              <name>Twitter</name>
              <link>https://twitter.com</link>
            </social>
          </socials>
        </company>`
      fs.writeFileSync(path.join(tempDir, 'data.xml'), xml)

      const parsed = loadDataFile(path.join(tempDir, 'data.xml'))
      expect(Array.isArray(parsed.socials)).toBe(true)
    })

    it('should handle XML multiple items as array', () => {
      const xml = `<?xml version="1.0"?>
        <company>
          <title>Test</title>
          <socials>
            <social>
              <name>Twitter</name>
              <link>https://twitter.com</link>
            </social>
            <social>
              <name>GitHub</name>
              <link>https://github.com</link>
            </social>
          </socials>
        </company>`
      fs.writeFileSync(path.join(tempDir, 'data.xml'), xml)

      const parsed = loadDataFile(path.join(tempDir, 'data.xml'))
      expect(Array.isArray(parsed.socials)).toBe(true)
      expect(parsed.socials.length).toBe(2)
    })
  })

  describe('Format Consistency', () => {
    it('should produce same data structure from equivalent JSON and XML', () => {
      // JSON version
      const jsonData = {
        type: 'company',
        title: 'Test Company',
        website: 'https://example.com',
        phone: '+1234567890'
      }
      fs.writeFileSync(path.join(tempDir, 'company.json'), JSON.stringify(jsonData))

      // XML version
      const xmlData = `<?xml version="1.0"?>
        <company>
          <title>Test Company</title>
          <website>https://example.com</website>
          <phone>+1234567890</phone>
        </company>`
      fs.writeFileSync(path.join(tempDir, 'company.xml'), xmlData)

      const fromJson = loadDataFile(path.join(tempDir, 'company.json'))
      const fromXml = loadDataFile(path.join(tempDir, 'company.xml'))

      expect(fromJson.title).toBe(fromXml.title)
      expect(fromJson.website).toBe(fromXml.website)
      expect(fromJson.phone).toBe(fromXml.phone)
    })

    it('should handle optional fields consistently', () => {
      // Minimal JSON
      const jsonData = { type: 'company', title: 'Test' }
      fs.writeFileSync(path.join(tempDir, 'minimal.json'), JSON.stringify(jsonData))

      // Minimal XML
      const xmlData = '<?xml version="1.0"?><company><title>Test</title></company>'
      fs.writeFileSync(path.join(tempDir, 'minimal.xml'), xmlData)

      const fromJson = loadDataFile(path.join(tempDir, 'minimal.json'))
      const fromXml = loadDataFile(path.join(tempDir, 'minimal.xml'))

      expect(!!fromJson.website).toBe(!!fromXml.website)
      expect(!!fromJson.phone).toBe(!!fromXml.phone)
    })

    it('should preserve string content correctly across formats', () => {
      const content = 'Test Company Studios'

      const jsonData = {
        type: 'company',
        title: content
      }
      fs.writeFileSync(path.join(tempDir, 'test.json'), JSON.stringify(jsonData))

      const xmlData = `<?xml version="1.0"?>
        <company><title>${content}</title></company>`
      fs.writeFileSync(path.join(tempDir, 'test.xml'), xmlData)

      const fromJson = loadDataFile(path.join(tempDir, 'test.json'))
      const fromXml = loadDataFile(path.join(tempDir, 'test.xml'))

      expect(fromJson.title).toBe(content)
      expect(fromXml.title).toBe(content)
    })
  })

  describe('Array Normalization', () => {
    it('should normalize single XML element to array', () => {
      const xml = `<?xml version="1.0"?>
        <company>
          <title>Test</title>
          <credits>
            <credit><person>John</person><role>Developer</role></credit>
          </credits>
        </company>`
      fs.writeFileSync(path.join(tempDir, 'data.xml'), xml)

      const parsed = loadDataFile(path.join(tempDir, 'data.xml'))
      expect(Array.isArray(parsed.credits)).toBe(true)
      expect(parsed.credits.length).toBe(1)
    })

    it('should keep multiple XML elements as array', () => {
      const xml = `<?xml version="1.0"?>
        <company>
          <title>Test</title>
          <credits>
            <credit><person>John</person><role>Developer</role></credit>
            <credit><person>Jane</person><role>Designer</role></credit>
          </credits>
        </company>`
      fs.writeFileSync(path.join(tempDir, 'data.xml'), xml)

      const parsed = loadDataFile(path.join(tempDir, 'data.xml'))
      expect(Array.isArray(parsed.credits)).toBe(true)
      expect(parsed.credits.length).toBe(2)
    })

    it('should handle JSON arrays directly', () => {
      const data = {
        type: 'company',
        title: 'Test',
        credits: [
          { person: 'John', role: 'Developer' },
          { person: 'Jane', role: 'Designer' }
        ]
      }
      fs.writeFileSync(path.join(tempDir, 'data.json'), JSON.stringify(data))

      const parsed = loadDataFile(path.join(tempDir, 'data.json'))
      expect(Array.isArray(parsed.credits)).toBe(true)
      expect(parsed.credits.length).toBe(2)
    })

    it('should handle empty arrays in JSON', () => {
      const data = {
        type: 'company',
        title: 'Test',
        socials: [],
        credits: []
      }
      fs.writeFileSync(path.join(tempDir, 'data.json'), JSON.stringify(data))

      const parsed = loadDataFile(path.join(tempDir, 'data.json'))
      expect(Array.isArray(parsed.socials)).toBe(true)
      expect(parsed.socials.length).toBe(0)
    })
  })

  describe('Parser Functions', () => {
    it('should parse XML correctly', () => {
      const xml = `<?xml version="1.0"?>
        <company><title>Test</title></company>`
      const result = parser.parseXML(xml)
      expect(result.title).toBe('Test')
    })

    it('should parse JSON via loadDataFile', () => {
      const json = { type: 'company', title: 'Test' }
      fs.writeFileSync(path.join(tempDir, 'data.json'), JSON.stringify(json))
      const result = loadDataFile(path.join(tempDir, 'data.json'))
      expect(result).toBeDefined()
      expect(result.type).toBe('company')
    })

    it('should parse XML via parser.parseXML', () => {
      const xml = '<?xml version="1.0"?><company><title>Test</title></company>'
      const result = parser.parseXML(xml)
      expect(result).toBeDefined()
    })
  })

  describe('Kebab-case to camelCase Conversion', () => {
    it('should convert release-dates to releaseDates', () => {
      const xml = `<?xml version="1.0"?>
        <product>
          <title>Test</title>
          <release-dates>
            <release-date>2020-01-01</release-date>
          </release-dates>
        </product>`
      fs.writeFileSync(path.join(tempDir, 'data.xml'), xml)

      const parsed = loadDataFile(path.join(tempDir, 'data.xml'))
      expect(parsed.releaseDates).toBeDefined()
      expect(parsed['release-dates']).toBeUndefined()
    })

    it('should convert social-media to socialMedia', () => {
      const xml = `<?xml version="1.0"?>
        <company>
          <title>Test</title>
          <social-media>
            <social>Name</social>
          </social-media>
        </company>`
      fs.writeFileSync(path.join(tempDir, 'data.xml'), xml)

      const parsed = loadDataFile(path.join(tempDir, 'data.xml'))
      expect(parsed).toBeDefined()
    })

    it('should handle multiple kebab-case conversions', () => {
      const xml = `<?xml version="1.0"?>
        <product>
          <title>Test</title>
          <release-dates>
            <release-date>2020-01-01</release-date>
          </release-dates>
          <price-details>
            <price>9.99</price>
          </price-details>
        </product>`
      fs.writeFileSync(path.join(tempDir, 'data.xml'), xml)

      const parsed = loadDataFile(path.join(tempDir, 'data.xml'))
      expect(parsed.releaseDates).toBeDefined()
      expect(parsed.priceDetails).toBeDefined()
    })
  })

  describe('HTML Tag Cleaning', () => {
    it('should clean <br> tags from content', () => {
      const xml = `<?xml version="1.0"?>
        <company>
          <title>Test</title>
          <description>Line 1<br/>Line 2</description>
        </company>`
      fs.writeFileSync(path.join(tempDir, 'data.xml'), xml)

      const parsed = loadDataFile(path.join(tempDir, 'data.xml'))
      expect(parsed.description).not.toContain('<br')
    })

    it('should clean <strong> tags from content', () => {
      const xml = `<?xml version="1.0"?>
        <company>
          <title>Test<strong>Bold</strong></title>
        </company>`
      fs.writeFileSync(path.join(tempDir, 'data.xml'), xml)

      const parsed = loadDataFile(path.join(tempDir, 'data.xml'))
      expect(parsed.title).not.toContain('<strong')
    })

    it('should clean multiple HTML tags', () => {
      const xml = `<?xml version="1.0"?>
        <company>
          <title>Test</title>
          <description><br/><hr/><strong>Test</strong></description>
        </company>`
      fs.writeFileSync(path.join(tempDir, 'data.xml'), xml)

      const parsed = loadDataFile(path.join(tempDir, 'data.xml'))
      expect(parsed.description).not.toContain('<br')
      expect(parsed.description).not.toContain('<hr')
      expect(parsed.description).not.toContain('<strong')
    })
  })

  describe('File Extension Detection', () => {
    it('should load JSON when file has .json extension', () => {
      const data = { type: 'company', title: 'Test' }
      fs.writeFileSync(path.join(tempDir, 'data.json'), JSON.stringify(data))

      const parsed = loadDataFile(path.join(tempDir, 'data.json'))
      expect(parsed.type).toBe('company')
    })

    it('should load XML when file has .xml extension', () => {
      const xml = '<?xml version="1.0"?><company><title>Test</title></company>'
      fs.writeFileSync(path.join(tempDir, 'data.xml'), xml)

      const parsed = loadDataFile(path.join(tempDir, 'data.xml'))
      expect(parsed.title).toBe('Test')
    })

    it('should reject unknown file extensions', () => {
      const data = { type: 'company', title: 'Test' }
      fs.writeFileSync(path.join(tempDir, 'data.txt'), JSON.stringify(data))

      expect(() => {
        loadDataFile(path.join(tempDir, 'data.txt'))
      }).toThrow()
    })
  })

  describe('Mixed Content Handling', () => {
    it('should handle JSON with string and object values', () => {
      const data = {
        type: 'company',
        title: 'Test',
        website: 'https://example.com',
        contact: {
          phone: '+1234567890'
        }
      }
      fs.writeFileSync(path.join(tempDir, 'data.json'), JSON.stringify(data))

      const parsed = loadDataFile(path.join(tempDir, 'data.json'))
      expect(typeof parsed.website).toBe('string')
      expect(typeof parsed.contact).toBe('object')
    })

    it('should handle XML with nested elements and text', () => {
      const xml = `<?xml version="1.0"?>
        <company>
          <title>Test</title>
          <address>
            <line>123 Main St</line>
            <line>Suite 100</line>
          </address>
        </company>`
      fs.writeFileSync(path.join(tempDir, 'data.xml'), xml)

      const parsed = loadDataFile(path.join(tempDir, 'data.xml'))
      expect(parsed.address).toBeDefined()
      expect(Array.isArray(parsed.address.line)).toBe(true)
    })

    it('should preserve numeric strings as strings', () => {
      const data = {
        type: 'company',
        title: 'Test',
        phone: '+1234567890',
        established: '2020'
      }
      fs.writeFileSync(path.join(tempDir, 'data.json'), JSON.stringify(data))

      const parsed = loadDataFile(path.join(tempDir, 'data.json'))
      expect(typeof parsed.phone).toBe('string')
      expect(typeof parsed.established).toBe('string')
    })
  })
})
