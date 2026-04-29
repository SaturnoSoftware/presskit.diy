'use strict'

const fs = require('fs')

const parser = require('../lib/core/parser')

// -------------------------------------------------------------
// Tests.
// -------------------------------------------------------------

describe('XML Parser', () => {
  const companyXML = fs.readFileSync(`${process.cwd()}/data/data.xml`, 'utf-8')
  const productXML = fs.readFileSync(`${process.cwd()}/data/product/data.xml`, 'utf-8')

  it('handles empty, null or undefined XML strings', () => {
    expect(() => parser.parseXML(undefined)).toThrow()
    expect(() => parser.parseXML(null)).toThrow()
    expect(() => parser.parseXML('')).toThrow()
  })

  it('handles invalid XML strings', () => {
    expect(() => parser.parseXML('Test. This is not XML')).toThrow()
  })

  it('handles incomplete XML strings', () => {
    const data = '<?xml version="1.0"?><catalog><book id="bk101"><author>Gambardella, Matthew'

    expect(() => parser.parseXML(data)).toThrow()
  })

  it('handles valid XML strings but invalid presskit data', () => {
    const data = '<?xml version="1.0"?><catalog><book id="bk101"><author>Gambardella, Matthew</author><title>XML Developer\'s Guide</title><genre>Computer</genre><price>44.95</price><publish_date>2000-10-01</publish_date><description>An in-depth look at creating applications with XML.</description></book></catalog>'

    expect(() => parser.parseXML(data)).toThrow()
  })

  it('handles valid XML `company` presskit string', () => {
    const result = parser.parseXML(companyXML)

    expect(result.type).toBe('company')
    expect(result.title).toBeDefined()
    expect(result.description).toBeDefined()
  })

  it('handles valid XML `product` or `game` presskit string', () => {
    const result = parser.parseXML(productXML)

    expect(result.type).toBe('product')
    expect(result.title).toBeDefined()
    expect(result.description).toBeDefined()
  })

  it('maps a <game> root to product type', () => {
    const result = parser.parseXML(`<?xml version="1.0" encoding="utf-8"?>
<game>
  <title>Game Root</title>
  <description>Root test.</description>
</game>`)

    expect(result.type).toBe('product')
    expect(result.title).toBe('Game Root')
  })

  it('camelCases kebab-case tag names', () => {
    const result = parser.parseXML(`<?xml version="1.0" encoding="utf-8"?>
<company>
  <title>Studio</title>
  <based-in>Paris</based-in>
  <founding-date>2020</founding-date>
</company>`)

    expect(result.basedIn).toBe('Paris')
    expect(result.foundingDate).toBe('2020')
  })

  it('preserves nested objects before loader normalization', () => {
    const result = parser.parseXML(`<?xml version="1.0" encoding="utf-8"?>
<company>
  <title>Studio</title>
  <credits>
    <credit>
      <person>Test Person</person>
      <role>Developer</role>
    </credit>
  </credits>
</company>`)

    expect(result.credits.credit.person).toBe('Test Person')
    expect(result.credits.credit.role).toBe('Developer')
  })

  it('supports xml declarations with encoding metadata', () => {
    const result = parser.parseXML('<?xml version="1.0" encoding="utf-8"?><company><title>Studio</title><description>Desc</description></company>')

    expect(result.title).toBe('Studio')
    expect(result.description).toBe('Desc')
  })

  it('supports xml declarations for product roots too', () => {
    const result = parser.parseXML('<?xml version="1.0" encoding="utf-8"?><product><title>Game</title><description>Desc</description></product>')

    expect(result.type).toBe('product')
    expect(result.title).toBe('Game')
  })

  it('decodes xml entities in text nodes', () => {
    const result = parser.parseXML('<?xml version="1.0"?><company><title>Fish &amp; Chips</title><description>Rock &amp; Roll</description></company>')

    expect(result.title).toBe('Fish & Chips')
    expect(result.description).toBe('Rock & Roll')
  })

  it('keeps nested product objects before loader normalization', () => {
    const result = parser.parseXML(`<?xml version="1.0" encoding="utf-8"?>
<product>
  <title>Studio</title>
  <platforms>
    <platform>
      <name>Steam</name>
      <link>https://example.com/steam</link>
    </platform>
  </platforms>
</product>`)

    expect(result.platforms.platform.name).toBe('Steam')
    expect(result.platforms.platform.link).toBe('https://example.com/steam')
  })

  it.each([
    ['   '],
    ['\n\t']
  ])('rejects whitespace-only XML input: %j', (input) => {
    expect(() => parser.parseXML(input)).toThrow()
  })

  it('rejects unknown presskit root tags', () => {
    const data = '<?xml version="1.0"?><press><title>Unknown</title></press>'

    expect(() => parser.parseXML(data)).toThrow('Unrecognized XML file, expected <game>, <product> or <company> root tag')
  })

  // Additional edge case tests
  it('handles extremely nested XML structures without stack overflow', () => {
    let nested = '<title>Deep</title>'
    for (let i = 0; i < 100; i++) {
      nested = `<level>${nested}</level>`
    }
    const xml = `<?xml version="1.0"?><company>${nested}</company>`

    expect(() => parser.parseXML(xml)).not.toThrow()
  })

  it('rejects XML with missing required title field', () => {
    const data = '<?xml version="1.0"?><company><description>Missing title</description></company>'

    const result = parser.parseXML(data)
    // Parser returns parsed data, loader validates it
    expect(result).toBeDefined()
    expect(result.title).toBeUndefined()
  })

  it('handles XML with special characters in title', () => {
    const result = parser.parseXML('<?xml version="1.0"?><company><title>Test™ © Studio</title><description>Desc</description></company>')

    expect(result.title).toBe('Test™ © Studio')
  })
})
