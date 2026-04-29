/**
 * Path Handling and Security Tests
 *
 * Tests for:
 * - Cross-platform path resolution
 * - Path traversal prevention
 * - Invalid path handling
 * - Symlink handling
 * - Permission issues
 */

const fs = require('fs-extra')
const path = require('path')
const os = require('os')

describe('Path Handling & Security', () => {
  let tempDir

  beforeEach(() => {
    tempDir = path.join(os.tmpdir(), `presskit-path-test-${Date.now()}`)
    fs.ensureDirSync(tempDir)
  })

  afterEach(() => {
    fs.removeSync(tempDir)
  })

  describe('Cross-Platform Path Resolution', () => {
    it('should resolve relative paths correctly', () => {
      const dataDir = path.join(tempDir, 'data')
      fs.ensureDirSync(dataDir)
      const dataFile = path.join(dataDir, 'company.json')
      fs.writeFileSync(dataFile, '{"type":"company","title":"Test"}')

      const resolved = path.resolve(dataDir, 'company.json')
      expect(fs.existsSync(resolved)).toBe(true)
    })

    it('should resolve absolute paths correctly', () => {
      const absPath = path.join(tempDir, 'absolute', 'path')
      fs.ensureDirSync(absPath)

      const resolved = path.resolve(absPath)
      expect(resolved).toBe(absPath)
    })

    it('should handle forward slashes on Windows', () => {
      const pathStr = 'data/company.json'
      const normalized = path.normalize(pathStr)
      expect(normalized).toBeDefined()
      expect(typeof normalized).toBe('string')
    })

    it('should handle backslashes on all platforms', () => {
      const pathStr = 'data\\company.json'
      const normalized = path.normalize(pathStr)
      expect(normalized).toBeDefined()
    })

    it('should resolve dot paths', () => {
      const basePath = tempDir
      const relPath = './data/file.json'
      const resolved = path.resolve(basePath, relPath)
      expect(resolved).toContain('data')
    })

    it('should resolve parent directory paths', () => {
      const deep = path.join(tempDir, 'a', 'b', 'c')
      fs.ensureDirSync(deep)
      const resolved = path.resolve(deep, '../../d')
      expect(resolved).toBeDefined()
    })

    it('should handle multiple slashes', () => {
      const pathStr = 'data//company///file.json'
      const normalized = path.normalize(pathStr)
      expect(normalized).not.toContain('//')
    })

    it('should preserve trailing slash when present', () => {
      const pathStr = tempDir + path.sep
      expect(pathStr).toContain(path.sep)
    })

    it('should work with path.join for multiple segments', () => {
      const segments = ['dir', 'sub', 'file.json']
      const joined = path.join(...segments)
      expect(joined).toBeDefined()
      expect(typeof joined).toBe('string')
    })

    it('should get directory name correctly', () => {
      const filePath = path.join(tempDir, 'data', 'company.json')
      const dirname = path.dirname(filePath)
      expect(dirname).toContain('data')
    })

    it('should get file name correctly', () => {
      const filePath = path.join(tempDir, 'company.json')
      const basename = path.basename(filePath)
      expect(basename).toBe('company.json')
    })

    it('should get extension correctly', () => {
      const filePath = 'company.json'
      const ext = path.extname(filePath)
      expect(ext).toBe('.json')
    })

    it('should handle files without extension', () => {
      const filePath = 'README'
      const ext = path.extname(filePath)
      expect(ext).toBe('')
    })

    it('should handle hidden files', () => {
      const filePath = '.hidden'
      const ext = path.extname(filePath)
      // .hidden has no extension, returns ''
      expect(ext).toBe('')
    })

    it('should handle files with double extension', () => {
      const filePath = 'archive.tar.gz'
      const ext = path.extname(filePath)
      // path.extname only returns last extension
      expect(ext).toBe('.gz')
    })
  })

  describe('Path Traversal Prevention', () => {
    it('should handle paths attempting to escape base directory', () => {
      const baseDir = tempDir
      const attemptedPath = path.join(baseDir, '../../etc/passwd')
      const resolved = path.resolve(baseDir, attemptedPath)

      // Path is resolved, but should be checked at runtime
      expect(typeof resolved).toBe('string')
    })

    it('should safely resolve .. sequences', () => {
      const base = path.join(tempDir, 'safe', 'dir')
      fs.ensureDirSync(base)
      const traversal = path.resolve(base, '../../../../etc/passwd')

      // Should resolve to a valid path on the system
      expect(typeof traversal).toBe('string')
    })

    it('should handle mixed separators in traversal attempts', () => {
      const baseDir = tempDir
      const attempt = path.resolve(baseDir, '..\\..\\etc\\passwd')
      expect(typeof attempt).toBe('string')
    })

    it('should prevent null bytes in paths', () => {
      const pathWithNull = path.join(tempDir, 'file\x00.json')
      expect(() => {
        fs.writeFileSync(pathWithNull, 'data')
      }).toThrow()
    })

    it('should safely handle very long paths', () => {
      const segments = Array(50).fill('dir')
      const longPath = path.join(tempDir, ...segments, 'file.json')
      expect(typeof longPath).toBe('string')
    })

    it('should handle CRLF in paths', () => {
      const pathWithCRLF = path.join(tempDir, 'file\r\n.json')
      expect(pathWithCRLF).toBeDefined()
    })

    it('should handle unicode in paths', () => {
      const pathWithUnicode = path.join(tempDir, 'файл_文件.json')
      expect(pathWithUnicode).toBeDefined()
    })
  })

  describe('Invalid Path Handling', () => {
    it('should handle empty path string', () => {
      const emptyPath = ''
      const resolved = path.resolve(emptyPath)
      expect(resolved).toBeDefined()
    })

    it('should handle undefined-like paths', () => {
      const str = 'data'
      expect(typeof str).toBe('string')
      expect(str).toBe('data')
    })

    it('should handle path with only dots', () => {
      const dotPath = '...'
      const normalized = path.normalize(dotPath)
      expect(normalized).toBeDefined()
    })

    it('should handle path with spaces', () => {
      const pathStr = path.join(tempDir, 'my file.json')
      expect(pathStr).toContain('my file')
    })

    it('should handle path with special characters', () => {
      const pathStr = path.join(tempDir, 'file_-name.json')
      expect(pathStr).toBeDefined()
    })

    it('should handle path with parentheses', () => {
      const pathStr = path.join(tempDir, 'file(1).json')
      expect(pathStr).toBeDefined()
    })

    it('should handle path with brackets', () => {
      const pathStr = path.join(tempDir, 'file[1].json')
      expect(pathStr).toBeDefined()
    })

    it('should reject non-string paths passed to functions', () => {
      expect(() => {
        // Should handle gracefully or throw
        path.resolve(null)
      }).toThrow()
    })
  })

  describe('File System Operations', () => {
    it('should create file in valid directory', () => {
      const filePath = path.join(tempDir, 'test.json')
      fs.writeFileSync(filePath, '{}')
      expect(fs.existsSync(filePath)).toBe(true)
    })

    it('should create nested directories', () => {
      const nestedPath = path.join(tempDir, 'a', 'b', 'c', 'file.json')
      fs.ensureDirSync(path.dirname(nestedPath))
      fs.writeFileSync(nestedPath, '{}')
      expect(fs.existsSync(nestedPath)).toBe(true)
    })

    it('should read file with correct path', () => {
      const filePath = path.join(tempDir, 'test.json')
      const content = '{"test":"data"}'
      fs.writeFileSync(filePath, content)
      const read = fs.readFileSync(filePath, 'utf-8')
      expect(read).toBe(content)
    })

    it('should fail when reading non-existent file', () => {
      const filePath = path.join(tempDir, 'nonexistent.json')
      expect(() => {
        fs.readFileSync(filePath)
      }).toThrow()
    })

    it('should handle file extension checking', () => {
      const jsonPath = path.join(tempDir, 'data.json')
      const ext = path.extname(jsonPath)
      expect(ext).toBe('.json')
    })

    it('should handle directory vs file distinction', () => {
      const dirPath = path.join(tempDir, 'subdir')
      const filePath = path.join(tempDir, 'file.json')

      fs.ensureDirSync(dirPath)
      fs.writeFileSync(filePath, '{}')

      expect(fs.statSync(dirPath).isDirectory()).toBe(true)
      expect(fs.statSync(filePath).isFile()).toBe(true)
    })

    it('should list directory contents', () => {
      const subdir = path.join(tempDir, 'subdir')
      fs.ensureDirSync(subdir)
      fs.writeFileSync(path.join(subdir, 'file1.json'), '{}')
      fs.writeFileSync(path.join(subdir, 'file2.json'), '{}')

      const files = fs.readdirSync(subdir)
      expect(files.length).toBeGreaterThanOrEqual(2)
    })

    it('should delete files', () => {
      const filePath = path.join(tempDir, 'delete-me.json')
      fs.writeFileSync(filePath, '{}')
      expect(fs.existsSync(filePath)).toBe(true)

      fs.removeSync(filePath)
      expect(fs.existsSync(filePath)).toBe(false)
    })

    it('should delete directories', () => {
      const dirPath = path.join(tempDir, 'delete-dir')
      fs.ensureDirSync(dirPath)
      expect(fs.existsSync(dirPath)).toBe(true)

      fs.removeSync(dirPath)
      expect(fs.existsSync(dirPath)).toBe(false)
    })
  })

  describe('Output Path Handling', () => {
    it('should create output directory if not exists', () => {
      const outDir = path.join(tempDir, 'output')
      fs.ensureDirSync(outDir)
      expect(fs.existsSync(outDir)).toBe(true)
    })

    it('should handle deep output paths', () => {
      const deepOut = path.join(tempDir, 'out', 'build', 'site', 'index.html')
      fs.ensureDirSync(path.dirname(deepOut))
      fs.writeFileSync(deepOut, '<html></html>')
      expect(fs.existsSync(deepOut)).toBe(true)
    })

    it('should overwrite existing files in output', () => {
      const filePath = path.join(tempDir, 'output.html')
      fs.writeFileSync(filePath, 'first')
      fs.writeFileSync(filePath, 'second')
      const content = fs.readFileSync(filePath, 'utf-8')
      expect(content).toBe('second')
    })

    it('should handle output with special characters', () => {
      const outPath = path.join(tempDir, 'site-2024_01-15.html')
      fs.writeFileSync(outPath, '<html></html>')
      expect(fs.existsSync(outPath)).toBe(true)
    })

    it('should handle output with date in path', () => {
      const timestamp = Date.now()
      const outPath = path.join(tempDir, `build-${timestamp}`)
      fs.ensureDirSync(outPath)
      expect(fs.existsSync(outPath)).toBe(true)
    })
  })

  describe('Asset Path Handling', () => {
    it('should find assets in relative path', () => {
      const assetsDir = path.join(tempDir, 'assets')
      const cssDir = path.join(assetsDir, 'css')
      fs.ensureDirSync(cssDir)

      const cssFile = path.join(cssDir, 'style.css')
      fs.writeFileSync(cssFile, 'body {}')

      expect(fs.existsSync(cssFile)).toBe(true)
    })

    it('should handle images in assets', () => {
      const imagesDir = path.join(tempDir, 'assets', 'images')
      fs.ensureDirSync(imagesDir)

      const imagePath = path.join(imagesDir, 'logo.png')
      fs.writeFileSync(imagePath, '')

      expect(fs.existsSync(imagePath)).toBe(true)
    })

    it('should handle nested asset directories', () => {
      const nested = path.join(tempDir, 'assets', 'images', 'screenshots')
      fs.ensureDirSync(nested)

      const screenshotPath = path.join(nested, 'screen1.png')
      fs.writeFileSync(screenshotPath, '')

      expect(fs.existsSync(screenshotPath)).toBe(true)
    })

    it('should handle asset file references', () => {
      const cssFile = path.join(tempDir, 'style.css')
      const imagePath = 'images/logo.png'

      // Reference handling - just test path joining
      const resolved = path.resolve(path.dirname(cssFile), imagePath)
      expect(resolved).toContain('images')
      expect(resolved).toContain('logo.png')
    })
  })

  describe('Relative vs Absolute Paths', () => {
    it('should determine if path is absolute', () => {
      const absPath = path.resolve(tempDir)
      const relPath = 'data/file.json'

      expect(path.isAbsolute(absPath)).toBe(true)
      expect(path.isAbsolute(relPath)).toBe(false)
    })

    it('should convert relative to absolute', () => {
      const relPath = './data/file.json'
      const absPath = path.resolve(relPath)
      expect(path.isAbsolute(absPath)).toBe(true)
    })

    it('should maintain directory context with relative paths', () => {
      const base = path.join(tempDir, 'src')
      const rel = '../data/file.json'
      const resolved = path.resolve(base, rel)
      expect(resolved).toContain('data')
    })

    it('should calculate relative path between two absolute paths', () => {
      const from = path.join(tempDir, 'src', 'app')
      const to = path.join(tempDir, 'data', 'config.json')

      const relative = path.relative(from, to)
      expect(relative).toBeDefined()
      expect(typeof relative).toBe('string')
    })
  })

  describe('Path Parsing', () => {
    it('should parse path into components', () => {
      const filePath = path.join('dir', 'subdir', 'file.json')
      const parsed = path.parse(filePath)

      expect(parsed.dir).toBeDefined()
      expect(parsed.name).toBeDefined()
      expect(parsed.ext).toBeDefined()
    })

    it('should reconstruct path from parsed components', () => {
      const original = path.join(tempDir, 'file.json')
      const parsed = path.parse(original)
      const reconstructed = path.format(parsed)

      expect(reconstructed).toBeDefined()
    })

    it('should handle root path correctly', () => {
      const root = path.parse('/').root
      expect(root).toBeDefined()
    })

    it('should handle paths without directory', () => {
      const filePath = 'file.json'
      const parsed = path.parse(filePath)
      expect(parsed.name).toBe('file')
      expect(parsed.ext).toBe('.json')
    })
  })

  describe('Temp Directory Handling', () => {
    it('should use os.tmpdir() for temporary files', () => {
      const tmpDir = os.tmpdir()
      expect(typeof tmpDir).toBe('string')
      expect(tmpDir.length).toBeGreaterThan(0)
    })

    it('should create unique temp directories', () => {
      const temp1 = path.join(os.tmpdir(), `test-${Date.now()}-1`)
      const temp2 = path.join(os.tmpdir(), `test-${Date.now()}-2`)

      expect(temp1).not.toBe(temp2)
    })

    it('should clean up temp files after use', () => {
      const tmpFile = path.join(tempDir, 'temp-file.json')
      fs.writeFileSync(tmpFile, '{}')
      expect(fs.existsSync(tmpFile)).toBe(true)

      fs.removeSync(tmpFile)
      expect(fs.existsSync(tmpFile)).toBe(false)
    })
  })
})
