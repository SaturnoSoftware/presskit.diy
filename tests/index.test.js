'use strict'

const fs = require('fs')
const path = require('path')
const os = require('os')

jest.mock('../lib/core/generator', () => ({
  generate: jest.fn()
}))

jest.mock('../lib/helpers/color-console', () => ({
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}))

const presskit = require('../lib/index')
const generator = require('../lib/core/generator')
const console = require('../lib/helpers/color-console')
const config = require('../lib/config')
const { loadDataFile } = require('../lib/core/loader')
const {
  __parseEntryPoint: parseEntryPoint,
  __normalizeBuildLaunchOptions: normalizeBuildLaunchOptions
} = require('../lib/index')

// -------------------------------------------------------------
// Helpers.
// -------------------------------------------------------------

function createTempDir () {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'presskit-index-test-'))
}

function waitForAsyncFs () {
  return new Promise(resolve => setTimeout(resolve, 25))
}

// -------------------------------------------------------------
// Tests.
// -------------------------------------------------------------

describe('runBuildCommand()', () => {
  let tempDir
  let cwdSpy

  beforeEach(() => {
    tempDir = createTempDir()
    generator.generate.mockClear()
    console.warn.mockClear()
    console.log.mockClear()
    cwdSpy = jest.spyOn(process, 'cwd').mockReturnValue(tempDir)
  })

  afterEach(() => {
    cwdSpy.mockRestore()
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  it('stores build launch options in config', async () => {
    const options = {
      entryPoint: tempDir,
      output: path.join(tempDir, 'build'),
      watch: true
    }

    presskit.runBuildCommand(options)
    await waitForAsyncFs()

    expect(config.commands.build).toEqual({
      ...options,
      css: undefined
    })
  })

  it('normalizes windows-style build paths before storing config on non-windows hosts', async () => {
    presskit.runBuildCommand({
      entryPoint: 'C:\\workspace\\presskit',
      output: 'C:\\workspace\\presskit\\build',
      css: 'C:\\workspace\\presskit\\themes\\saturno.css'
    })
    await waitForAsyncFs()

    const expected = process.platform === 'win32'
      ? {
          entryPoint: path.normalize('C:\\workspace\\presskit'),
          output: path.normalize('C:\\workspace\\presskit\\build'),
          css: path.normalize('C:\\workspace\\presskit\\themes\\saturno.css')
        }
      : {
          entryPoint: '/mnt/c/workspace/presskit',
          output: '/mnt/c/workspace/presskit/build',
          css: '/mnt/c/workspace/presskit/themes/saturno.css'
        }

    expect(config.commands.build).toEqual(expect.objectContaining(expected))
  })

  it('normalizes backslash-separated relative build paths before storing config', async () => {
    presskit.runBuildCommand({
      entryPoint: 'demo\\presskit',
      output: 'build\\preview',
      css: 'themes\\saturno.css'
    })
    await waitForAsyncFs()

    const expected = process.platform === 'win32'
      ? {
          entryPoint: path.normalize('demo\\presskit'),
          output: path.normalize('build\\preview'),
          css: path.normalize('themes\\saturno.css')
        }
      : {
          entryPoint: 'demo/presskit',
          output: 'build/preview',
          css: 'themes/saturno.css'
        }

    expect(config.commands.build).toEqual(expect.objectContaining(expected))
  })

  it('builds the current working directory when no entry point is provided', async () => {
    presskit.runBuildCommand({})
    await waitForAsyncFs()

    expect(generator.generate).toHaveBeenCalledWith(tempDir)
  })

  it('builds the provided directory when the entry point is a directory', async () => {
    const entryDir = path.join(tempDir, 'project')
    fs.mkdirSync(entryDir)

    presskit.runBuildCommand({ entryPoint: entryDir })
    await waitForAsyncFs()

    expect(generator.generate).toHaveBeenCalledWith(entryDir)
  })

  it('builds the parent directory when the entry point is a file', async () => {
    const entryDir = path.join(tempDir, 'project')
    fs.mkdirSync(entryDir)
    const entryFile = path.join(entryDir, 'data.json')
    fs.writeFileSync(entryFile, '{}')

    presskit.runBuildCommand({ entryPoint: entryFile })
    await waitForAsyncFs()

    expect(generator.generate).toHaveBeenCalledWith(entryDir)
  })

  it('falls back to current working directory when the entry point does not exist', async () => {
    presskit.runBuildCommand({ entryPoint: path.join(tempDir, 'missing') })
    await waitForAsyncFs()

    expect(console.warn).toHaveBeenCalledWith('No valid entry point provided. Use current directory instead')
    expect(generator.generate).toHaveBeenCalledWith(tempDir)
  })

  it('falls back to current working directory when the entry point is neither file nor directory', async () => {
    const statSpy = jest.spyOn(fs, 'stat').mockImplementation((entry, cb) => {
      cb(null, {
        isDirectory: () => false,
        isFile: () => false
      })
    })

    presskit.runBuildCommand({ entryPoint: path.join(tempDir, 'weird') })
    await waitForAsyncFs()

    expect(console.warn).toHaveBeenCalledWith('No valid entry point provided. Use current directory instead')
    expect(generator.generate).toHaveBeenCalledWith(tempDir)

    statSpy.mockRestore()
  })

  it('logs an empty line before falling back to current working directory', async () => {
    presskit.runBuildCommand({ entryPoint: path.join(tempDir, 'missing') })
    await waitForAsyncFs()

    expect(console.log).toHaveBeenCalledWith('')
  })

  it('does not warn when a valid directory entry point is provided', async () => {
    presskit.runBuildCommand({ entryPoint: tempDir })
    await waitForAsyncFs()

    expect(console.warn).not.toHaveBeenCalled()
  })

  it('calls generator only once for a valid directory entry point', async () => {
    presskit.runBuildCommand({ entryPoint: tempDir })
    await waitForAsyncFs()

    expect(generator.generate).toHaveBeenCalledTimes(1)
  })
})

describe('runNewCommand()', () => {
  let tempDir

  beforeEach(() => {
    tempDir = createTempDir()
    console.error.mockClear()
    console.log.mockClear()
  })

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  it('creates a company data.json and images folder', () => {
    presskit.runNewCommand('company', tempDir)

    const dataFile = path.join(tempDir, 'data.json')
    const imagesDir = path.join(tempDir, 'images')
    const descriptionFile = path.join(tempDir, 'description.md')

    expect(fs.existsSync(dataFile)).toBe(true)
    expect(fs.existsSync(imagesDir)).toBe(true)
    expect(fs.existsSync(descriptionFile)).toBe(true)

    const raw = fs.readFileSync(dataFile, 'utf-8')
    const data = loadDataFile(dataFile)

    expect(raw).toContain('//')
    expect(data.type).toBe('company')
    expect(data.title).toBe('Your Company Name')
    expect(raw).toContain('// Optional')
  })

  it('creates the destination folder for a new company scaffold when missing', () => {
    const targetDir = path.join(tempDir, 'company-site')

    presskit.runNewCommand('company', targetDir)

    expect(fs.existsSync(path.join(targetDir, 'data.json'))).toBe(true)
    expect(fs.existsSync(path.join(targetDir, 'description.md'))).toBe(true)
    expect(fs.existsSync(path.join(targetDir, 'images'))).toBe(true)
  })

  it('normalizes backslash-separated destinations before scaffolding on non-windows hosts', () => {
    const rawDestination = process.platform === 'win32'
      ? path.join(tempDir, 'windows-site')
      : `${tempDir.replace(/\//g, '\\')}\\windows-site`

    presskit.runNewCommand('company', rawDestination)

    const expectedDir = process.platform === 'win32'
      ? rawDestination
      : path.join(tempDir, 'windows-site')

    expect(fs.existsSync(path.join(expectedDir, 'data.json'))).toBe(true)
    expect(fs.existsSync(path.join(expectedDir, 'description.md'))).toBe(true)
    expect(fs.existsSync(path.join(expectedDir, 'images'))).toBe(true)
  })

  it('creates a product/data.json and images folder', () => {
    presskit.runNewCommand('product', tempDir)

    const dataFile = path.join(tempDir, 'product', 'data.json')
    const imagesDir = path.join(tempDir, 'product', 'images')
    const descriptionFile = path.join(tempDir, 'product', 'description.md')

    expect(fs.existsSync(dataFile)).toBe(true)
    expect(fs.existsSync(imagesDir)).toBe(true)
    expect(fs.existsSync(descriptionFile)).toBe(true)

    const raw = fs.readFileSync(dataFile, 'utf-8')
    const data = loadDataFile(dataFile)

    expect(raw).toContain('//')
    expect(data.type).toBe('product')
    expect(data.title).toBe('Your Product Name')
    expect(raw).toContain('// Optional')
  })

  it('creates the destination folder for a new product scaffold when missing', () => {
    const targetDir = path.join(tempDir, 'product-site')

    presskit.runNewCommand('product', targetDir)

    expect(fs.existsSync(path.join(targetDir, 'product', 'data.json'))).toBe(true)
    expect(fs.existsSync(path.join(targetDir, 'product', 'description.md'))).toBe(true)
    expect(fs.existsSync(path.join(targetDir, 'product', 'images'))).toBe(true)
  })

  it('writes valid JSON for a company scaffold', () => {
    presskit.runNewCommand('company', tempDir)

    expect(() => loadDataFile(path.join(tempDir, 'data.json'))).not.toThrow()
  })

  it('writes valid JSON for a product scaffold', () => {
    presskit.runNewCommand('product', tempDir)

    expect(() => loadDataFile(path.join(tempDir, 'product', 'data.json'))).not.toThrow()
  })

  it('writes a non-empty starter description for a company scaffold', () => {
    presskit.runNewCommand('company', tempDir)

    const content = fs.readFileSync(path.join(tempDir, 'description.md'), 'utf-8').trim()
    expect(content.length).toBeGreaterThan(0)
    expect(content).toContain('company')
  })

  it('writes a non-empty starter description for a product scaffold', () => {
    presskit.runNewCommand('product', tempDir)

    const content = fs.readFileSync(path.join(tempDir, 'product', 'description.md'), 'utf-8').trim()
    expect(content.length).toBeGreaterThan(0)
    expect(content).toContain('open source')
  })

  it('does not create a nested product folder for company scaffolding', () => {
    presskit.runNewCommand('company', tempDir)

    expect(fs.existsSync(path.join(tempDir, 'product'))).toBe(false)
  })

  it('does not create a root data.json for product scaffolding', () => {
    presskit.runNewCommand('product', tempDir)

    expect(fs.existsSync(path.join(tempDir, 'data.json'))).toBe(false)
  })

  it('creates the images folder for company scaffolding even if destination already exists', () => {
    fs.mkdirSync(path.join(tempDir, 'images'))

    presskit.runNewCommand('company', tempDir)

    expect(fs.existsSync(path.join(tempDir, 'images'))).toBe(true)
  })

  it('creates the images folder for product scaffolding even if destination already exists', () => {
    fs.mkdirSync(path.join(tempDir, 'product'), { recursive: true })
    fs.mkdirSync(path.join(tempDir, 'product', 'images'))

    presskit.runNewCommand('product', tempDir)

    expect(fs.existsSync(path.join(tempDir, 'product', 'images'))).toBe(true)
  })

  it('overwrites an existing company data.json scaffold', () => {
    fs.writeFileSync(path.join(tempDir, 'data.json'), '{"type":"company","title":"Old"}')

    presskit.runNewCommand('company', tempDir)

    const data = loadDataFile(path.join(tempDir, 'data.json'))
    expect(data.title).not.toBe('Old')
  })

  it('overwrites an existing product data.json scaffold', () => {
    fs.mkdirSync(path.join(tempDir, 'product'), { recursive: true })
    fs.writeFileSync(path.join(tempDir, 'product', 'data.json'), '{"type":"product","title":"Old"}')

    presskit.runNewCommand('product', tempDir)

    const data = loadDataFile(path.join(tempDir, 'product', 'data.json'))
    expect(data.title).not.toBe('Old')
  })

  it('writes commented starter guidance in company data.json', () => {
    presskit.runNewCommand('company', tempDir)

    const raw = fs.readFileSync(path.join(tempDir, 'data.json'), 'utf-8')

    expect(raw).toContain('//')
    expect(raw).toContain('example.com')
    expect(raw).toContain('"type": "company"')
  })

  it('writes commented starter guidance in product data.json', () => {
    presskit.runNewCommand('product', tempDir)

    const raw = fs.readFileSync(path.join(tempDir, 'product', 'data.json'), 'utf-8')

    expect(raw).toContain('//')
    expect(raw).toContain('Your Product Name')
    expect(raw).toContain('"platforms"')
  })

  it('logs an error and stops for an unknown scaffold type', () => {
    presskit.runNewCommand('unknown', tempDir)

    expect(console.error).toHaveBeenCalledWith('Unknown type. Expected "company" or "product"')
    expect(fs.existsSync(path.join(tempDir, 'data.json'))).toBe(false)
    expect(fs.existsSync(path.join(tempDir, 'product', 'data.json'))).toBe(false)
  })

  it('logs the created company scaffold path', () => {
    presskit.runNewCommand('company', tempDir)

    expect(console.log.mock.calls[0][0]).toContain(path.join(tempDir, 'data.json'))
  })

  it('logs the created product scaffold path', () => {
    presskit.runNewCommand('product', tempDir)

    expect(console.log.mock.calls[0][0]).toContain(path.join(tempDir, 'product', 'data.json'))
  })
})

describe('parseEntryPoint()', () => {
  let tempDir
  let cwdSpy

  beforeEach(() => {
    tempDir = createTempDir()
    cwdSpy = jest.spyOn(process, 'cwd').mockReturnValue(tempDir)
  })

  afterEach(() => {
    cwdSpy.mockRestore()
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  it('returns the current working directory when no entry is provided', (done) => {
    parseEntryPoint(undefined, (err, result) => {
      expect(err).toBeNull()
      expect(result).toBe(tempDir)
      done()
    })
  })

  it('returns the directory itself when the entry is a directory', (done) => {
    const projectDir = path.join(tempDir, 'project')
    fs.mkdirSync(projectDir)

    parseEntryPoint(projectDir, (err, result) => {
      expect(err).toBeNull()
      expect(result).toBe(projectDir)
      done()
    })
  })

  it('returns the parent directory when the entry is a file', (done) => {
    const projectDir = path.join(tempDir, 'project')
    fs.mkdirSync(projectDir)
    const entryFile = path.join(projectDir, 'data.json')
    fs.writeFileSync(entryFile, '{}')

    parseEntryPoint(entryFile, (err, result) => {
      expect(err).toBeNull()
      expect(result).toBe(projectDir)
      done()
    })
  })

  it('returns an error when the entry does not exist', (done) => {
    parseEntryPoint(path.join(tempDir, 'missing'), (err, result) => {
      expect(err).toBeInstanceOf(Error)
      expect(result).toBeUndefined()
      done()
    })
  })

  it('returns an error when stat reports neither a file nor a directory', (done) => {
    const statSpy = jest.spyOn(fs, 'stat').mockImplementation((entry, cb) => {
      cb(null, {
        isDirectory: () => false,
        isFile: () => false
      })
    })

    parseEntryPoint(path.join(tempDir, 'weird'), (err, result) => {
      expect(err).toBeInstanceOf(Error)
      expect(result).toBeUndefined()
      statSpy.mockRestore()
      done()
    })
  })
})

describe('normalizeBuildLaunchOptions()', () => {
  it('keeps built-in css theme names unchanged', () => {
    expect(normalizeBuildLaunchOptions({ css: 'dark' }).css).toBe('dark')
    expect(normalizeBuildLaunchOptions({ css: 'light.css' }).css).toBe('light.css')
  })
})
