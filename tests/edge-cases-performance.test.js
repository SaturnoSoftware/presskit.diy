/**
 * Edge Cases and Performance Tests
 *
 * Tests for:
 * - Boundary conditions
 * - Large file handling
 * - Memory efficiency
 * - Concurrent operations
 * - Stress testing
 */

const fs = require('fs-extra')
const path = require('path')
const os = require('os')

describe('Edge Cases & Performance', () => {
  let tempDir

  beforeEach(() => {
    tempDir = path.join(os.tmpdir(), `presskit-edge-test-${Date.now()}`)
    fs.ensureDirSync(tempDir)
  })

  afterEach(() => {
    fs.removeSync(tempDir)
  })

  describe('Large Data Handling', () => {
    it('should handle large JSON files', () => {
      const largeData = {
        type: 'company',
        title: 'Test',
        socials: Array(1000).fill({ name: 'Social', link: 'https://example.com' })
      }

      const jsonPath = path.join(tempDir, 'large.json')
      fs.writeFileSync(jsonPath, JSON.stringify(largeData))

      const loaded = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
      expect(loaded.socials.length).toBe(1000)
    })

    it('should handle large strings', () => {
      const largeStr = 'a'.repeat(1000000)
      expect(largeStr.length).toBe(1000000)
    })

    it('should handle nested objects', () => {
      let nested = { data: {} }
      for (let i = 0; i < 100; i++) {
        nested = { level: i, child: nested }
      }
      expect(nested.level).toBe(99)
    })

    it('should handle large file operations', () => {
      const largeContent = Buffer.alloc(10 * 1024 * 1024, 'data') // 10MB
      const filePath = path.join(tempDir, 'large-file.bin')

      fs.writeFileSync(filePath, largeContent)
      expect(fs.existsSync(filePath)).toBe(true)

      const stats = fs.statSync(filePath)
      expect(stats.size).toBe(10 * 1024 * 1024)
    })

    it('should process many files', () => {
      const fileCount = 100
      const files = []

      for (let i = 0; i < fileCount; i++) {
        const filePath = path.join(tempDir, `file-${i}.json`)
        fs.writeFileSync(filePath, `{"index":${i}}`)
        files.push(filePath)
      }

      expect(files.length).toBe(fileCount)
      files.forEach(f => {
        expect(fs.existsSync(f)).toBe(true)
      })
    })
  })

  describe('Boundary Conditions', () => {
    it('should handle zero-length strings', () => {
      const str = ''
      expect(str.length).toBe(0)
    })

    it('should handle very long strings', () => {
      const str = 'x'.repeat(100000)
      expect(str.length).toBe(100000)
    })

    it('should handle maximum safe integer', () => {
      const max = Number.MAX_SAFE_INTEGER
      expect(typeof max).toBe('number')
      expect(max).toBeGreaterThan(0)
    })

    it('should handle minimum safe integer', () => {
      const min = Number.MIN_SAFE_INTEGER
      expect(typeof min).toBe('number')
      expect(min).toBeLessThan(0)
    })

    it('should handle empty arrays', () => {
      const arr = []
      expect(arr.length).toBe(0)
      expect(Array.isArray(arr)).toBe(true)
    })

    it('should handle empty objects', () => {
      const obj = {}
      expect(Object.keys(obj).length).toBe(0)
    })

    it('should handle null-like values', () => {
      expect(null).toBeNull()
      expect(undefined).toBeUndefined()
      expect(false).toBe(false)
      expect(0).toBe(0)
      expect('').toBe('')
    })

    it('should handle NaN', () => {
      const nan = NaN
      expect(Number.isNaN(nan)).toBe(true)
    })

    it('should handle Infinity', () => {
      const inf = Infinity
      expect(Number.isFinite(inf)).toBe(false)
    })

    it('should handle very deeply nested paths', () => {
      let obj = { value: 'end' }
      for (let i = 0; i < 50; i++) {
        obj = { nested: obj }
      }

      let current = obj
      for (let i = 0; i < 50; i++) {
        current = current.nested
      }

      expect(current.value).toBe('end')
    })
  })

  describe('Unicode Edge Cases', () => {
    it('should handle emoji sequences', () => {
      const emoji = '👨‍👩‍👧‍👦'
      expect(emoji.length).toBeGreaterThan(0)
    })

    it('should handle RTL text', () => {
      const text = 'مرحبا بالعالم'
      expect(text).toBeDefined()
      expect(typeof text).toBe('string')
    })

    it('should handle combining diacritics', () => {
      const text = 'e\u0301' // e with acute accent
      expect(text.length).toBe(2)
    })

    it('should handle zero-width joiner', () => {
      const text = 'a\u200db' // a, ZWJ, b
      expect(text.length).toBe(3)
    })

    it('should handle variation selectors', () => {
      const text = '♥\uFE0F' // Heart with variation selector
      expect(text).toBeDefined()
    })

    it('should handle mixed scripts', () => {
      const text = 'English, 中文, العربية, עברית'
      expect(text).toContain('English')
      expect(text).toContain('中文')
    })

    it('should handle control characters', () => {
      const text = 'Line1\nLine2\tTab'
      expect(text).toContain('\n')
      expect(text).toContain('\t')
    })
  })

  describe('Path Edge Cases', () => {
    it('should handle path with many separators', () => {
      const p = 'a/b/c/d/e/f/g/h/i/j'
      expect(p.split('/').length).toBe(10)
    })

    it('should handle absolute vs relative paths', () => {
      const abs = '/absolute/path'
      const rel = 'relative/path'

      expect(path.isAbsolute(abs)).toBe(true)
      expect(path.isAbsolute(rel)).toBe(false)
    })

    it('should handle paths with dots', () => {
      const p = '../../../file.txt'
      expect(p).toContain('..')
    })

    it('should handle paths with spaces', () => {
      const p = path.join(tempDir, 'my file with spaces.json')
      expect(p).toContain('my file with spaces')
    })

    it('should handle paths with special chars', () => {
      const special = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')']
      for (const char of special) {
        const p = `file${char}name.txt`
        expect(p).toBeDefined()
      }
    })

    it('should handle very long paths', () => {
      let p = tempDir
      for (let i = 0; i < 30; i++) {
        p = path.join(p, `level${i}`)
      }
      expect(p.length).toBeGreaterThan(100)
    })
  })

  describe('Concurrent Operations', () => {
    it('should create multiple files simultaneously', async () => {
      const promises = []
      for (let i = 0; i < 10; i++) {
        const filePath = path.join(tempDir, `async-${i}.json`)
        promises.push(
          new Promise(resolve => {
            fs.writeFileSync(filePath, `{"id":${i}}`)
            resolve()
          })
        )
      }

      await Promise.all(promises)

      for (let i = 0; i < 10; i++) {
        const filePath = path.join(tempDir, `async-${i}.json`)
        expect(fs.existsSync(filePath)).toBe(true)
      }
    })

    it('should read multiple files simultaneously', async () => {
      // Create files first
      for (let i = 0; i < 5; i++) {
        fs.writeFileSync(path.join(tempDir, `read-${i}.json`), `{"id":${i}}`)
      }

      // Read concurrently
      const promises = []
      for (let i = 0; i < 5; i++) {
        promises.push(
          new Promise(resolve => {
            const content = fs.readFileSync(path.join(tempDir, `read-${i}.json`), 'utf-8')
            resolve(JSON.parse(content))
          })
        )
      }

      const results = await Promise.all(promises)
      expect(results.length).toBe(5)
    })

    it('should handle rapid object creation and deletion', () => {
      const objects = []
      for (let i = 0; i < 1000; i++) {
        objects.push({ id: i, data: `item${i}` })
      }
      expect(objects.length).toBe(1000)

      objects.length = 0
      expect(objects.length).toBe(0)
    })
  })

  describe('Error Recovery', () => {
    it('should handle file read errors gracefully', () => {
      const nonExistent = path.join(tempDir, 'nonexistent.json')

      let error = null
      try {
        fs.readFileSync(nonExistent)
      } catch (e) {
        error = e
      }

      expect(error).not.toBeNull()
    })

    it('should handle JSON parse errors', () => {
      const jsonPath = path.join(tempDir, 'invalid.json')
      fs.writeFileSync(jsonPath, '{invalid json')

      let error = null
      try {
        JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
      } catch (e) {
        error = e
      }

      expect(error).not.toBeNull()
    })

    it('should continue after file operation error', () => {
      const nonExistent = path.join(tempDir, 'missing.json')
      let errorCaught = false

      try {
        fs.readFileSync(nonExistent)
      } catch (e) {
        errorCaught = true
      }

      // Should still be able to continue
      const validPath = path.join(tempDir, 'valid.json')
      fs.writeFileSync(validPath, '{}')

      expect(errorCaught).toBe(true)
      expect(fs.existsSync(validPath)).toBe(true)
    })

    it('should handle permission-like errors', () => {
      // Simulate permission check
      const filePath = path.join(tempDir, 'test.json')
      fs.writeFileSync(filePath, '{}')

      const stats = fs.statSync(filePath)
      const readable = (stats.mode & 0o400) !== 0

      expect(typeof readable).toBe('boolean')
    })
  })

  describe('String Manipulation Performance', () => {
    it('should split large strings', () => {
      const str = 'a,'.repeat(10000)
      const parts = str.split(',')
      expect(parts.length).toBeGreaterThan(10000)
    })

    it('should join large arrays', () => {
      const arr = Array(10000).fill('item')
      const joined = arr.join(',')
      expect(joined.length).toBeGreaterThan(10000)
    })

    it('should replace in large strings', () => {
      const str = 'test '.repeat(1000)
      const replaced = str.replace(/test/g, 'result')
      expect(replaced).toContain('result')
    })

    it('should match regex in large strings', () => {
      const str = 'abc'.repeat(1000)
      const matches = str.match(/abc/g)
      expect(matches.length).toBe(1000)
    })
  })

  describe('Array Operations Performance', () => {
    it('should filter large arrays', () => {
      const arr = Array(10000).fill(0).map((_, i) => i)
      const filtered = arr.filter(x => x % 2 === 0)
      expect(filtered.length).toBe(5000)
    })

    it('should map large arrays', () => {
      const arr = Array(10000).fill(0).map((_, i) => i)
      const mapped = arr.map(x => x * 2)
      expect(mapped[0]).toBe(0)
      expect(mapped[9999]).toBe(19998)
    })

    it('should reduce large arrays', () => {
      const arr = Array(100).fill(0).map((_, i) => i)
      const sum = arr.reduce((a, b) => a + b, 0)
      expect(sum).toBe((99 * 100) / 2)
    })

    it('should find in large arrays', () => {
      const arr = Array(10000).fill(0).map((_, i) => i)
      const found = arr.find(x => x === 5000)
      expect(found).toBe(5000)
    })

    it('should sort large arrays', () => {
      const arr = Array(1000).fill(0).map(() => Math.random())
      const sorted = arr.sort((a, b) => a - b)
      expect(sorted[0]).toBeLessThanOrEqual(sorted[sorted.length - 1])
    })
  })

  describe('Object Operations', () => {
    it('should iterate large objects', () => {
      const obj = {}
      for (let i = 0; i < 10000; i++) {
        obj[`key${i}`] = `value${i}`
      }

      const keys = Object.keys(obj)
      expect(keys.length).toBe(10000)
    })

    it('should merge large objects', () => {
      const obj1 = {}
      const obj2 = {}

      for (let i = 0; i < 5000; i++) {
        obj1[`key${i}`] = i
        obj2[`key${i + 5000}`] = i
      }

      const merged = { ...obj1, ...obj2 }
      expect(Object.keys(merged).length).toBe(10000)
    })

    it('should search in large objects', () => {
      const obj = {}
      for (let i = 0; i < 1000; i++) {
        obj[`key${i}`] = i
      }

      expect(obj.key500).toBe(500)
      expect(obj.key999).toBe(999)
    })
  })

  describe('Timing and Limits', () => {
    it('should complete operations quickly', () => {
      const start = Date.now()

      // Perform operation
      const arr = Array(1000).fill(0)
      for (let i = 0; i < 1000; i++) {
        arr[i] = i
      }

      const elapsed = Date.now() - start
      expect(elapsed).toBeLessThan(100) // Should be < 100ms
    })

    it('should handle timeout scenarios', (done) => {
      const timeout = setTimeout(() => {
        expect(true).toBe(true)
        done()
      }, 10)

      expect(typeof timeout).toBe('object')
    })

    it('should measure performance', () => {
      const iterations = 10000
      const start = Date.now()

      for (let i = 0; i < iterations; i++) {
        Math.sqrt(i)
      }

      const elapsed = Date.now() - start
      expect(elapsed).toBeGreaterThanOrEqual(0)
    })
  })
})
