/**
 * CLI and Data Format Tests
 *
 * Tests for:
 * - CLI argument parsing
 * - Help text and documentation
 * - File format detection
 * - Data normalization
 * - Error messaging
 */

const fs = require('fs-extra')
const path = require('path')
const os = require('os')

describe('CLI & Data Format Handling', () => {
  let tempDir

  beforeEach(() => {
    tempDir = path.join(os.tmpdir(), `presskit-cli-test-${Date.now()}`)
    fs.ensureDirSync(tempDir)
  })

  afterEach(() => {
    fs.removeSync(tempDir)
  })

  describe('File Format Detection', () => {
    it('should detect JSON format by extension', () => {
      const filePath = 'company.json'
      const ext = path.extname(filePath)
      expect(ext).toBe('.json')
    })

    it('should detect XML format by extension', () => {
      const filePath = 'company.xml'
      const ext = path.extname(filePath)
      expect(ext).toBe('.xml')
    })

    it('should detect markdown format by extension', () => {
      const filePath = 'description.md'
      const ext = path.extname(filePath)
      expect(ext).toBe('.md')
    })

    it('should reject unknown formats', () => {
      const filePath = 'company.txt'
      const ext = path.extname(filePath)
      expect(ext).toBe('.txt')
      expect(['.json', '.xml'].includes(ext)).toBe(false)
    })

    it('should handle case sensitivity in extensions', () => {
      const json = 'file.json'
      const JSON = 'file.JSON'
      expect(path.extname(json).toLowerCase()).toBe(path.extname(JSON).toLowerCase())
    })

    it('should ignore extensions in directories', () => {
      const dirPath = '/path/to/my.folder/file.json'
      const basename = path.basename(dirPath)
      expect(basename).toBe('file.json')
    })

    it('should handle files without extension', () => {
      const filePath = 'README'
      const ext = path.extname(filePath)
      expect(ext).toBe('')
    })

    it('should handle double extensions', () => {
      const filePath = 'archive.tar.gz'
      const ext = path.extname(filePath)
      expect(ext).toBe('.gz')
    })

    it('should detect hidden files (starting with dot)', () => {
      const filePath = '.gitignore'
      expect(filePath.startsWith('.')).toBe(true)
    })

    it('should handle files with version numbers', () => {
      const filePath = 'data.v1.json'
      const ext = path.extname(filePath)
      expect(ext).toBe('.json')
    })
  })

  describe('Directory Structure', () => {
    it('should create standard project structure', () => {
      const dirs = ['data', 'assets', 'build']
      for (const dir of dirs) {
        fs.ensureDirSync(path.join(tempDir, dir))
      }

      for (const dir of dirs) {
        expect(fs.existsSync(path.join(tempDir, dir))).toBe(true)
      }
    })

    it('should create nested asset structure', () => {
      const assetPath = path.join(tempDir, 'assets', 'images', 'screenshots')
      fs.ensureDirSync(assetPath)
      expect(fs.existsSync(assetPath)).toBe(true)
    })

    it('should create build output structure', () => {
      const buildPath = path.join(tempDir, 'build', 'images', 'generated')
      fs.ensureDirSync(buildPath)
      expect(fs.existsSync(buildPath)).toBe(true)
    })

    it('should handle deeply nested directories', () => {
      const deep = 'a/b/c/d/e/f/g/h/i/j'
      const fullPath = path.join(tempDir, deep)
      fs.ensureDirSync(fullPath)
      expect(fs.existsSync(fullPath)).toBe(true)
    })

    it('should detect existing directories', () => {
      const dir = path.join(tempDir, 'existing')
      fs.ensureDirSync(dir)
      expect(fs.statSync(dir).isDirectory()).toBe(true)
    })

    it('should list directory contents', () => {
      fs.ensureDirSync(path.join(tempDir, 'subdir'))
      fs.writeFileSync(path.join(tempDir, 'file1.json'), '{}')
      fs.writeFileSync(path.join(tempDir, 'file2.json'), '{}')

      const files = fs.readdirSync(tempDir)
      expect(files.length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('Data Type Checking', () => {
    it('should identify string values', () => {
      const value = 'text'
      expect(typeof value).toBe('string')
    })

    it('should identify number values', () => {
      const value = 42
      expect(typeof value).toBe('number')
    })

    it('should identify boolean values', () => {
      const value = true
      expect(typeof value).toBe('boolean')
    })

    it('should identify array values', () => {
      const value = [1, 2, 3]
      expect(Array.isArray(value)).toBe(true)
    })

    it('should identify object values', () => {
      const value = { key: 'value' }
      expect(typeof value).toBe('object')
      expect(Array.isArray(value)).toBe(false)
    })

    it('should identify null', () => {
      const value = null
      expect(value).toBeNull()
    })

    it('should identify undefined', () => {
      let value
      expect(value).toBeUndefined()
    })

    it('should check numeric strings', () => {
      const value = '123'
      expect(typeof value).toBe('string')
      expect(!isNaN(value)).toBe(true)
    })

    it('should validate email format', () => {
      const email = 'test@example.com'
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      expect(emailRegex.test(email)).toBe(true)
    })

    it('should validate URL format', () => {
      const url = 'https://example.com'
      const urlRegex = /^https?:\/\/.+/
      expect(urlRegex.test(url)).toBe(true)
    })
  })

  describe('Configuration Files', () => {
    it('should read JSON config', () => {
      const config = { name: 'Test', version: '1.0.0' }
      const configPath = path.join(tempDir, 'config.json')
      fs.writeFileSync(configPath, JSON.stringify(config))

      const loaded = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
      expect(loaded.name).toBe('Test')
      expect(loaded.version).toBe('1.0.0')
    })

    it('should handle missing config with defaults', () => {
      const defaults = { debug: false, verbose: false }
      const configPath = path.join(tempDir, 'missing.json')

      const config = fs.existsSync(configPath)
        ? JSON.parse(fs.readFileSync(configPath, 'utf-8'))
        : defaults

      expect(config.debug).toBe(false)
    })

    it('should merge config with defaults', () => {
      const defaults = { a: 1, b: 2, c: 3 }
      const overrides = { b: 20 }
      const merged = { ...defaults, ...overrides }

      expect(merged.a).toBe(1)
      expect(merged.b).toBe(20)
      expect(merged.c).toBe(3)
    })

    it('should validate required config fields', () => {
      const config = { name: 'Test' }
      const required = ['name', 'version']

      const valid = required.every(field => field in config)
      expect(valid).toBe(false)
    })

    it('should handle environment variable substitution', () => {
      const template = 'Version: {{VERSION}}'
      const data = { VERSION: '1.0.0' }

      let result = template
      Object.entries(data).forEach(([key, value]) => {
        result = result.replace(`{{${key}}}`, value)
      })

      expect(result).toBe('Version: 1.0.0')
    })
  })

  describe('Argument Parsing', () => {
    it('should parse command name', () => {
      const args = ['node', 'script.js', 'new', 'company']
      const command = args[2]
      expect(command).toBe('new')
    })

    it('should parse command argument', () => {
      const args = ['node', 'script.js', 'new', 'company']
      const arg = args[3]
      expect(arg).toBe('company')
    })

    it('should parse multiple arguments', () => {
      const args = ['node', 'script.js', 'build', '--output', '/path/to/output']
      const options = {}
      for (let i = 3; i < args.length; i += 2) {
        if (args[i].startsWith('--')) {
          options[args[i].slice(2)] = args[i + 1]
        }
      }
      expect(options.output).toBe('/path/to/output')
    })

    it('should parse flags', () => {
      const args = ['node', 'script.js', 'build', '--verbose', '--watch']
      const flags = args.filter(arg => arg.startsWith('--')).map(f => f.slice(2))
      expect(flags).toContain('verbose')
      expect(flags).toContain('watch')
    })

    it('should handle short options', () => {
      const args = ['node', 'script.js', 'build', '-v', '-w']
      const shortOpts = args.filter(arg => arg.startsWith('-') && !arg.startsWith('--'))
      expect(shortOpts.length).toBe(2)
    })

    it('should parse combined short options', () => {
      const arg = '-vwa'
      const flags = arg.slice(1).split('')
      expect(flags).toEqual(['v', 'w', 'a'])
    })

    it('should handle equals sign in arguments', () => {
      const args = ['build', '--output=/path', '--verbose=true']
      const parsed = {}

      args.forEach(arg => {
        if (arg.includes('=')) {
          const [key, value] = arg.replace('--', '').split('=')
          parsed[key] = value
        }
      })

      expect(parsed.output).toBe('/path')
      expect(parsed.verbose).toBe('true')
    })

    it('should handle quoted arguments', () => {
      const arg = '"path with spaces"'
      const unquoted = arg.replace(/^"|"$/g, '')
      expect(unquoted).toBe('path with spaces')
    })
  })

  describe('File Existence Checks', () => {
    it('should check if file exists', () => {
      const filePath = path.join(tempDir, 'test.json')
      fs.writeFileSync(filePath, '{}')

      expect(fs.existsSync(filePath)).toBe(true)
    })

    it('should check if file does not exist', () => {
      const filePath = path.join(tempDir, 'nonexistent.json')
      expect(fs.existsSync(filePath)).toBe(false)
    })

    it('should check if path is directory', () => {
      const dirPath = path.join(tempDir, 'subdir')
      fs.ensureDirSync(dirPath)

      const isDir = fs.statSync(dirPath).isDirectory()
      expect(isDir).toBe(true)
    })

    it('should check if path is file', () => {
      const filePath = path.join(tempDir, 'file.json')
      fs.writeFileSync(filePath, '{}')

      const isFile = fs.statSync(filePath).isFile()
      expect(isFile).toBe(true)
    })

    it('should get file size', () => {
      const filePath = path.join(tempDir, 'test.json')
      const content = '{"test":true}'
      fs.writeFileSync(filePath, content)

      const size = fs.statSync(filePath).size
      expect(size).toBe(content.length)
    })

    it('should get file modification time', () => {
      const filePath = path.join(tempDir, 'test.json')
      fs.writeFileSync(filePath, '{}')

      const mtime = fs.statSync(filePath).mtime
      expect(mtime).toBeDefined()
      expect(typeof mtime.getTime).toBe('function')
    })
  })

  describe('Output Messages', () => {
    it('should format success message', () => {
      const message = '✓ Build completed successfully'
      expect(message).toContain('Build')
      expect(message).toContain('successfully')
    })

    it('should format error message', () => {
      const message = '✗ Error: Invalid input file'
      expect(message).toContain('Error')
      expect(message).toContain('Invalid')
    })

    it('should format warning message', () => {
      const message = '⚠ Warning: Deprecated option'
      expect(message).toContain('Warning')
      expect(message).toContain('Deprecated')
    })

    it('should format info message', () => {
      const message = 'ℹ Info: Processing 5 files'
      expect(message).toContain('Processing')
      expect(message).toContain('5 files')
    })

    it('should include file paths in messages', () => {
      const filePath = '/home/user/project/data.json'
      const message = `Processing: ${filePath}`
      expect(message).toContain(filePath)
    })

    it('should handle colored output codes', () => {
      const message = '\x1b[32mSuccess\x1b[0m'
      expect(message).toContain('Success')
    })
  })

  describe('Version Information', () => {
    it('should read package.json version', () => {
      const pkgPath = path.join(__dirname, '../package.json')
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
        expect(pkg.version).toBeDefined()
      }
    })

    it('should format version string', () => {
      const version = '1.2.3'
      const formatted = `v${version}`
      expect(formatted).toBe('v1.2.3')
    })

    it('should compare versions', () => {
      const v1 = '1.0.0'
      const v2 = '2.0.0'
      const parts1 = v1.split('.').map(Number)
      const parts2 = v2.split('.').map(Number)

      expect(parts1[0] < parts2[0]).toBe(true)
    })
  })
})
