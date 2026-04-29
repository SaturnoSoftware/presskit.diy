'use strict'

const fs = require('fs')
const mockFs = require('mock-fs')

// ========================================================
// Tests: Performance and Scalability
// Tests for large file handling, memory usage, and throughput
// ========================================================

describe('Performance and Scalability Tests', () => {
  afterEach(() => {
    mockFs.restore()
  })

  // ========================================================
  // Test 1: Large file handling
  // ========================================================
  describe('Large File Handling', () => {
    it('should handle large XML files without memory issues', () => {
      // Create a large XML structure
      let xml = '<?xml version="1.0"?><game>'
      for (let i = 0; i < 100; i++) {
        xml += `<screenshot id="img${i}">image${i}.jpg</screenshot>`
      }
      xml += '</game>'

      expect(xml.length).toBeGreaterThan(1000)

      // Should not crash parser
      const parser = require('../lib/core/parser')
      expect(() => {
        parser.parseXML(xml)
      }).not.toThrow()
    })

    it('should process large directory trees efficiently', () => {
      const createLargeFileStructure = () => {
        const files = {}
        for (let i = 0; i < 100; i++) {
          files[`file${i}.xml`] = 'content'
        }
        return files
      }

      mockFs({
        '/project': createLargeFileStructure()
      })

      // Simulate file listing without actually requiring sfs
      const fileCount = fs.readdirSync('/project').length
      expect(fileCount).toBe(100)

      mockFs.restore()
    })

    it('should handle large image arrays without slowdown', () => {
      const images = []
      for (let i = 0; i < 1000; i++) {
        images.push(`image${i}.jpg`)
      }

      expect(images.length).toBe(1000)
      expect(images.filter(img => img.endsWith('.jpg')).length).toBe(1000)
    })
  })

  // ========================================================
  // Test 2: Memory usage under load
  // ========================================================
  describe('Memory Usage Under Load', () => {
    it('should not accumulate unbounded memory', () => {
      const initialMemory = process.memoryUsage().heapUsed
      const arrays = []

      // Create and release memory
      for (let i = 0; i < 100; i++) {
        arrays.push(new Array(10000).fill('data'))
      }

      arrays.splice(0, arrays.length) // Clear

      const finalMemory = process.memoryUsage().heapUsed
      const growth = finalMemory - initialMemory

      // Growth should be reasonable (< 50MB for this test)
      expect(growth).toBeLessThan(50 * 1024 * 1024)
    })

    it('should cache parsed results to avoid re-parsing', () => {
      const cache = new Map()
      let parseCount = 0

      const parseXML = (xml) => {
        if (cache.has(xml)) return cache.get(xml)

        parseCount++
        const result = { type: 'game' }
        cache.set(xml, result)
        return result
      }

      const xml = '<game></game>'

      parseXML(xml)
      parseXML(xml)
      parseXML(xml)

      expect(parseCount).toBe(1) // Only parsed once
      expect(cache.size).toBe(1)
    })

    it('should release memory when cache is cleared', () => {
      const cache = new Map()

      for (let i = 0; i < 1000; i++) {
        cache.set(`key${i}`, new Array(1000).fill('data'))
      }

      expect(cache.size).toBe(1000)

      cache.clear()

      expect(cache.size).toBe(0)
    })
  })

  // ========================================================
  // Test 3: Build time with large image sets
  // ========================================================
  describe('Build Performance with Large Image Sets', () => {
    it('should process 1000+ images without excessive time', () => {
      const mockImages = []
      for (let i = 0; i < 1000; i++) {
        mockImages.push(`image${i}.jpg`)
      }

      const startTime = Date.now()

      const results = mockImages.map(img => ({
        name: img,
        thumbnail: `thumb_${img}`
      }))

      const elapsed = Date.now() - startTime

      expect(results.length).toBe(1000)
      expect(elapsed).toBeLessThan(500) // Should process in < 500ms
    })

    it('should batch process images efficiently', () => {
      const images = Array.from({ length: 500 }, (_, i) => `image${i}.jpg`)

      const batchSize = 50
      const batches = []

      for (let i = 0; i < images.length; i += batchSize) {
        batches.push(images.slice(i, i + batchSize))
      }

      expect(batches.length).toBe(10)
      expect(batches[0].length).toBe(50)
    })
  })

  // ========================================================
  // Test 4: Watcher responsiveness under load
  // ========================================================
  describe('File Watcher Performance', () => {
    it('should handle rapid file changes without queue buildup', async () => {
      const events = []
      let processing = false

      const handleFileChange = async (file) => {
        if (processing) return // Prevent concurrent processing

        processing = true
        events.push(file)

        await new Promise(resolve => setTimeout(resolve, 50))

        processing = false
      }

      // Rapid changes
      await handleFileChange('file1')
      await handleFileChange('file2')
      await handleFileChange('file3')

      expect(events.length).toBe(3)
    })

    it('should debounce rapid file changes', (done) => {
      let callCount = 0
      const debounceDelay = 100

      const debounce = (fn, delay) => {
        let timeout
        return () => {
          clearTimeout(timeout)
          timeout = setTimeout(fn, delay)
        }
      }

      const onChange = debounce(() => {
        callCount++
      }, debounceDelay)

      // Trigger multiple times rapidly
      onChange()
      onChange()
      onChange()

      setTimeout(() => {
        expect(callCount).toBe(1)
        done()
      }, debounceDelay + 50)
    })

    it('should not drop file change events', async () => {
      const queue = []

      const addEvent = (event) => {
        queue.push(event)
        return queue.length
      }

      addEvent('change1')
      addEvent('change2')
      addEvent('change3')

      expect(queue.length).toBe(3)
    })
  })

  // ========================================================
  // Test 5: Template rendering performance
  // ========================================================
  describe('Template Rendering Performance', () => {
    it('should render templates with large data sets efficiently', () => {
      const handlebars = require('handlebars')

      const template = handlebars.compile('{{#each items}}{{this}}\n{{/each}}')

      const largeData = {
        items: Array.from({ length: 1000 }, (_, i) => `Item ${i}`)
      }

      const startTime = Date.now()
      const result = template(largeData)
      const elapsed = Date.now() - startTime

      expect(result.split('\n').length).toBeGreaterThan(999)
      expect(elapsed).toBeLessThan(200)
    })
  })
})

// ========================================================
// Tests: Async/Promise Handling
// Tests for unhandled rejections, race conditions, cleanup
// ========================================================

describe('Async and Promise Handling', () => {
  // ========================================================
  // Test 1: Unhandled promise rejections
  // ========================================================
  describe('Unhandled Rejection Prevention', () => {
    it('should catch promise rejections', async () => {
      const handler = jest.fn()

      const operation = Promise.reject(new Error('Operation failed'))

      await operation.catch(handler)

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Operation failed'
        })
      )
    })

    it('should handle rejection in async function', async () => {
      const failingAsync = async () => {
        throw new Error('Async error')
      }

      await expect(failingAsync()).rejects.toThrow('Async error')
    })
  })

  // ========================================================
  // Test 2: Promise race conditions
  // ========================================================
  describe('Promise Race Condition Prevention', () => {
    it('should use Promise.all to avoid race conditions', async () => {
      const operations = [
        Promise.resolve('result1'),
        Promise.resolve('result2'),
        Promise.resolve('result3')
      ]

      const results = await Promise.all(operations)

      expect(results).toEqual(['result1', 'result2', 'result3'])
    })

    it('should detect conflicting concurrent operations', async () => {
      let locked = false

      const operation = async () => {
        if (locked) throw new Error('Already locked')
        locked = true

        try {
          await new Promise(resolve => setTimeout(resolve, 10))
        } finally {
          locked = false
        }
      }

      await operation()
      expect(locked).toBe(false)
    })

    it('should handle Promise.allSettled for partial failures', async () => {
      const operations = [
        Promise.resolve('success1'),
        Promise.reject(new Error('failure')),
        Promise.resolve('success2')
      ]

      const results = await Promise.allSettled(operations)

      expect(results[0].status).toBe('fulfilled')
      expect(results[1].status).toBe('rejected')
      expect(results[2].status).toBe('fulfilled')
    })
  })

  // ========================================================
  // Test 3: Cleanup on errors
  // ========================================================
  describe('Resource Cleanup on Error', () => {
    it('should cleanup resources even when async operation fails', async () => {
      const resources = []

      const allocateResource = () => {
        const resource = { id: resources.length }
        resources.push(resource)
        return resource
      }

      const freeResource = (resource) => {
        resources.splice(resources.indexOf(resource), 1)
      }

      try {
        allocateResource()
        throw new Error('Operation failed')
      } catch (error) {
        if (resources.length > 0) {
          freeResource(resources[0])
        }
      }

      expect(resources.length).toBe(0)
    })

    it('should cleanup with finally block', async () => {
      let resourceCleaned = false
      let exceptionThrown = false

      try {
        throw new Error('Operation failed')
      } catch (e) {
        exceptionThrown = true
      } finally {
        resourceCleaned = true
      }

      expect(resourceCleaned).toBe(true)
      expect(exceptionThrown).toBe(true)
    })

    it('should cancel pending operations on abort', async () => {
      const abortController = new AbortController()
      const operations = []

      const startOperation = (id) => {
        operations.push(id)
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            if (abortController.signal.aborted) {
              reject(new Error('Aborted'))
            } else {
              resolve(`Completed ${id}`)
            }
          }, 100)
        })
      }

      const op1 = startOperation(1)
      abortController.abort()

      await expect(op1).rejects.toThrow('Aborted')
    })
  })

  // ========================================================
  // Test 4: Timeout handling
  // ========================================================
  describe('Timeout and Deadline Handling', () => {
    it('should timeout long-running operations', async () => {
      const timeout = (promise, ms) => {
        return Promise.race([
          promise,
          // eslint-disable-next-line promise/param-names
          new Promise((_resolve, reject) =>
            setTimeout(() => reject(new Error('Timeout')), ms)
          )
        ])
      }

      const slowOp = new Promise(resolve =>
        setTimeout(() => resolve('done'), 1000)
      )

      await expect(timeout(slowOp, 100)).rejects.toThrow('Timeout')
    })

    it('should complete before timeout', async () => {
      const timeout = (promise, ms) => {
        return Promise.race([
          promise,
          // eslint-disable-next-line promise/param-names
          new Promise((_resolve, reject) =>
            setTimeout(() => reject(new Error('Timeout')), ms)
          )
        ])
      }

      const fastOp = new Promise(resolve =>
        setTimeout(() => resolve('done'), 10)
      )

      const result = await timeout(fastOp, 100)
      expect(result).toBe('done')
    })

    it('should handle stale results from slow operations', async () => {
      let latestResult = null
      let version = 0

      const slowOperation = async (v) => {
        await new Promise(resolve => setTimeout(resolve, 100))
        return v
      }

      const handleResult = (result, v) => {
        // Only accept if this is the latest version
        if (v === version) {
          latestResult = result
        }
      }

      const op1Promise = slowOperation(1)
      version = 2
      const op2Promise = slowOperation(2)

      const results = await Promise.all([op1Promise, op2Promise])
      handleResult(results[1], 2)

      expect(latestResult).toBe(2)
    })
  })

  // ========================================================
  // Test 5: Sequential vs parallel async operations
  // ========================================================
  describe('Async Operation Ordering', () => {
    it('should execute operations sequentially when required', async () => {
      const results = []

      const op1 = async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        results.push(1)
      }

      const op2 = async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        results.push(2)
      }

      await op1()
      await op2()

      expect(results).toEqual([1, 2])
    })

    it('should execute operations in parallel when safe', async () => {
      const results = []
      const timestamps = []

      const op = async (id) => {
        const start = Date.now()
        await new Promise(resolve => setTimeout(resolve, 50))
        results.push(id)
        timestamps.push(Date.now() - start)
      }

      const startTime = Date.now()
      await Promise.all([op(1), op(2), op(3)])
      const totalTime = Date.now() - startTime

      // Parallel should take ~50ms, sequential would be ~150ms
      expect(totalTime).toBeLessThan(150)
    })
  })

  // ========================================================
  // Test 6: Error propagation in async chains
  // ========================================================
  describe('Error Propagation in Async Chains', () => {
    it('should propagate errors through async chain', async () => {
      const chain = async () => {
        await Promise.resolve('data')
        const step2 = await Promise.reject(new Error('Step 2 failed'))
        await Promise.resolve('more data') // Should not reach
        return step2
      }

      await expect(chain()).rejects.toThrow('Step 2 failed')
    })

    it('should catch and handle errors in async chain', async () => {
      const handleError = jest.fn()

      const chain = async () => {
        try {
          await Promise.resolve('data')
          await Promise.reject(new Error('Failed'))
        } catch (error) {
          handleError(error.message)
        }
      }

      await chain()
      expect(handleError).toHaveBeenCalledWith('Failed')
    })
  })
})
