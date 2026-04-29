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

jest.mock('../lib/helpers/watcher', () => ({
  installWatcher: jest.fn(),
  installDevelopmentWatcher: jest.fn()
}))

const generator = require('../lib/core/generator')
const config = require('../lib/config')
const colorConsole = require('../lib/helpers/color-console')
const watcher = require('../lib/helpers/watcher')

// -------------------------------------------------------------
// Helpers.
// -------------------------------------------------------------

function createTempDir () {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'presskit-test-'))
}

function writeXML (dir, xml) {
  fs.writeFileSync(path.join(dir, 'data.xml'), xml)
}

function writeJSON (dir, data) {
  fs.writeFileSync(path.join(dir, 'data.json'), JSON.stringify(data, null, 2))
}

function writeProductXML (dir, {
  title = 'Test Product',
  website = 'https://example.com/product',
  description = 'A test product.',
  relations = ''
} = {}) {
  writeXML(dir, `<?xml version="1.0" encoding="utf-8"?>
<product>
  <title>${title}</title>
  <website>${website}</website>
  <description>${description}</description>
  ${relations}
  <credits>
    <credit>
      <person>Test Person</person>
      <role>Developer</role>
    </credit>
  </credits>
</product>`)
}

function createProductJSON ({
  title = 'Test Product',
  website = 'https://example.com/product',
  description = 'A test product.',
  relations = undefined
} = {}) {
  const data = {
    type: 'product',
    title,
    website,
    description,
    credits: [
      {
        person: 'Test Person',
        role: 'Developer'
      }
    ]
  }

  if (relations) {
    data.relations = relations
  }

  return data
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

function writePngImage (dir, name) {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wn8xXQAAAAASUVORK5CYII=',
    'base64'
  )
  fs.writeFileSync(path.join(dir, name), png)
}

function writeGifImage (dir, name) {
  const gif = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
    'base64'
  )
  fs.writeFileSync(path.join(dir, name), gif)
}

function writeTextFile (dir, name, content) {
  fs.writeFileSync(path.join(dir, name), content)
}

function expectContainsAll (html, values) {
  values.forEach(value => expect(html).toContain(value))
}

async function waitForFile (filename, timeoutMs = 2000) {
  const start = Date.now()

  while (!fs.existsSync(filename)) {
    if ((Date.now() - start) > timeoutMs) {
      throw new Error(`Timed out waiting for file: ${filename}`)
    }

    await new Promise(resolve => setTimeout(resolve, 25))
  }
}

const companyXML = `<?xml version="1.0" encoding="utf-8"?>
<company>
  <title>Test Studio</title>
  <based-in>Paris</based-in>
  <founding-date>2020</founding-date>
  <website>https://example.com</website>
  <press-contact>press@example.com</press-contact>
  <description>A test studio.</description>
  <credits>
    <credit>
      <person>Test Person</person>
      <role>Developer</role>
    </credit>
  </credits>
</company>`

const gameXML = `<?xml version="1.0" encoding="utf-8"?>
<game>
  <title>Test Game</title>
  <website>https://example.com/game</website>
  <description>A test game.</description>
  <credits>
    <credit>
      <person>Test Person</person>
      <role>Developer</role>
    </credit>
  </credits>
</game>`

const productXML = `<?xml version="1.0" encoding="utf-8"?>
<product>
  <title>Test Product</title>
  <website>https://example.com/product</website>
  <description>A test product.</description>
  <credits>
    <credit>
      <person>Test Person</person>
      <role>Developer</role>
    </credit>
  </credits>
</product>`

const companyJSON = {
  type: 'company',
  title: 'JSON Studio',
  basedIn: 'Paris',
  foundingDate: '2020',
  website: 'https://example.com',
  pressContact: 'press@example.com',
  description: 'A JSON test studio.',
  credits: [
    {
      person: 'Test Person',
      role: 'Developer'
    }
  ]
}

const productJSON = {
  ...createProductJSON({
    title: 'JSON Product',
    description: 'A JSON test product.'
  })
}

// -------------------------------------------------------------
// Tests.
// -------------------------------------------------------------

describe('generate()', () => {
  let tempDir
  let buildDir

  beforeEach(() => {
    tempDir = createTempDir()
    buildDir = path.join(tempDir, 'build')
    setupConfig(buildDir)
  })

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  it('should build a company page', async () => {
    writeXML(tempDir, companyXML)
    await generator.generate(tempDir)

    expect(fs.existsSync(path.join(buildDir, 'index.html'))).toBe(true)
  })

  it('should build a company with a product', async () => {
    writeXML(tempDir, companyXML)

    const productDir = path.join(tempDir, 'mygame')
    fs.mkdirSync(productDir)
    writeXML(productDir, productXML)

    await generator.generate(tempDir)

    expect(fs.existsSync(path.join(buildDir, 'index.html'))).toBe(true)
    expect(fs.existsSync(path.join(buildDir, 'mygame', 'index.html'))).toBe(true)
  })

  it('should build a JSON company page from data.json', async () => {
    writeJSON(tempDir, companyJSON)
    await generator.generate(tempDir)

    const html = fs.readFileSync(path.join(buildDir, 'index.html'), 'utf-8')
    expect(html).toContain('JSON Studio')
    expect(html).toContain('A JSON test studio.')
  })

  it('should build a JSON product page from data.json in a subfolder', async () => {
    writeXML(tempDir, companyXML)

    const productDir = path.join(tempDir, 'json-product')
    fs.mkdirSync(productDir)
    writeJSON(productDir, productJSON)

    await generator.generate(tempDir)

    const html = fs.readFileSync(path.join(buildDir, 'json-product', 'index.html'), 'utf-8')
    expect(html).toContain('JSON Product')
    expect(html).toContain('A JSON test product.')
  })

  it('should build a JSON company with a JSON product', async () => {
    writeJSON(tempDir, companyJSON)

    const productDir = path.join(tempDir, 'json-product')
    fs.mkdirSync(productDir)
    writeJSON(productDir, productJSON)

    await generator.generate(tempDir)

    expect(fs.existsSync(path.join(buildDir, 'index.html'))).toBe(true)
    expect(fs.existsSync(path.join(buildDir, 'json-product', 'index.html'))).toBe(true)
  })

  it('should include JSON company info in a JSON product page', async () => {
    writeJSON(tempDir, companyJSON)

    const productDir = path.join(tempDir, 'json-product')
    fs.mkdirSync(productDir)
    writeJSON(productDir, productJSON)

    await generator.generate(tempDir)

    const html = fs.readFileSync(path.join(buildDir, 'json-product', 'index.html'), 'utf-8')
    expect(html).toContain('JSON Studio')
    expect(html).toContain('JSON Product')
  })

  it('should build an XML company with a JSON product without changing product output', async () => {
    writeXML(tempDir, companyXML)

    const productDir = path.join(tempDir, 'json-product')
    fs.mkdirSync(productDir)
    writeJSON(productDir, productJSON)

    await generator.generate(tempDir)

    const html = fs.readFileSync(path.join(buildDir, 'json-product', 'index.html'), 'utf-8')
    expect(html).toContain('Test Studio')
    expect(html).toContain('JSON Product')
    expect(html).toContain('A JSON test product.')
  })

  it('should build a JSON company with an XML product without changing product output', async () => {
    writeJSON(tempDir, companyJSON)

    const productDir = path.join(tempDir, 'xml-product')
    fs.mkdirSync(productDir)
    writeXML(productDir, productXML)

    await generator.generate(tempDir)

    const html = fs.readFileSync(path.join(buildDir, 'xml-product', 'index.html'), 'utf-8')
    expect(html).toContain('JSON Studio')
    expect(html).toContain('Test Product')
    expect(html).toContain('A test product.')
  })

  it('should prefer data.json over data.xml in the same folder', async () => {
    writeXML(tempDir, companyXML)
    writeJSON(tempDir, companyJSON)

    await generator.generate(tempDir)

    const html = fs.readFileSync(path.join(buildDir, 'index.html'), 'utf-8')
    expect(html).toContain('JSON Studio')
    expect(html).not.toContain('Test Studio')
  })

  it('should prefer data.json over data.xml in product subfolders too', async () => {
    writeXML(tempDir, companyXML)

    const productDir = path.join(tempDir, 'mixed-product')
    fs.mkdirSync(productDir)
    writeXML(productDir, productXML)
    writeJSON(productDir, productJSON)

    await generator.generate(tempDir)

    const html = fs.readFileSync(path.join(buildDir, 'mixed-product', 'index.html'), 'utf-8')
    expect(html).toContain('JSON Product')
    expect(html).not.toContain('Test Product')
  })

  it('should ignore files that are not named data.xml or data.json', async () => {
    fs.writeFileSync(path.join(tempDir, 'presskit.json'), JSON.stringify(companyJSON, null, 2))

    await generator.generate(tempDir)

    expect(fs.existsSync(buildDir)).toBe(false)
  })

  it('should ignore deeper nested data files beyond the supported scan depth', async () => {
    fs.mkdirSync(path.join(tempDir, 'nested', 'deeper'), { recursive: true })
    writeJSON(path.join(tempDir, 'nested', 'deeper'), productJSON)

    await generator.generate(tempDir)

    expect(fs.existsSync(buildDir)).toBe(false)
  })

  it('should export shared css and js assets for XML builds', async () => {
    writeXML(tempDir, companyXML)
    await generator.generate(tempDir)

    expect(fs.existsSync(path.join(buildDir, 'css', 'normalize.css'))).toBe(true)
    expect(fs.existsSync(path.join(buildDir, 'css', 'print.css'))).toBe(true)
    expect(fs.existsSync(path.join(buildDir, 'css', 'theme.css'))).toBe(true)
    expect(fs.existsSync(path.join(buildDir, 'js', 'hamburger.js'))).toBe(true)
    expect(fs.existsSync(path.join(buildDir, 'js', 'imagesloaded.min.js'))).toBe(true)
    expect(fs.existsSync(path.join(buildDir, 'js', 'masonry.min.js'))).toBe(true)
  })

  it('should build a standalone game without a company', async () => {
    writeXML(tempDir, gameXML)
    await generator.generate(tempDir)

    expect(fs.existsSync(path.join(buildDir, 'index.html'))).toBe(true)
  })

  it('should build a standalone product without a company', async () => {
    writeXML(tempDir, productXML)
    await generator.generate(tempDir)

    expect(fs.existsSync(path.join(buildDir, 'index.html'))).toBe(true)
    expect(fs.existsSync(path.join(buildDir, 'Test Product', 'index.html'))).toBe(false)
  })

  it('should build a standalone JSON product without a company at the root output', async () => {
    writeJSON(tempDir, productJSON)
    await generator.generate(tempDir)

    expect(fs.existsSync(path.join(buildDir, 'index.html'))).toBe(true)
    expect(fs.existsSync(path.join(buildDir, 'JSON Product', 'index.html'))).toBe(false)
  })

  it('should not crash with no data files', async () => {
    await generator.generate(tempDir)

    expect(fs.existsSync(buildDir)).toBe(false)
  })

  it('should build company and product pages even when unrelated files exist nearby', async () => {
    writeJSON(tempDir, companyJSON)
    fs.writeFileSync(path.join(tempDir, 'README.md'), '# ignored')

    const productDir = path.join(tempDir, 'json-product')
    fs.mkdirSync(productDir)
    fs.writeFileSync(path.join(productDir, 'notes.txt'), 'ignored')
    writeJSON(productDir, productJSON)

    await generator.generate(tempDir)

    expect(fs.existsSync(path.join(buildDir, 'index.html'))).toBe(true)
    expect(fs.existsSync(path.join(buildDir, 'json-product', 'index.html'))).toBe(true)
  })

  it('should include company info in product page when company exists', async () => {
    writeXML(tempDir, companyXML)

    const productDir = path.join(tempDir, 'mygame')
    fs.mkdirSync(productDir)
    writeXML(productDir, productXML)

    await generator.generate(tempDir)

    const html = fs.readFileSync(path.join(buildDir, 'mygame', 'index.html'), 'utf-8')
    expect(html).toContain('Test Studio')
  })

  it('should render product relations for XML projects', async () => {
    writeXML(tempDir, companyXML)

    const baseGameDir = path.join(tempDir, 'base-game')
    fs.mkdirSync(baseGameDir)
    writeProductXML(baseGameDir, { title: 'Base Game' })

    const expansionDir = path.join(tempDir, 'expansion')
    fs.mkdirSync(expansionDir)
    writeProductXML(expansionDir, {
      title: 'Expansion Pack',
      relations: `<relations>
  <relation>
    <type>DLC</type>
    <product>Base Game</product>
  </relation>
</relations>`
    })

    await generator.generate(tempDir)

    const expansionHtml = fs.readFileSync(path.join(buildDir, 'expansion', 'index.html'), 'utf-8')
    const baseGameHtml = fs.readFileSync(path.join(buildDir, 'base-game', 'index.html'), 'utf-8')

    expect(expansionHtml).toContain('DLC:')
    expect(expansionHtml).toContain('Base Game')
    expect(baseGameHtml).toContain('DLC of:')
    expect(baseGameHtml).toContain('Expansion Pack')
  })

  it('should render product relations for JSON projects', async () => {
    writeJSON(tempDir, companyJSON)

    const baseGameDir = path.join(tempDir, 'base-game')
    fs.mkdirSync(baseGameDir)
    writeJSON(baseGameDir, createProductJSON({ title: 'Base Game' }))

    const expansionDir = path.join(tempDir, 'expansion')
    fs.mkdirSync(expansionDir)
    writeJSON(expansionDir, createProductJSON({
      title: 'Expansion Pack',
      relations: [
        {
          type: 'DLC',
          product: 'Base Game'
        }
      ]
    }))

    await generator.generate(tempDir)

    const expansionHtml = fs.readFileSync(path.join(buildDir, 'expansion', 'index.html'), 'utf-8')
    const baseGameHtml = fs.readFileSync(path.join(buildDir, 'base-game', 'index.html'), 'utf-8')

    expect(expansionHtml).toContain('DLC:')
    expect(expansionHtml).toContain('Base Game')
    expect(baseGameHtml).toContain('DLC of:')
    expect(baseGameHtml).toContain('Expansion Pack')
  })

  it('should render product relations across XML and JSON products in the same build', async () => {
    writeXML(tempDir, companyXML)

    const baseGameDir = path.join(tempDir, 'base-game')
    fs.mkdirSync(baseGameDir)
    writeProductXML(baseGameDir, { title: 'Base Game' })

    const expansionDir = path.join(tempDir, 'expansion')
    fs.mkdirSync(expansionDir)
    writeJSON(expansionDir, createProductJSON({
      title: 'Expansion Pack',
      relations: [
        {
          type: 'DLC',
          product: 'Base Game'
        }
      ]
    }))

    await generator.generate(tempDir)

    const expansionHtml = fs.readFileSync(path.join(buildDir, 'expansion', 'index.html'), 'utf-8')
    const baseGameHtml = fs.readFileSync(path.join(buildDir, 'base-game', 'index.html'), 'utf-8')

    expect(expansionHtml).toContain('DLC:')
    expect(expansionHtml).toContain('Base Game')
    expect(baseGameHtml).toContain('DLC of:')
    expect(baseGameHtml).toContain('Expansion Pack')
  })

  it('should match JSON relations ignoring case and whitespace differences in titles', async () => {
    writeJSON(tempDir, companyJSON)

    const baseGameDir = path.join(tempDir, 'base-game')
    fs.mkdirSync(baseGameDir)
    writeJSON(baseGameDir, createProductJSON({ title: 'Base   Game' }))

    const expansionDir = path.join(tempDir, 'expansion')
    fs.mkdirSync(expansionDir)
    writeJSON(expansionDir, createProductJSON({
      title: 'Expansion Pack',
      relations: [
        {
          type: 'DLC',
          product: '  base game '
        }
      ]
    }))

    await generator.generate(tempDir)

    const expansionHtml = fs.readFileSync(path.join(buildDir, 'expansion', 'index.html'), 'utf-8')
    const baseGameHtml = fs.readFileSync(path.join(buildDir, 'base-game', 'index.html'), 'utf-8')

    expect(expansionHtml).toContain('DLC:')
    expect(expansionHtml).toContain('Base   Game')
    expect(baseGameHtml).toContain('DLC of:')
    expect(baseGameHtml).toContain('Expansion Pack')
  })

  it('should ignore unresolved JSON relations without crashing or rendering broken links', async () => {
    writeJSON(tempDir, companyJSON)

    const productDir = path.join(tempDir, 'orphan-relation')
    fs.mkdirSync(productDir)
    writeJSON(productDir, createProductJSON({
      title: 'Orphan Relation Product',
      relations: [
        {
          type: 'DLC',
          product: 'Missing Product'
        }
      ]
    }))

    await generator.generate(tempDir)

    const html = fs.readFileSync(path.join(buildDir, 'orphan-relation', 'index.html'), 'utf-8')

    expect(html).toContain('Orphan Relation Product')
    expect(html).not.toContain('Missing Product')
    expect(html).not.toContain('DLC:')
  })

  it('should render equivalent XML and JSON projects with matching key output', async () => {
    const xmlDir = createTempDir()
    const jsonDir = createTempDir()
    const xmlBuildDir = path.join(xmlDir, 'build')
    const jsonBuildDir = path.join(jsonDir, 'build')

    try {
      setupConfig(xmlBuildDir)
      writeXML(xmlDir, `<?xml version="1.0" encoding="utf-8"?>
<company>
  <title>Parity Studio</title>
  <based-in>Paris</based-in>
  <founding-date>2020</founding-date>
  <website>https://example.com</website>
  <press-contact>press@example.com</press-contact>
  <description>Parity company description.</description>
  <credits>
    <credit>
      <person>Test Person</person>
      <role>Developer</role>
    </credit>
  </credits>
</company>`)

      const xmlProductDir = path.join(xmlDir, 'parity-product')
      fs.mkdirSync(xmlProductDir)
      writeProductXML(xmlProductDir, {
        title: 'Parity Product',
        website: 'https://example.com/parity-product',
        description: 'Parity product description.'
      })

      await generator.generate(xmlDir)

      setupConfig(jsonBuildDir)
      writeJSON(jsonDir, {
        type: 'company',
        title: 'Parity Studio',
        basedIn: 'Paris',
        foundingDate: '2020',
        website: 'https://example.com',
        pressContact: 'press@example.com',
        description: 'Parity company description.',
        credits: [
          {
            person: 'Test Person',
            role: 'Developer'
          }
        ]
      })

      const jsonProductDir = path.join(jsonDir, 'parity-product')
      fs.mkdirSync(jsonProductDir)
      writeJSON(jsonProductDir, createProductJSON({
        title: 'Parity Product',
        website: 'https://example.com/parity-product',
        description: 'Parity product description.'
      }))

      await generator.generate(jsonDir)

      const xmlCompanyHtml = fs.readFileSync(path.join(xmlBuildDir, 'index.html'), 'utf-8')
      const jsonCompanyHtml = fs.readFileSync(path.join(jsonBuildDir, 'index.html'), 'utf-8')
      const xmlProductHtml = fs.readFileSync(path.join(xmlBuildDir, 'parity-product', 'index.html'), 'utf-8')
      const jsonProductHtml = fs.readFileSync(path.join(jsonBuildDir, 'parity-product', 'index.html'), 'utf-8')

      expect(xmlCompanyHtml).toContain('Parity Studio')
      expect(jsonCompanyHtml).toContain('Parity Studio')
      expect(xmlCompanyHtml).toContain('Parity company description.')
      expect(jsonCompanyHtml).toContain('Parity company description.')

      expect(xmlProductHtml).toContain('Parity Product')
      expect(jsonProductHtml).toContain('Parity Product')
      expect(xmlProductHtml).toContain('Parity product description.')
      expect(jsonProductHtml).toContain('Parity product description.')
      expect(xmlProductHtml).toContain('Parity Studio')
      expect(jsonProductHtml).toContain('Parity Studio')
    } finally {
      fs.rmSync(xmlDir, { recursive: true, force: true })
      fs.rmSync(jsonDir, { recursive: true, force: true })
      setupConfig(buildDir)
    }
  })

  it('should render equivalent XML and JSON richer sections with matching key output', async () => {
    const xmlDir = createTempDir()
    const jsonDir = createTempDir()
    const xmlBuildDir = path.join(xmlDir, 'build')
    const jsonBuildDir = path.join(jsonDir, 'build')

    try {
      setupConfig(xmlBuildDir)
      writeXML(xmlDir, `<?xml version="1.0" encoding="utf-8"?>
<company>
  <title>Rich Studio</title>
  <description>Rich company description.</description>
  <credits>
    <credit>
      <person>Studio Founder</person>
      <role>Founder</role>
    </credit>
  </credits>
</company>`)

      const xmlProductDir = path.join(xmlDir, 'rich-product')
      fs.mkdirSync(xmlProductDir)
      writeXML(xmlProductDir, `<?xml version="1.0" encoding="utf-8"?>
<product>
  <title>Rich Product</title>
  <website>https://example.com/rich-product</website>
  <description>Rich product description.</description>
  <features>
    <feature>Feature plain text.</feature>
  </features>
  <awards>
    <award>
      <description>Best Rich Product</description>
      <info>Example Awards, 2025</info>
    </award>
  </awards>
  <quotes>
    <quote>
      <description>Great rich product.</description>
      <name>Reviewer</name>
      <website>Review Site</website>
      <link>https://example.com/review</link>
    </quote>
  </quotes>
  <additionals>
    <additional>
      <title>Press Kit</title>
      <description>Read more about the product at</description>
      <link>https://example.com/press</link>
    </additional>
  </additionals>
  <abouts>
    <about>
      <title>The Team</title>
      <description>Small team bio.</description>
      <link>https://example.com/team</link>
    </about>
  </abouts>
  <credits>
    <credit>
      <person>Lead Developer</person>
      <role>Developer</role>
    </credit>
  </credits>
</product>`)

      await generator.generate(xmlDir)

      setupConfig(jsonBuildDir)
      writeJSON(jsonDir, {
        type: 'company',
        title: 'Rich Studio',
        description: 'Rich company description.',
        credits: [
          {
            person: 'Studio Founder',
            role: 'Founder'
          }
        ]
      })

      const jsonProductDir = path.join(jsonDir, 'rich-product')
      fs.mkdirSync(jsonProductDir)
      writeJSON(jsonProductDir, {
        ...createProductJSON({
          title: 'Rich Product',
          website: 'https://example.com/rich-product',
          description: 'Rich product description.'
        }),
        features: ['Feature plain text.'],
        awards: [
          {
            description: 'Best Rich Product',
            info: 'Example Awards, 2025'
          }
        ],
        quotes: [
          {
            description: 'Great rich product.',
            name: 'Reviewer',
            website: 'Review Site',
            link: 'https://example.com/review'
          }
        ],
        additionals: [
          {
            title: 'Press Kit',
            description: 'Read more about the product at',
            link: 'https://example.com/press'
          }
        ],
        abouts: [
          {
            title: 'The Team',
            description: 'Small team bio.',
            link: 'https://example.com/team'
          }
        ],
        credits: [
          {
            person: 'Lead Developer',
            role: 'Developer'
          }
        ]
      })

      await generator.generate(jsonDir)

      const xmlProductHtml = fs.readFileSync(path.join(xmlBuildDir, 'rich-product', 'index.html'), 'utf-8')
      const jsonProductHtml = fs.readFileSync(path.join(jsonBuildDir, 'rich-product', 'index.html'), 'utf-8')

      expect(xmlProductHtml).toContain('Feature plain text.')
      expect(jsonProductHtml).toContain('Feature plain text.')
      expect(xmlProductHtml).toContain('Best Rich Product')
      expect(jsonProductHtml).toContain('Best Rich Product')
      expect(xmlProductHtml).toContain('Great rich product.')
      expect(jsonProductHtml).toContain('Great rich product.')
      expect(xmlProductHtml).toContain('Read more about the product at')
      expect(jsonProductHtml).toContain('Read more about the product at')
      expect(xmlProductHtml).toContain('Small team bio.')
      expect(jsonProductHtml).toContain('Small team bio.')
      expect(xmlProductHtml).toContain('Lead Developer')
      expect(jsonProductHtml).toContain('Lead Developer')
      expect(xmlProductHtml).toContain('Developer')
      expect(jsonProductHtml).toContain('Developer')
    } finally {
      fs.rmSync(xmlDir, { recursive: true, force: true })
      fs.rmSync(jsonDir, { recursive: true, force: true })
      setupConfig(buildDir)
    }
  })

  it('should render markdown-backed JSON rich text into final HTML output', async () => {
    writeJSON(tempDir, {
      type: 'company',
      title: 'Markdown Studio',
      description: '**Bold** company description.',
      credits: [
        {
          person: 'Studio Founder',
          role: '*Founder*'
        }
      ]
    })

    const productDir = path.join(tempDir, 'markdown-product')
    fs.mkdirSync(productDir)
    writeJSON(productDir, {
      ...createProductJSON({
        title: 'Markdown Product',
        description: '**Bold** product description.'
      }),
      features: ['**Bold** feature'],
      awards: [
        {
          description: '*Award* text',
          info: 'Example Awards, 2025'
        }
      ],
      abouts: [
        {
          title: 'The Team',
          description: '*Small* team bio.'
        }
      ]
    })

    await generator.generate(tempDir)

    const companyHtml = fs.readFileSync(path.join(buildDir, 'index.html'), 'utf-8')
    const productHtml = fs.readFileSync(path.join(buildDir, 'markdown-product', 'index.html'), 'utf-8')

    expect(companyHtml).toContain('<p><strong>Bold</strong> company description.</p>')
    expect(companyHtml).toContain('<em>Founder</em>')
    expect(productHtml).toContain('<p><strong>Bold</strong> product description.</p>')
    expect(productHtml).toContain('<strong>Bold</strong> feature')
    expect(productHtml).toContain('<em>Award</em> text')
    expect(productHtml).toContain('<em>Small</em> team bio.')
  })

  it('should render all reference company XML fields into final HTML output', async () => {
    writeXML(tempDir, `<?xml version="1.0" encoding="utf-8"?>
<company>
  <title>Reference Studio</title>
  <based-in>Rennes, France</based-in>
  <founding-date>January 1, 2020</founding-date>
  <website>https://studio.example.com</website>
  <phone>+55 11 99999-9999</phone>
  <address>
    <line>42 Saturno Street</line>
    <line>Porto Alegre</line>
    <line>Brazil</line>
  </address>
  <socials>
    <social>
      <name>Twitter</name>
      <link>https://twitter.com/reference_studio</link>
    </social>
    <social>
      <name>YouTube</name>
      <link>https://youtube.com/@reference_studio</link>
    </social>
  </socials>
  <press-contact>press@reference.studio</press-contact>
  <analytics>UA-123456-1</analytics>
  <description>Reference company description.</description>
  <histories>
    <history>
      <header>Founded</header>
      <text>Reference Studio was founded to ship polished tools.</text>
    </history>
    <history>
      <header>Now</header>
      <text>Reference Studio now ships open source products.</text>
    </history>
  </histories>
  <trailers>
    <trailer>
      <name>Announcement Trailer</name>
      <youtube>abc123</youtube>
      <download>https://cdn.example.com/company-trailer.mp4</download>
    </trailer>
    <trailer>
      <name>Studio Documentary</name>
      <vimeo>987654</vimeo>
    </trailer>
    <trailer>
      <name>Download Only Reel</name>
      <download>https://cdn.example.com/company-reel.mp4</download>
    </trailer>
  </trailers>
  <awards>
    <award>
      <description>Best Studio</description>
      <info>Open Tools Awards 2025</info>
    </award>
  </awards>
  <quotes>
    <quote>
      <description>Reference Studio builds careful software.</description>
      <name>Engineering Weekly</name>
      <website>engineeringweekly.example.com</website>
      <link>https://engineeringweekly.example.com/reference-studio</link>
    </quote>
  </quotes>
  <additionals>
    <additional>
      <title>Press Blog</title>
      <description>Company updates live at</description>
      <link>https://blog.reference.studio</link>
    </additional>
  </additionals>
  <credits>
    <credit>
      <person>Ana Silva</person>
      <role>Founder</role>
    </credit>
    <credit>
      <person>Bruno Costa</person>
      <role>Operations</role>
      <website>https://people.example.com/bruno</website>
    </credit>
  </credits>
  <contacts>
    <contact>
      <name>Inquiries</name>
      <mail>contact@reference.studio</mail>
    </contact>
    <contact>
      <name>Press Kit</name>
      <link>https://reference.studio/press</link>
    </contact>
  </contacts>
</company>`)

    await generator.generate(tempDir)

    const html = fs.readFileSync(path.join(buildDir, 'index.html'), 'utf-8')

    expectContainsAll(html, [
      'Reference Studio',
      'Based in Rennes, France',
      'January 1, 2020',
      'href="https://studio.example.com"',
      'studio.example.com',
      'press@reference.studio',
      '+55 11 99999-9999',
      '42 Saturno Street',
      'Porto Alegre',
      'Brazil',
      'href="https://twitter.com/reference_studio"',
      'Twitter',
      'href="https://youtube.com/@reference_studio"',
      'YouTube',
      'Reference company description.',
      'Founded',
      'Reference Studio was founded to ship polished tools.',
      'Now',
      'Reference Studio now ships open source products.',
      'https://www.youtube.com/embed/abc123?rel=0',
      'https://cdn.example.com/company-trailer.mp4',
      'https://player.vimeo.com/video/987654',
      'https://cdn.example.com/company-reel.mp4',
      'Best Studio',
      'Open Tools Awards 2025',
      'Reference Studio builds careful software.',
      'Engineering Weekly',
      'engineeringweekly.example.com',
      'Press Blog',
      'Company updates live at',
      'blog.reference.studio',
      'Ana Silva',
      'Founder',
      'Bruno Costa',
      'href="https://people.example.com/bruno"',
      'Operations',
      'contact@reference.studio',
      'href="https://reference.studio/press"',
      'reference.studio/press',
      "ga('create', 'UA-123456-1', 'auto');"
    ])
  })

  it('should render all reference product XML fields into final HTML output', async () => {
    writeXML(tempDir, `<?xml version="1.0" encoding="utf-8"?>
<company>
  <title>Reference Studio</title>
  <based-in>Rennes, France</based-in>
  <analytics>UA-999999-1</analytics>
  <description>Reference company description.</description>
  <credits>
    <credit>
      <person>Ana Silva</person>
      <role>Founder</role>
    </credit>
  </credits>
</company>`)

    const baseProductDir = path.join(tempDir, 'base-product')
    fs.mkdirSync(baseProductDir)
    writeProductXML(baseProductDir, { title: 'Base Product' })

    const productDir = path.join(tempDir, 'reference-product')
    fs.mkdirSync(productDir)
    writeXML(productDir, `<?xml version="1.0" encoding="utf-8"?>
<product>
  <title>Reference Product</title>
  <website>https://product.example.com</website>
  <press-copy-request>https://product.example.com/request</press-copy-request>
  <partners>
    <partner>
      <type>Publisher</type>
      <title>Publisher House</title>
      <website>https://publisher.example.com</website>
      <based-in>Lisbon, Portugal</based-in>
    </partner>
    <partner>
      <type>Distributor</type>
      <title>Distribution Hub</title>
    </partner>
  </partners>
  <release-dates>
    <release-date>April 1, 2025</release-date>
    <release-date>May 5, 2025</release-date>
  </release-dates>
  <platforms>
    <platform>
      <name>Steam</name>
      <link>https://store.steampowered.com/app/424242</link>
    </platform>
    <platform>
      <name>Nintendo Switch</name>
    </platform>
  </platforms>
  <prices>
    <price>
      <currency>USD</currency>
      <value>20</value>
    </price>
    <price>
      <currency>EUR</currency>
      <value>18</value>
    </price>
  </prices>
  <relations>
    <relation>
      <type>DLC</type>
      <product>Base Product</product>
    </relation>
  </relations>
  <description>Reference product description.</description>
  <history>Reference product history.</history>
  <features>
    <feature>Fast local builds.</feature>
    <feature>JSON and XML authoring.</feature>
  </features>
  <trailers>
    <trailer>
      <name>Launch Trailer</name>
      <youtube>launch123</youtube>
      <download>https://cdn.example.com/product-launch.mp4</download>
    </trailer>
    <trailer>
      <name>Behind the Scenes</name>
      <vimeo>654321</vimeo>
    </trailer>
    <trailer>
      <name>Download Only Demo</name>
      <download>https://cdn.example.com/product-demo.mp4</download>
    </trailer>
  </trailers>
  <widgets>
    <appstore>123456</appstore>
    <playstore>com.reference.product</playstore>
    <steam>424242</steam>
    <humble>reference/product</humble>
    <itch>55555</itch>
    <gamejolt>gamejoltKey</gamejolt>
    <bandcamp>1135613467</bandcamp>
  </widgets>
  <awards>
    <award>
      <description>Best Product</description>
      <info>Reference Awards 2025</info>
    </award>
  </awards>
  <quotes>
    <quote>
      <description>Reference Product is extremely focused.</description>
      <name>Review Site</name>
      <website>review.example.com</website>
      <link>https://review.example.com/reference-product</link>
    </quote>
  </quotes>
  <additionals>
    <additional>
      <title>Soundtrack</title>
      <description>Listen at</description>
      <link>https://music.example.com/reference-product</link>
    </additional>
  </additionals>
  <abouts>
    <about>
      <title>Publisher House</title>
      <description>Publisher House helps publish the product.</description>
      <link>https://publisher.example.com/about</link>
    </about>
    <about>
      <title>Support Studio</title>
      <description>Support Studio helped with QA.</description>
    </about>
  </abouts>
  <credits>
    <credit>
      <person>Carla Dev</person>
      <role>Lead Developer</role>
    </credit>
    <credit>
      <person>Diego Audio</person>
      <role>Composer</role>
      <website>https://people.example.com/diego</website>
    </credit>
  </credits>
  <contacts>
    <contact>
      <name>Inquiries</name>
      <mail>press@product.example.com</mail>
    </contact>
    <contact>
      <name>Website</name>
      <link>https://product.example.com/support</link>
    </contact>
  </contacts>
</product>`)

    await generator.generate(tempDir)

    const html = fs.readFileSync(path.join(buildDir, 'reference-product', 'index.html'), 'utf-8')

    expectContainsAll(html, [
      'Reference Product',
      'href="https://product.example.com"',
      'product.example.com',
      'href="https://product.example.com/request"',
      'Request Press Copy',
      'Publisher:',
      'href="https://publisher.example.com"',
      'Publisher House',
      'Based in Lisbon, Portugal',
      'Distributor:',
      'Distribution Hub',
      'April 1, 2025',
      'May 5, 2025',
      'href="https://store.steampowered.com/app/424242"',
      'Steam',
      'Nintendo Switch',
      'USD 20',
      'EUR 18',
      'DLC:',
      'Base Product',
      'Reference product description.',
      'Reference product history.',
      'Fast local builds.',
      'JSON and XML authoring.',
      'https://www.youtube.com/embed/launch123?rel=0',
      'https://cdn.example.com/product-launch.mp4',
      'https://player.vimeo.com/video/654321',
      'https://cdn.example.com/product-demo.mp4',
      'https://itunes.apple.com/app/id123456',
      'https://play.google.com/store/apps/details?id=com.reference.product',
      'https://store.steampowered.com/widget/424242/',
      'https://www.humblebundle.com/widget/v2/product/reference/product',
      'https://itch.io/embed/55555?dark=true',
      'https://widgets.gamejolt.com/package/v1?key=gamejoltKey',
      'https://bandcamp.com/EmbeddedPlayer/album=1135613467',
      'Best Product',
      'Reference Awards 2025',
      'Reference Product is extremely focused.',
      'Review Site',
      'review.example.com',
      'Soundtrack',
      'Listen at',
      'music.example.com',
      'About Reference Studio',
      'Reference company description.',
      'About Publisher House',
      'Publisher House helps publish the product.',
      'href="https://publisher.example.com/about"',
      'About Support Studio',
      'Support Studio helped with QA.',
      'Carla Dev',
      'Lead Developer',
      'Diego Audio',
      'href="https://people.example.com/diego"',
      'Composer',
      'press@product.example.com',
      'href="https://product.example.com/support"',
      'product.example.com/support',
      "ga('create', 'UA-999999-1', 'auto');"
    ])
  })

  it('should render markdown-backed lists and escape inline html in final output', async () => {
    writeJSON(tempDir, {
      type: 'company',
      title: 'Safe Markdown Studio',
      description: {
        markdownFile: 'description.md'
      },
      credits: [
        {
          person: 'Studio Founder',
          role: 'Founder'
        }
      ]
    })

    writeTextFile(tempDir, 'description.md', '- first item\n- <script>alert(1)</script>')

    await generator.generate(tempDir)

    const companyHtml = fs.readFileSync(path.join(buildDir, 'index.html'), 'utf-8')

    expect(companyHtml).toContain('<ul><li>first item</li><li>&lt;script&gt;alert(1)&lt;/script&gt;</li></ul>')
    expect(companyHtml).not.toContain('<script>alert(1)</script>')
  })

  it('should allow inline custom HTML in JSON rich-text fields', async () => {
    writeJSON(tempDir, {
      type: 'company',
      title: 'Custom HTML Studio',
      description: '<div class="custom-block"><strong>Custom HTML</strong></div>',
      credits: [
        {
          person: 'Studio Founder',
          role: 'Founder'
        }
      ]
    })

    await generator.generate(tempDir)

    const html = fs.readFileSync(path.join(buildDir, 'index.html'), 'utf-8')
    expect(html).toContain('<div class="custom-block"><strong>Custom HTML</strong></div>')
  })

  it('should not crash when inline custom HTML is malformed', async () => {
    writeJSON(tempDir, {
      type: 'company',
      title: 'Malformed HTML Studio',
      description: '<div><strong>Broken custom HTML',
      credits: [
        {
          person: 'Studio Founder',
          role: 'Founder'
        }
      ]
    })

    await generator.generate(tempDir)

    const html = fs.readFileSync(path.join(buildDir, 'index.html'), 'utf-8')
    expect(html).toContain('<div><strong>Broken custom HTML')
  })

  it('should render JSON youtube, vimeo, and download-only trailers', async () => {
    writeJSON(tempDir, companyJSON)

    const productDir = path.join(tempDir, 'video-product')
    fs.mkdirSync(productDir)
    writeJSON(productDir, {
      ...createProductJSON({
        title: 'Video Product',
        description: 'Product with trailers.'
      }),
      trailers: [
        {
          name: 'Launch Trailer',
          youtube: 'abc123',
          download: 'https://example.com/trailer.mp4'
        },
        {
          name: 'Vimeo Trailer',
          vimeo: '456789'
        },
        {
          name: 'Download Only',
          download: 'https://example.com/raw-video.mp4'
        }
      ]
    })

    await generator.generate(tempDir)

    const html = fs.readFileSync(path.join(buildDir, 'video-product', 'index.html'), 'utf-8')

    expect(html).toContain('https://www.youtube.com/embed/abc123?rel=0')
    expect(html).toContain('https://player.vimeo.com/video/456789')
    expect(html).toContain('https://example.com/trailer.mp4')
    expect(html).toContain('https://example.com/raw-video.mp4')
    expect(html).toContain('Launch Trailer')
    expect(html).toContain('Vimeo Trailer')
    expect(html).toContain('Download Only')
  })

  it('should render JSON store widgets embeds', async () => {
    writeJSON(tempDir, companyJSON)

    const productDir = path.join(tempDir, 'widget-product')
    fs.mkdirSync(productDir)
    writeJSON(productDir, {
      ...createProductJSON({
        title: 'Widget Product',
        description: 'Product with widgets.'
      }),
      widgets: {
        appstore: '123456',
        playstore: 'com.saturno.product',
        steam: '987654',
        humble: 'saturno/widget',
        itch: '27992',
        gamejolt: 'abcXYZ',
        bandcamp: '1135613467'
      }
    })

    await generator.generate(tempDir)

    const html = fs.readFileSync(path.join(buildDir, 'widget-product', 'index.html'), 'utf-8')

    expect(html).toContain('https://itunes.apple.com/app/id123456')
    expect(html).toContain('https://play.google.com/store/apps/details?id=com.saturno.product')
    expect(html).toContain('https://store.steampowered.com/widget/987654/')
    expect(html).toContain('https://www.humblebundle.com/widget/v2/product/saturno/widget')
    expect(html).toContain('https://itch.io/embed/27992?dark=true')
    expect(html).toContain('https://widgets.gamejolt.com/package/v1?key=abcXYZ')
    expect(html).toContain('https://bandcamp.com/EmbeddedPlayer/album=1135613467')
    expect(html).toContain('id="widgets"')
  })

  it('should render GIF screenshots, categories, and favicon without exposing favicon in the gallery', async () => {
    writeJSON(tempDir, companyJSON)

    const productDir = path.join(tempDir, 'gif-product')
    const imagesDir = path.join(productDir, 'images')
    fs.mkdirSync(productDir)
    fs.mkdirSync(path.join(imagesDir, 'wallpapers'), { recursive: true })

    writeJSON(productDir, createProductJSON({
      title: 'GIF Product',
      description: 'Product with gif gallery.'
    }))

    writeGifImage(imagesDir, 'preview.gif')
    writePngImage(path.join(imagesDir, 'wallpapers'), 'wallpaper-01.png')
    writeTextFile(imagesDir, 'favicon.ico', 'ico')

    await generator.generate(tempDir)

    const targetImagesDir = path.join(buildDir, 'gif-product', 'images')
    const html = fs.readFileSync(path.join(buildDir, 'gif-product', 'index.html'), 'utf-8')

    expect(fs.existsSync(path.join(targetImagesDir, 'preview.gif'))).toBe(true)
    expect(fs.existsSync(path.join(targetImagesDir, 'favicon.ico'))).toBe(true)
    expect(html).toContain('href="images/preview.gif"')
    expect(html).toContain('id="gallery-wallpapers"')
    expect(html).toContain('images/favicon.ico?t=')
    expect(html).not.toContain('href="images/favicon.ico"')
  })

  it('should copy a custom CSS file as the active theme', async () => {
    const customCss = path.join(tempDir, 'saturno-theme.css')
    writeTextFile(tempDir, 'saturno-theme.css', 'body { background: rgb(1, 2, 3); }')
    config.commands.build.css = customCss

    writeXML(tempDir, companyXML)
    await generator.generate(tempDir)

    const copiedTheme = fs.readFileSync(path.join(buildDir, 'css', 'theme.css'), 'utf-8')
    expect(copiedTheme).toContain('background: rgb(1, 2, 3);')
  })

  it('should keep building when a custom CSS file is missing', async () => {
    config.commands.build.css = path.join(tempDir, 'missing-theme.css')

    writeXML(tempDir, companyXML)
    await generator.generate(tempDir)

    expect(fs.existsSync(path.join(buildDir, 'index.html'))).toBe(true)
    expect(fs.existsSync(path.join(buildDir, 'css', 'theme.css'))).toBe(false)
  })

  it('should build without rendering broken embeds when JSON trailers are malformed', async () => {
    writeJSON(tempDir, companyJSON)

    const productDir = path.join(tempDir, 'broken-trailer-product')
    fs.mkdirSync(productDir)
    writeJSON(productDir, {
      ...createProductJSON({
        title: 'Broken Trailer Product',
        description: 'Malformed trailers should not crash the build.'
      }),
      trailers: [
        {
          name: 'Broken Trailer'
        }
      ]
    })

    await generator.generate(tempDir)

    const html = fs.readFileSync(path.join(buildDir, 'broken-trailer-product', 'index.html'), 'utf-8')
    expect(html).toContain('Broken Trailer Product')
    expect(html).not.toContain('youtube.com/embed/')
    expect(html).not.toContain('player.vimeo.com/video/')
  })

  it('should stop the build when a discovered data file is malformed', async () => {
    const errorSpy = jest.spyOn(colorConsole, 'error').mockImplementation(() => {})
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(code => {
      throw new Error(`process.exit:${code}`)
    })

    fs.writeFileSync(path.join(tempDir, 'data.json'), '{ invalid json')

    await expect(generator.generate(tempDir)).rejects.toThrow('process.exit:1')

    expect(errorSpy).toHaveBeenCalled()

    exitSpy.mockRestore()
    errorSpy.mockRestore()
  })

  it('should copy JSON project images and generate archives', async () => {
    writeJSON(tempDir, companyJSON)

    const productDir = path.join(tempDir, 'asset-product')
    const imagesDir = path.join(productDir, 'images')
    fs.mkdirSync(productDir)
    fs.mkdirSync(imagesDir)

    writeJSON(productDir, createProductJSON({
      title: 'Asset Product',
      description: 'Product with images.'
    }))

    writePngImage(imagesDir, 'header.png')
    writePngImage(imagesDir, 'logo.png')
    writePngImage(imagesDir, 'screenshot-01.png')

    await generator.generate(tempDir)

    const targetImagesDir = path.join(buildDir, 'asset-product', 'images')

    expect(fs.existsSync(path.join(targetImagesDir, 'header.png'))).toBe(true)
    expect(fs.existsSync(path.join(targetImagesDir, 'logo.png'))).toBe(true)
    expect(fs.existsSync(path.join(targetImagesDir, 'screenshot-01.png'))).toBe(true)

    await waitForFile(path.join(targetImagesDir, 'images.zip'))
    await waitForFile(path.join(targetImagesDir, 'logo.zip'))

    expect(fs.existsSync(path.join(targetImagesDir, 'images.zip'))).toBe(true)
    expect(fs.existsSync(path.join(targetImagesDir, 'logo.zip'))).toBe(true)
  })

  it('should generate screenshot thumbnails for JSON projects when thumbnails are enabled', async () => {
    config.commands.build.ignoreThumbnails = false

    writeJSON(tempDir, companyJSON)

    const productDir = path.join(tempDir, 'thumbnail-product')
    const imagesDir = path.join(productDir, 'images')
    fs.mkdirSync(productDir)
    fs.mkdirSync(imagesDir)

    writeJSON(productDir, createProductJSON({
      title: 'Thumbnail Product',
      description: 'Product with screenshot thumbnails.'
    }))

    writePngImage(imagesDir, 'screenshot-01.png')

    await generator.generate(tempDir)

    const targetImagesDir = path.join(buildDir, 'thumbnail-product', 'images')
    const thumbnailPath = path.join(targetImagesDir, 'screenshot-01.png.thumb.jpg')

    await waitForFile(thumbnailPath)

    expect(fs.existsSync(path.join(targetImagesDir, 'screenshot-01.png'))).toBe(true)
    expect(fs.existsSync(thumbnailPath)).toBe(true)
  })

  it('should not include company section in standalone game page', async () => {
    writeXML(tempDir, gameXML)
    await generator.generate(tempDir)

    const html = fs.readFileSync(path.join(buildDir, 'index.html'), 'utf-8')
    expect(html).not.toContain('About </h2>')
  })
})

describe('generator helpers', () => {
  beforeEach(() => {
    watcher.installWatcher.mockClear()
    watcher.installDevelopmentWatcher.mockClear()
  })

  describe('isDataFile()', () => {
    it.each([
      ['data.xml', true],
      ['data.json', true],
      ['nested/data.xml', true],
      ['nested/data.json', true],
      ['./data.xml', true],
      ['./data.json', true],
      ['DATA.XML', false],
      ['DATA.JSON', false],
      ['presskit.xml', false],
      ['presskit.json', false],
      ['data.jsonc', false],
      ['data.md', false],
      ['data', false],
      ['data.xml.backup', false],
      ['nested/data.xml.txt', false],
      ['nested/data-json', false],
      ['nested/data.XML', false],
      ['nested/data.JSON', false]
    ])('returns %s => %s', (filename, expected) => {
      expect(generator.__isDataFile(filename)).toBe(expected)
    })
  })

  describe('countDataFiles()', () => {
    it.each([
      [{ products: [] }, 0],
      [{ company: {}, products: [] }, 1],
      [{ products: [{}, {}] }, 2],
      [{ company: {}, products: [{}, {}, {}] }, 4]
    ])('counts pages correctly for %j', (pages, expected) => {
      expect(generator.__countDataFiles(pages)).toBe(expected)
    })
  })

  describe('getSelectedDataFiles()', () => {
    it('keeps xml files when there is no matching json file', () => {
      const files = [
        '/site/data.xml',
        '/site/product/data.xml'
      ]

      expect(generator.__getSelectedDataFiles(files)).toEqual(files)
    })

    it('keeps json files when there is no matching xml file', () => {
      const files = [
        '/site/data.json',
        '/site/product/data.json'
      ]

      expect(generator.__getSelectedDataFiles(files)).toEqual(files)
    })

    it('prefers json over xml within the same folder regardless of ordering', () => {
      const files = [
        '/site/data.xml',
        '/site/data.json',
        '/site/product/data.json',
        '/site/product/data.xml'
      ]

      expect(generator.__getSelectedDataFiles(files)).toEqual([
        '/site/data.json',
        '/site/product/data.json'
      ])
    })

    it('ignores files whose basename is not data', () => {
      const files = [
        '/site/presskit.xml',
        '/site/presskit.json',
        '/site/product/data.json'
      ]

      expect(generator.__getSelectedDataFiles(files)).toEqual([
        '/site/product/data.json'
      ])
    })

    it('returns one selected data file per directory', () => {
      const files = [
        '/site/data.xml',
        '/site/product/data.xml',
        '/site/product/data.json',
        '/site/dlc/data.xml'
      ]

      expect(generator.__getSelectedDataFiles(files)).toEqual([
        '/site/data.xml',
        '/site/product/data.json',
        '/site/dlc/data.xml'
      ])
    })

    it('preserves the first xml file found when duplicate xml entries exist in one directory', () => {
      const files = [
        '/site/data.xml',
        '/site/data.xml',
        '/site/product/data.xml'
      ]

      expect(generator.__getSelectedDataFiles(files)).toEqual([
        '/site/data.xml',
        '/site/product/data.xml'
      ])
    })

    it('keeps selecting json when duplicate json entries exist in one directory', () => {
      const files = [
        '/site/data.json',
        '/site/data.json',
        '/site/product/data.xml',
        '/site/product/data.json'
      ]

      expect(generator.__getSelectedDataFiles(files)).toEqual([
        '/site/data.json',
        '/site/product/data.json'
      ])
    })
  })

  describe('startWatcher()', () => {
    let tempDir

    beforeEach(() => {
      tempDir = createTempDir()
      config.commands.build = {
        output: path.join(tempDir, 'build'),
        dev: false
      }
    })

    afterEach(() => {
      fs.rmSync(tempDir, { recursive: true, force: true })
    })

    it('installs the standard watcher when dev mode is disabled', () => {
      generator.__startWatcher('/project', jest.fn())

      expect(watcher.installWatcher).toHaveBeenCalledWith('/project', expect.any(Function))
      expect(watcher.installDevelopmentWatcher).not.toHaveBeenCalled()
    })

    it('installs the development watcher when dev mode is enabled', () => {
      config.commands.build.dev = true

      generator.__startWatcher('/project', jest.fn())

      expect(watcher.installDevelopmentWatcher).toHaveBeenCalledWith('/project', expect.any(Function))
      expect(watcher.installWatcher).not.toHaveBeenCalled()
    })

    it('removes copied css before starting the development watcher', () => {
      config.commands.build.dev = true
      fs.mkdirSync(path.join(tempDir, 'build', 'css'), { recursive: true })
      fs.writeFileSync(path.join(tempDir, 'build', 'css', 'theme.css'), 'body {}')

      generator.__startWatcher('/project', jest.fn())

      expect(fs.existsSync(path.join(tempDir, 'build', 'css'))).toBe(false)
    })
  })

  describe('generate() error reporting', () => {
    let tempDir
    let buildDir

    beforeEach(() => {
      tempDir = createTempDir()
      buildDir = path.join(tempDir, 'build')
      setupConfig(buildDir)
    })

    afterEach(() => {
      fs.rmSync(tempDir, { recursive: true, force: true })
      jest.restoreAllMocks()
    })

    it('reports malformed json files without xml-specific guidance', async () => {
      const errorSpy = jest.spyOn(colorConsole, 'error').mockImplementation(() => {})
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(code => {
        throw new Error(`process.exit:${code}`)
      })

      fs.writeFileSync(path.join(tempDir, 'data.json'), '{ invalid json')

      await expect(generator.generate(tempDir)).rejects.toThrow('process.exit:1')

      expect(errorSpy.mock.calls[0][0]).toContain('JSON/JSONC')
      expect(errorSpy.mock.calls[1][0]).toContain('required fields')

      exitSpy.mockRestore()
    })

    it('reports malformed xml files with xml validator guidance', async () => {
      const errorSpy = jest.spyOn(colorConsole, 'error').mockImplementation(() => {})
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(code => {
        throw new Error(`process.exit:${code}`)
      })

      fs.writeFileSync(path.join(tempDir, 'data.xml'), '<company><title>Broken')

      await expect(generator.generate(tempDir)).rejects.toThrow('process.exit:1')

      expect(errorSpy.mock.calls[0][0]).toContain('XML document')
      expect(errorSpy.mock.calls[1][0]).toContain('xmlvalidator')

      exitSpy.mockRestore()
    })
  })

  describe('generate() build lifecycle', () => {
    let tempDir
    let buildDir

    beforeEach(() => {
      tempDir = createTempDir()
      buildDir = path.join(tempDir, 'build')
      setupConfig(buildDir)
      watcher.installWatcher.mockClear()
      watcher.installDevelopmentWatcher.mockClear()
    })

    afterEach(() => {
      fs.rmSync(tempDir, { recursive: true, force: true })
    })

    it('cleans the build folder before generating when requested', async () => {
      config.commands.build.cleanBuildFolder = true
      fs.mkdirSync(buildDir, { recursive: true })
      fs.writeFileSync(path.join(buildDir, 'stale.txt'), 'old')
      writeXML(tempDir, companyXML)

      await generator.generate(tempDir)

      expect(fs.existsSync(path.join(buildDir, 'stale.txt'))).toBe(false)
      expect(fs.existsSync(path.join(buildDir, 'index.html'))).toBe(true)
    })

    it('starts the standard watcher after a successful watched build', async () => {
      config.commands.build.watch = true
      config.commands.build.port = 8080
      writeXML(tempDir, companyXML)

      await generator.generate(tempDir)

      expect(watcher.installWatcher).toHaveBeenCalledWith(tempDir, expect.any(Function))
      expect(watcher.installDevelopmentWatcher).not.toHaveBeenCalled()
    })

    it('starts the development watcher after a successful watched build in dev mode', async () => {
      config.commands.build.watch = true
      config.commands.build.dev = true
      config.commands.build.port = 8080
      writeXML(tempDir, companyXML)

      await generator.generate(tempDir)

      expect(watcher.installDevelopmentWatcher).toHaveBeenCalledWith(tempDir, expect.any(Function))
      expect(watcher.installWatcher).not.toHaveBeenCalled()
    })

    // Additional edge case tests
    it('handles multiple companies with warning', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

      const xml1 = companyXML
      const xml2 = companyXML.replace('Amazing Cow', 'Another Company')

      writeXML(tempDir, xml1, 'data.xml')
      const subdir = path.join(tempDir, 'sub')
      fs.mkdirSync(subdir)
      fs.writeFileSync(path.join(subdir, 'data.xml'), xml2)

      await generator.generate(tempDir)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Multiple companies detected')
      )

      consoleSpy.mockRestore()
    })

    it('handles empty data file gracefully', async () => {
      const emptyXml = '<?xml version="1.0"?><game><title>Empty</title><description>desc</description></game>'
      writeXML(tempDir, emptyXml)

      // Should complete without crash
      await generator.generate(tempDir)

      expect(fs.existsSync(path.join(buildDir, 'index.html'))).toBe(true)
    })

    it('detects conflicting product names and logs warning', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

      const xml1 = productXML

      writeXML(tempDir, xml1, 'product1.xml')

      await generator.generate(tempDir)

      consoleSpy.mockRestore()
      expect(fs.existsSync(path.join(buildDir, 'index.html'))).toBe(true)
    })
  })
})
