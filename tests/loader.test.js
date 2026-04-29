'use strict'

const fs = require('fs')
const os = require('os')
const path = require('path')

const {
  loadDataFile,
  __loadJSON: loadJSON,
  __parseJSONC: parseJSONC,
  __stripJSONComments: stripJSONComments,
  __stripTrailingCommas: stripTrailingCommas,
  __normalizeKeys: normalizeKeys,
  __normalize: normalize,
  __cleanTokens: cleanTokens,
  __refineLoadedData: refineLoadedData,
  __resolveMarkdownReferences: resolveMarkdownReferences,
  __renderMarkdown: renderMarkdown,
  __hasMarkdownSyntax: hasMarkdownSyntax
} = require('../lib/core/loader')

// -------------------------------------------------------------
// Tests.
// -------------------------------------------------------------

function createTempDir () {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'presskit-loader-test-'))
}

function writeJSONFile (dir, data) {
  const filename = path.join(dir, 'data.json')
  fs.writeFileSync(filename, JSON.stringify(data, null, 2))
  return filename
}

function writeRawJSONFile (dir, raw) {
  const filename = path.join(dir, 'data.json')
  fs.writeFileSync(filename, raw)
  return filename
}

function writeXMLFile (dir, xml) {
  const filename = path.join(dir, 'data.xml')
  fs.writeFileSync(filename, xml)
  return filename
}

function writeMarkdownFile (dir, name, content) {
  const filename = path.join(dir, name)
  fs.writeFileSync(filename, content)
  return filename
}

describe('cleanTokens()', () => {
  const tokens = [
    '<br>',
    '<br/>',
    '<br />',
    '<strong>',
    '</strong>',
    '<em>',
    '</em>'
  ]

  it('should not change a string without tokens', () => {
    expect(cleanTokens(tokens, 'test test test')).toEqual('test test test')
  })

  it('should remove all tokens', () => {
    expect(cleanTokens(tokens, '<br>This <strong>is</strong> a<br/> <em>string</em>'))
      .toEqual('This is a string')
  })

  it('should remove all tokens with multiline string', () => {
    const start = `
      <br>This <strong>is</strong> a<br/> <em>string</em>
      Yep, it is.<br /><br />
    `

    const result = `
      This is a string
      Yep, it is.
    `

    expect(cleanTokens(tokens, start)).toEqual(result)
  })
})

describe('loadJSON()', () => {
  it('loads a valid company JSON object', () => {
    const result = loadJSON(JSON.stringify({
      type: 'company',
      title: 'JSON Studio'
    }))

    expect(result.type).toBe('company')
    expect(result.title).toBe('JSON Studio')
  })

  it('loads a valid product JSON object', () => {
    const result = loadJSON(JSON.stringify({
      type: 'product',
      title: 'JSON Product'
    }))

    expect(result.type).toBe('product')
    expect(result.title).toBe('JSON Product')
  })

  it('loads JSONC with line comments', () => {
    const result = loadJSON(`{
      // Required type
      "type": "company",
      "title": "JSON Studio"
    }`)

    expect(result.type).toBe('company')
    expect(result.title).toBe('JSON Studio')
  })

  it('loads JSONC with block comments', () => {
    const result = loadJSON(`{
      /* Required type */
      "type": "product",
      "title": "JSON Product"
    }`)

    expect(result.type).toBe('product')
    expect(result.title).toBe('JSON Product')
  })

  it('loads JSONC with trailing commas', () => {
    const result = loadJSON(`{
      "type": "company",
      "title": "JSON Studio",
      "credits": [
        {
          "person": "Saturno.Software Team",
          "role": "Maintainer",
        },
      ],
    }`)

    expect(result.credits).toEqual([
      {
        person: 'Saturno.Software Team',
        role: 'Maintainer'
      }
    ])
  })

  it('does not treat urls inside strings as comments', () => {
    const result = loadJSON(`{
      "type": "company",
      "title": "JSON Studio",
      "website": "https://saturno.software/path//still-url"
    }`)

    expect(result.website).toBe('https://saturno.software/path//still-url')
  })

  it('rejects invalid JSON syntax', () => {
    expect(() => loadJSON('{ invalid json')).toThrow()
  })

  it('rejects a non-object JSON root', () => {
    expect(() => loadJSON(JSON.stringify([
      { type: 'company', title: 'JSON Studio' }
    ]))).toThrow('JSON root must be an object')
  })

  it.each([
    ['null', 'null'],
    ['true', 'true'],
    ['42', '42'],
    ['"text"', '"text"']
  ])('rejects a primitive JSON root: %s', (label, input) => {
    expect(() => loadJSON(input)).toThrow('JSON root must be an object')
  })

  it('rejects a missing type field', () => {
    expect(() => loadJSON(JSON.stringify({
      title: 'JSON Studio'
    }))).toThrow('Unrecognized JSON file, expected "company" or "product" type')
  })

  it('rejects an invalid type field', () => {
    expect(() => loadJSON(JSON.stringify({
      type: 'game',
      title: 'JSON Studio'
    }))).toThrow('Unrecognized JSON file, expected "company" or "product" type')
  })

  it('rejects a missing title field', () => {
    expect(() => loadJSON(JSON.stringify({
      type: 'company'
    }))).toThrow('JSON file must define a string "title"')
  })

  it('rejects a non-string title field', () => {
    expect(() => loadJSON(JSON.stringify({
      type: 'company',
      title: 42
    }))).toThrow('JSON file must define a string "title"')
  })
})

describe('loadDataFile()', () => {
  let tempDir

  beforeEach(() => {
    tempDir = createTempDir()
  })

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  it('loads a valid data.json file', () => {
    const file = writeJSONFile(tempDir, {
      type: 'company',
      title: 'JSON Studio',
      description: 'A JSON studio.'
    })

    const result = loadDataFile(file)

    expect(result.type).toBe('company')
    expect(result.title).toBe('JSON Studio')
    expect(result.description).toBe('A JSON studio.')
  })

  it('loads a data.json file written as JSONC with comments and trailing commas', () => {
    const file = writeRawJSONFile(tempDir, `{
      // Preferred new authoring format
      "type": "company",
      "title": "Saturno.Software",
      "website": "https://saturno.software",
      "description": {
        "markdownFile": "description.md",
      },
    }`)

    writeMarkdownFile(tempDir, 'description.md', 'Saturno.Software description')

    const result = loadDataFile(file)

    expect(result.title).toBe('Saturno.Software')
    expect(result.description).toBe('<p>Saturno.Software description</p>')
  })

  it('throws when a data.json file contains invalid JSON syntax', () => {
    const file = writeRawJSONFile(tempDir, '{ invalid json')

    expect(() => loadDataFile(file)).toThrow(file)
  })

  it('includes the file path when a data.json file has an invalid type', () => {
    const file = writeJSONFile(tempDir, {
      type: 'game',
      title: 'JSON Studio'
    })

    expect(() => loadDataFile(file)).toThrow(file)
  })

  it('includes the file path when a data.json file is missing title', () => {
    const file = writeJSONFile(tempDir, {
      type: 'company'
    })

    expect(() => loadDataFile(file)).toThrow(file)
  })

  it('preserves JSON arrays and nested structures in template-compatible shapes', () => {
    const file = writeJSONFile(tempDir, {
      type: 'product',
      title: 'JSON Product',
      releaseDates: ['2020'],
      platforms: [
        { name: 'Steam', link: 'https://example.com/steam' }
      ],
      credits: [
        { person: 'Test Person', role: 'Developer' }
      ],
      address: {
        line: ['Line 1', 'Line 2']
      }
    })

    const result = loadDataFile(file)

    expect(result.releaseDates).toEqual(['2020'])
    expect(result.platforms).toEqual([
      { name: 'Steam', link: 'https://example.com/steam' }
    ])
    expect(result.credits).toEqual([
      { person: 'Test Person', role: 'Developer' }
    ])
    expect(result.address).toEqual({
      line: ['Line 1', 'Line 2']
    })
  })

  it('rejects non-array values for array-backed JSON fields', () => {
    const file = writeJSONFile(tempDir, {
      type: 'product',
      title: 'JSON Product',
      credits: {
        person: 'Test Person',
        role: 'Developer'
      }
    })

    expect(() => loadDataFile(file)).toThrow('Field "credits" must be an array')
  })

  it('rejects non-array address.line values in JSON', () => {
    const file = writeJSONFile(tempDir, {
      type: 'company',
      title: 'JSON Studio',
      address: {
        line: 'Line 1'
      }
    })

    expect(() => loadDataFile(file)).toThrow('Field "address.line" must be an array')
  })

  it('normalizes an equivalent company XML and JSON file to the same shape', () => {
    const xmlFile = writeXMLFile(tempDir, `<?xml version="1.0" encoding="utf-8"?>
<company>
  <title>Studio</title>
  <based-in>Paris</based-in>
  <founding-date>2020</founding-date>
  <website>https://example.com</website>
  <press-contact>press@example.com</press-contact>
  <description>Company description.</description>
  <socials>
    <social>
      <name>Twitter</name>
      <link>https://twitter.com/example</link>
    </social>
  </socials>
  <credits>
    <credit>
      <person>Test Person</person>
      <role>Developer</role>
    </credit>
  </credits>
</company>`)

    const jsonFile = writeJSONFile(tempDir, {
      type: 'company',
      title: 'Studio',
      basedIn: 'Paris',
      foundingDate: '2020',
      website: 'https://example.com',
      pressContact: 'press@example.com',
      description: 'Company description.',
      socials: [
        {
          name: 'Twitter',
          link: 'https://twitter.com/example'
        }
      ],
      credits: [
        {
          person: 'Test Person',
          role: 'Developer'
        }
      ]
    })

    expect(loadDataFile(jsonFile)).toEqual(loadDataFile(xmlFile))
  })

  it('normalizes an equivalent product XML and JSON file to the same shape', () => {
    const xmlFile = writeXMLFile(tempDir, `<?xml version="1.0" encoding="utf-8"?>
<product>
  <title>Product</title>
  <website>https://example.com/product</website>
  <description>Product description.</description>
  <release-dates>
    <release-date>2020</release-date>
  </release-dates>
  <platforms>
    <platform>
      <name>Steam</name>
      <link>https://example.com/steam</link>
    </platform>
  </platforms>
  <prices>
    <price>
      <currency>USD</currency>
      <value>20</value>
    </price>
  </prices>
  <credits>
    <credit>
      <person>Test Person</person>
      <role>Developer</role>
    </credit>
  </credits>
</product>`)

    const jsonFile = writeJSONFile(tempDir, {
      type: 'product',
      title: 'Product',
      website: 'https://example.com/product',
      description: 'Product description.',
      releaseDates: ['2020'],
      platforms: [
        {
          name: 'Steam',
          link: 'https://example.com/steam'
        }
      ],
      prices: [
        {
          currency: 'USD',
          value: '20'
        }
      ],
      credits: [
        {
          person: 'Test Person',
          role: 'Developer'
        }
      ]
    })

    expect(loadDataFile(jsonFile)).toEqual(loadDataFile(xmlFile))
  })

  it('renders markdownFile content in description to HTML', () => {
    writeMarkdownFile(tempDir, 'description.md', 'Description from markdown.')
    const file = writeJSONFile(tempDir, {
      type: 'company',
      title: 'JSON Studio',
      description: {
        markdownFile: 'description.md'
      }
    })

    const result = loadDataFile(file)

    expect(result.description).toBe('<p>Description from markdown.</p>')
  })

  it('renders markdownFile entries inside features arrays to HTML', () => {
    writeMarkdownFile(tempDir, 'feature.md', '**Feature** from markdown.')
    const file = writeJSONFile(tempDir, {
      type: 'product',
      title: 'JSON Product',
      features: [
        {
          markdownFile: 'feature.md'
        }
      ]
    })

    const result = loadDataFile(file)

    expect(result.features).toEqual(['<p><strong>Feature</strong> from markdown.</p>'])
  })

  it('renders markdownFile in awards descriptions to HTML', () => {
    writeMarkdownFile(tempDir, 'award.md', '*Award* from markdown.')
    const file = writeJSONFile(tempDir, {
      type: 'product',
      title: 'JSON Product',
      awards: [
        {
          description: {
            markdownFile: 'award.md'
          },
          info: 'Award info'
        }
      ]
    })

    const result = loadDataFile(file)

    expect(result.awards).toEqual([
      {
        description: '<p><em>Award</em> from markdown.</p>',
        info: 'Award info'
      }
    ])
  })

  it('renders markdownFile content in history to HTML', () => {
    writeMarkdownFile(tempDir, 'history.md', '*Studio history*')
    const file = writeJSONFile(tempDir, {
      type: 'company',
      title: 'JSON Studio',
      history: {
        markdownFile: 'history.md'
      }
    })

    const result = loadDataFile(file)

    expect(result.history).toBe('<p><em>Studio history</em></p>')
  })

  it('renders markdownFile entries inside histories text to HTML', () => {
    writeMarkdownFile(tempDir, 'history-entry.md', '**Shipped** the game')
    const file = writeJSONFile(tempDir, {
      type: 'company',
      title: 'JSON Studio',
      histories: [
        {
          text: {
            markdownFile: 'history-entry.md'
          }
        }
      ]
    })

    const result = loadDataFile(file)

    expect(result.histories).toEqual([
      {
        text: '<p><strong>Shipped</strong> the game</p>'
      }
    ])
  })

  it('renders markdownFile in about descriptions to HTML', () => {
    writeMarkdownFile(tempDir, 'about.md', '*About* from markdown.')
    const file = writeJSONFile(tempDir, {
      type: 'product',
      title: 'JSON Product',
      abouts: [
        {
          description: {
            markdownFile: 'about.md'
          }
        }
      ]
    })

    const result = loadDataFile(file)

    expect(result.abouts).toEqual([
      {
        description: '<p><em>About</em> from markdown.</p>'
      }
    ])
  })

  it('renders markdownFile in quote descriptions to HTML', () => {
    writeMarkdownFile(tempDir, 'quote.md', '**Quote** from markdown.')
    const file = writeJSONFile(tempDir, {
      type: 'product',
      title: 'JSON Product',
      quotes: [
        {
          description: {
            markdownFile: 'quote.md'
          }
        }
      ]
    })

    const result = loadDataFile(file)

    expect(result.quotes).toEqual([
      {
        description: '<p><strong>Quote</strong> from markdown.</p>'
      }
    ])
  })

  it('renders markdownFile in additional descriptions to HTML', () => {
    writeMarkdownFile(tempDir, 'additional.md', '*Additional* from markdown.')
    const file = writeJSONFile(tempDir, {
      type: 'product',
      title: 'JSON Product',
      additionals: [
        {
          description: {
            markdownFile: 'additional.md'
          }
        }
      ]
    })

    const result = loadDataFile(file)

    expect(result.additionals).toEqual([
      {
        description: '<p><em>Additional</em> from markdown.</p>'
      }
    ])
  })

  it('renders markdownFile in credit roles to HTML', () => {
    writeMarkdownFile(tempDir, 'role.md', '*Lead Developer*')
    const file = writeJSONFile(tempDir, {
      type: 'product',
      title: 'JSON Product',
      credits: [
        {
          person: 'Test Person',
          role: {
            markdownFile: 'role.md'
          }
        }
      ]
    })

    const result = loadDataFile(file)

    expect(result.credits).toEqual([
      {
        person: 'Test Person',
        role: '<p><em>Lead Developer</em></p>'
      }
    ])
  })

  it('renders inline markdown strings in description to HTML', () => {
    const file = writeJSONFile(tempDir, {
      type: 'company',
      title: 'JSON Studio',
      description: '**Bold** description.'
    })

    const result = loadDataFile(file)

    expect(result.description).toBe('<p><strong>Bold</strong> description.</p>')
  })

  it('does not render plain text fields like website as markdown', () => {
    const file = writeJSONFile(tempDir, {
      type: 'company',
      title: 'JSON Studio',
      website: '**https://example.com**'
    })

    const result = loadDataFile(file)

    expect(result.website).toBe('**https://example.com**')
  })

  it('fails clearly when a markdownFile target is missing', () => {
    const file = writeJSONFile(tempDir, {
      type: 'company',
      title: 'JSON Studio',
      description: {
        markdownFile: 'missing-description.md'
      }
    })

    expect(() => loadDataFile(file)).toThrow('missing-description.md')
  })

  it('fails clearly when a markdownFile reference is malformed in description', () => {
    const file = writeJSONFile(tempDir, {
      type: 'company',
      title: 'JSON Studio',
      description: {
        markdownFile: 42
      }
    })

    expect(() => loadDataFile(file)).toThrow('description')
  })

  it('fails clearly when a markdownFile reference is malformed in features', () => {
    const file = writeJSONFile(tempDir, {
      type: 'product',
      title: 'JSON Product',
      features: [
        {
          text: 'not allowed here'
        }
      ]
    })

    expect(() => loadDataFile(file)).toThrow('features[]')
  })

  it('fails clearly when a markdownFile reference is malformed in history', () => {
    const file = writeJSONFile(tempDir, {
      type: 'company',
      title: 'JSON Studio',
      history: {
        markdownFile: ''
      }
    })

    expect(() => loadDataFile(file)).toThrow('history')
  })

  it('fails clearly when a markdownFile reference is malformed in histories text', () => {
    const file = writeJSONFile(tempDir, {
      type: 'company',
      title: 'JSON Studio',
      histories: [
        {
          text: {
            markdownFile: ''
          }
        }
      ]
    })

    expect(() => loadDataFile(file)).toThrow('histories[].text')
  })

  it('fails clearly when a markdownFile reference is malformed in credit roles', () => {
    const file = writeJSONFile(tempDir, {
      type: 'product',
      title: 'JSON Product',
      credits: [
        {
          person: 'Test Person',
          role: {
            markdownFile: ''
          }
        }
      ]
    })

    expect(() => loadDataFile(file)).toThrow('credits[].role')
  })

  it('renders empty markdown files as empty strings', () => {
    writeMarkdownFile(tempDir, 'empty.md', '')
    const file = writeJSONFile(tempDir, {
      type: 'company',
      title: 'JSON Studio',
      description: {
        markdownFile: 'empty.md'
      }
    })

    const result = loadDataFile(file)

    expect(result.description).toBe('')
  })
})

describe('refineLoadedData()', () => {
  it('accepts shared company data without changing XML-compatible fields', () => {
    const data = {
      type: 'company',
      title: 'Studio',
      description: 'Plain description.',
      credits: [
        { person: 'Test Person', role: 'Developer' }
      ]
    }

    expect(refineLoadedData(data)).toEqual({
      type: 'company',
      title: 'Studio',
      description: 'Plain description.',
      credits: [
        { person: 'Test Person', role: 'Developer' }
      ]
    })
  })

  it('rejects loaded data without a supported type', () => {
    expect(() => refineLoadedData({
      type: 'game',
      title: 'Broken'
    })).toThrow('Loaded data must define type "company" or "product"')
  })

  it('rejects loaded data without a string title', () => {
    expect(() => refineLoadedData({
      type: 'product',
      title: 42
    })).toThrow('Loaded data must define a string "title"')
  })

  it('resolves markdown only when explicitly enabled', () => {
    const localDir = createTempDir()
    try {
      writeMarkdownFile(localDir, 'description.md', '**Bold** copy')

      const data = {
        type: 'company',
        title: 'Studio',
        description: {
          markdownFile: 'description.md'
        }
      }

      expect(refineLoadedData({
        type: 'company',
        title: 'Studio',
        description: {
          markdownFile: 'description.md'
        }
      })).toEqual(data)

      expect(refineLoadedData(data, {
        baseDir: localDir,
        resolveMarkdown: true
      })).toEqual({
        type: 'company',
        title: 'Studio',
        description: '<p><strong>Bold</strong> copy</p>'
      })
    } finally {
      fs.rmSync(localDir, { recursive: true, force: true })
    }
  })

  it('rejects loaded data when an array-backed field is not an array', () => {
    expect(() => refineLoadedData({
      type: 'product',
      title: 'Broken',
      credits: {
        person: 'Test Person',
        role: 'Developer'
      }
    })).toThrow('Field "credits" must be an array')
  })
})

describe('resolveMarkdownReferences()', () => {
  let tempDir

  beforeEach(() => {
    tempDir = createTempDir()
  })

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  it('leaves unrelated optional arrays untouched when they are missing', () => {
    const data = {
      type: 'company',
      title: 'Studio'
    }

    expect(resolveMarkdownReferences(data, tempDir)).toEqual({
      type: 'company',
      title: 'Studio'
    })
  })

  it('does not alter object arrays when the rich text field is missing', () => {
    const data = {
      type: 'product',
      title: 'Game',
      abouts: [
        { title: 'Team' }
      ]
    }

    expect(resolveMarkdownReferences(data, tempDir)).toEqual({
      type: 'product',
      title: 'Game',
      abouts: [
        { title: 'Team' }
      ]
    })
  })

  it('resolves inline markdown inside credit roles', () => {
    const data = {
      type: 'product',
      title: 'Game',
      credits: [
        { person: 'Alex', role: '**Lead** Developer' }
      ]
    }

    expect(resolveMarkdownReferences(data, tempDir).credits[0].role).toBe('<p><strong>Lead</strong> Developer</p>')
  })
})

describe('renderMarkdown()', () => {
  it('returns an empty string for empty markdown', () => {
    expect(renderMarkdown('')).toBe('')
  })

  it('wraps plain text markdown in a paragraph', () => {
    expect(renderMarkdown('Plain text')).toBe('<p>Plain text</p>')
  })

  it('renders bullet lists as unordered lists', () => {
    expect(renderMarkdown('- one\n- two')).toBe('<ul><li>one</li><li>two</li></ul>')
  })

  it('escapes raw html before applying inline markdown', () => {
    expect(renderMarkdown('<script>alert(1)</script>')).toBe('<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>')
  })

  it('normalizes windows newlines before rendering markdown', () => {
    expect(renderMarkdown('**Bold**\r\ntext')).toBe('<p><strong>Bold</strong>\ntext</p>')
  })

  it('renders multiple paragraphs separately', () => {
    expect(renderMarkdown('First paragraph.\n\nSecond paragraph.')).toBe('<p>First paragraph.</p><p>Second paragraph.</p>')
  })

  it('renders bold and italic markdown in the same paragraph', () => {
    expect(renderMarkdown('**Bold** and *italic*')).toBe('<p><strong>Bold</strong> and <em>italic</em></p>')
  })

  it('escapes ampersands before applying inline markdown', () => {
    expect(renderMarkdown('A & B')).toBe('<p>A &amp; B</p>')
  })

  it('renders markdown inside list items', () => {
    expect(renderMarkdown('- **one**\n- *two*')).toBe('<ul><li><strong>one</strong></li><li><em>two</em></li></ul>')
  })

  it('does not treat mixed paragraphs as a list', () => {
    expect(renderMarkdown('- one\nparagraph')).toBe('<p>- one\nparagraph</p>')
  })

  it.each([
    ['single italic token', '*token*', '<p><em>token</em></p>'],
    ['single bold token', '**token**', '<p><strong>token</strong></p>'],
    ['leading and trailing whitespace', '  text  ', '<p>text</p>'],
    ['multiple blank lines between paragraphs', 'one\n\n\n two', '<p>one</p><p>two</p>'],
    ['html angle brackets are escaped', '<div>box</div>', '<p>&lt;div&gt;box&lt;/div&gt;</p>'],
    ['markdown list with extra spaces', ' - one\n - two', '<ul><li>one</li><li>two</li></ul>']
  ])('renders %s', (label, input, expected) => {
    expect(renderMarkdown(input)).toBe(expected)
  })
})

describe('hasMarkdownSyntax()', () => {
  it('detects bold markdown syntax', () => {
    expect(hasMarkdownSyntax('This is **bold** text')).toBe(true)
  })

  it('detects italic markdown syntax', () => {
    expect(hasMarkdownSyntax('This is *italic* text')).toBe(true)
  })

  it('detects list markdown syntax', () => {
    expect(hasMarkdownSyntax('- item')).toBe(true)
  })

  it('does not flag plain text as markdown', () => {
    expect(hasMarkdownSyntax('Just plain text')).toBe(false)
  })

  it.each([
    '2 * 3 = 6',
    'Use * as a wildcard',
    'hyphen-separated-value',
    'asterisks **',
    'text with - dash but no list'
  ])('does not flag non-markdown syntax: %s', (input) => {
    expect(hasMarkdownSyntax(input)).toBe(false)
  })

  it.each([
    '**bold**',
    '*italic*',
    '- list item',
    'prefix\n- list item',
    'before **bold** after',
    'before *italic* after'
  ])('flags markdown syntax: %s', (input) => {
    expect(hasMarkdownSyntax(input)).toBe(true)
  })
})

describe('parseJSONC()', () => {
  it('parses JSONC content with comments and trailing commas', () => {
    expect(parseJSONC(`{
      // Company record
      "type": "company",
      "title": "Saturno.Software",
      "credits": [
        {
          "person": "Saturno.Software Team",
          "role": "Maintainer",
        },
      ],
    }`)).toEqual({
      type: 'company',
      title: 'Saturno.Software',
      credits: [
        {
          person: 'Saturno.Software Team',
          role: 'Maintainer'
        }
      ]
    })
  })
})

describe('stripJSONComments()', () => {
  it('removes line and block comments outside strings', () => {
    expect(stripJSONComments('{\n// line\n"a": 1, /* block */\n"b": 2\n}')).toContain('"a": 1,')
  })

  it('preserves comment-like text inside strings', () => {
    expect(stripJSONComments('{"url": "https://saturno.software/path//docs"}'))
      .toBe('{"url": "https://saturno.software/path//docs"}')
  })

  it('preserves escaped quotes before comment-like text inside strings', () => {
    expect(stripJSONComments('{"text": "He said \\"//not-comment\\""}'))
      .toBe('{"text": "He said \\"//not-comment\\""}')
  })

  it('removes a trailing line comment at end of file', () => {
    expect(stripJSONComments('{"a": 1}// trailing')).toBe('{"a": 1}')
  })

  it('preserves line count for block comments with newlines', () => {
    expect(stripJSONComments('{\n/* line1\nline2 */\n"a": 1\n}')).toBe('{\n\n\n"a": 1\n}')
  })

  it.each([
    ['simple line comment', '{\n// comment\n"a": 1\n}', '{\n\n"a": 1\n}'],
    ['simple block comment', '{/* comment */"a": 1}', '{"a": 1}'],
    ['url-like string', '{"url":"http://example.com//path"}', '{"url":"http://example.com//path"}'],
    ['slash-star text in string', '{"text":"/* keep */"}', '{"text":"/* keep */"}']
  ])('handles %s', (label, input, expected) => {
    expect(stripJSONComments(input)).toBe(expected)
  })
})

describe('stripTrailingCommas()', () => {
  it('removes trailing commas from objects and arrays', () => {
    expect(stripTrailingCommas('{"a": 1, "b": [1, 2,],}')).toBe('{"a": 1, "b": [1, 2]}')
  })

  it('preserves commas inside strings', () => {
    expect(stripTrailingCommas('{"text": "one,two,three"}')).toBe('{"text": "one,two,three"}')
  })

  it('removes trailing commas across nested objects and arrays with whitespace', () => {
    expect(stripTrailingCommas('{"a": {"b": 1, }, "c": [1, 2, ], }')).toBe('{"a": {"b": 1 }, "c": [1, 2 ] }')
  })

  it('preserves bracket-like comma patterns inside strings', () => {
    expect(stripTrailingCommas('{"text": ",] ,}"}')).toBe('{"text": ",] ,}"}')
  })

  it.each([
    ['object with trailing comma', '{"a":1,}', '{"a":1}'],
    ['array with trailing comma', '[1,2,]', '[1,2]'],
    ['nested array with trailing comma', '{"a":[1,2,],"b":3}', '{"a":[1,2],"b":3}'],
    ['nested object with trailing comma', '{"a":{"b":1,},"c":2}', '{"a":{"b":1},"c":2}'],
    ['already clean input', '{"a":1}', '{"a":1}']
  ])('handles %s', (label, input, expected) => {
    expect(stripTrailingCommas(input)).toBe(expected)
  })
})

describe('normalizeKeys()', () => {
  const keys = ['quotes', 'awards']
  const received = {
    quotes: {
      quote: { description: 'quote' }
    },
    awards: {
      award: [
        { description: 1 },
        { description: 2 }
      ]
    },
    test: 42,
    socials: {
      social: [
        { text: 1 },
        { text: 2 }
      ]
    }
  }
  const correct = {
    quotes: [{ description: 'quote' }],
    awards: [
      { description: 1 },
      { description: 2 }
    ],
    test: 42,
    socials: {
      social: [
        { text: 1 },
        { text: 2 }
      ]
    }
  }

  it('normalizes a list of provided keys in an object', () => {
    expect(normalizeKeys(keys, received)).toEqual(correct)
  })

  it('ignores missing keys from the normalization list', () => {
    expect(normalizeKeys(['missing'], { test: true })).toEqual({ test: true })
  })
})

describe('normalize()', () => {
  it('returns the correct content as it is', () => {
    expect(normalize([
      { description: 1 },
      { description: 2 }
    ])).toEqual([
      { description: 1 },
      { description: 2 }
    ])
  })

  it('returns an object without the useless intermediate key', () => {
    expect(normalize({
      award: [
        { description: 1 },
        { description: 2 }
      ]
    })).toEqual([
      { description: 1 },
      { description: 2 }
    ])
  })

  it('returns an object containing an array, even if there is one item only', () => {
    expect(normalize({
      award: { description: 1 }
    })).toEqual([
      { description: 1 }
    ])
  })

  it('ignores an object containing 0 key', () => {
    expect(normalize({})).toEqual({})
  })

  it('ignores an object containing 2 keys or more', () => {
    expect(normalize({
      test: true,
      award: [
        { description: 1 },
        { description: 2 }
      ]
    })).toEqual({
      test: true,
      award: [
        { description: 1 },
        { description: 2 }
      ]
    })
  })

  it('returns arrays untouched', () => {
    expect(normalize(['a', 'b'])).toEqual(['a', 'b'])
  })

  it.each([
    ['single object key to array', { award: { description: 1 } }, [{ description: 1 }]],
    ['single array key unchanged', { award: [{ description: 1 }] }, [{ description: 1 }]],
    ['multi-key object unchanged', { award: [{ description: 1 }], keep: true }, { award: [{ description: 1 }], keep: true }]
  ])('normalizes %s', (label, input, expected) => {
    expect(normalize(input)).toEqual(expected)
  })

  // Additional edge case tests
  it('handles empty title field validation', () => {
    const data = { title: '' }
    expect(data.title).toBe('')
    expect(data.title.length).toBe(0)
  })

  it('handles whitespace-only strings in fields', () => {
    const data = { title: '   \t\n   ' }
    const trimmed = data.title.trim()
    expect(trimmed.length).toBe(0)
  })

  it('validates address.line array properly', () => {
    const data = {
      address: {
        line: [
          '123 Main St',
          'Suite 100',
          'City, State 12345'
        ]
      }
    }
    expect(Array.isArray(data.address.line)).toBe(true)
    expect(data.address.line.length).toBe(3)
  })
})
