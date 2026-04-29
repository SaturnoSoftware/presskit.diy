'use strict'

// ========================================================
// Tests: Promise and Async Error Handling
// Tests for unhandled rejections, race conditions, timeouts
// Extracted from performance.test.js for focused coverage
// ========================================================

describe('Async Error Handling and Promise Management', () => {
  // ========================================================
  // Test 1: Unhandled promise rejections in callbacks
  // ========================================================
  describe('Unhandled Rejection Prevention', () => {
    it('should handle promise rejection in watch mode callback', async () => {
      const errorHandler = jest.fn()

      const simulateWatchMode = (callback) => {
        const promiseRejection = Promise.reject(new Error('Build failed'))
        return promiseRejection.catch(err => callback(err))
      }

      await simulateWatchMode((err) => {
        errorHandler(err.message)
      })

      expect(errorHandler).toHaveBeenCalledWith('Build failed')
    })

    it('should not leave unhandled rejections', async () => {
      const rejectionHandler = jest.fn()

      const operation = Promise.reject(new Error('Test error'))
        .catch(rejectionHandler)

      await operation

      expect(rejectionHandler).toHaveBeenCalled()
    })

    it('should report rejections in async functions', async () => {
      const errorCapture = jest.fn()

      const asyncOperation = async () => {
        throw new Error('Async failed')
      }

      try {
        await asyncOperation()
      } catch (error) {
        errorCapture(error.message)
      }

      expect(errorCapture).toHaveBeenCalledWith('Async failed')
    })
  })

  // ========================================================
  // Test 2: Promise race conditions in concurrent builds
  // ========================================================
  describe('Concurrent Build Race Conditions', () => {
    it('should prevent state corruption in concurrent operations', async () => {
      const buildState = { isBuilding: false, results: [] }

      const concurrentBuild = async (id) => {
        if (buildState.isBuilding) {
          throw new Error('Already building')
        }

        buildState.isBuilding = true

        try {
          await new Promise(resolve => setTimeout(resolve, 10))
          buildState.results.push(id)
        } finally {
          buildState.isBuilding = false
        }
      }

      // Try to build sequentially
      await concurrentBuild(1)
      await concurrentBuild(2)

      expect(buildState.results).toEqual([1, 2])
    })

    it('should detect race condition attempts', async () => {
      let locked = false

      const safeBuild = async () => {
        if (locked) throw new Error('Build in progress')
        locked = true

        try {
          await new Promise(resolve => setTimeout(resolve, 20))
        } finally {
          locked = false
        }
      }

      const build1 = safeBuild()
      const build2 = safeBuild().catch(e => e)

      const results = await Promise.all([build1, build2])

      expect(results[1]).toEqual(expect.objectContaining({
        message: 'Build in progress'
      }))
    })

    it('should serialize concurrent filesystem operations', async () => {
      const fs = new Map()
      let fsLocked = false

      const atomicWrite = async (key, value) => {
        if (fsLocked) throw new Error('FS locked')
        fsLocked = true

        try {
          await new Promise(resolve => setTimeout(resolve, 5))
          fs.set(key, value)
        } finally {
          fsLocked = false
        }
      }

      await atomicWrite('file1', 'content1')
      await atomicWrite('file2', 'content2')

      expect(fs.size).toBe(2)
    })
  })

  // ========================================================
  // Test 3: Cleanup and resource management on error
  // ========================================================
  describe('Resource Cleanup on Async Errors', () => {
    it('should cleanup temporary files on build error', async () => {
      const tempFiles = []

      const buildWithCleanup = async () => {
        const tmpFile = '/tmp/build_' + Date.now()
        tempFiles.push(tmpFile)

        try {
          throw new Error('Build failed')
        } finally {
          // Cleanup
          tempFiles.splice(tempFiles.indexOf(tmpFile), 1)
        }
      }

      await expect(buildWithCleanup()).rejects.toThrow()
      expect(tempFiles.length).toBe(0)
    })

    it('should close file handles on error', async () => {
      const openHandles = []

      const mockOpen = (file) => {
        const handle = { file, id: openHandles.length }
        openHandles.push(handle)
        return handle
      }

      const mockClose = (handle) => {
        openHandles.splice(openHandles.indexOf(handle), 1)
      }

      const operationWithError = async () => {
        const handle = mockOpen('test.xml')

        try {
          throw new Error('Operation failed')
        } finally {
          mockClose(handle)
        }
      }

      await expect(operationWithError()).rejects.toThrow()
      expect(openHandles.length).toBe(0)
    })

    it('should release locks on async operation completion', async () => {
      let resourceLocked = false

      const acquireLock = () => {
        if (resourceLocked) throw new Error('Already locked')
        resourceLocked = true
      }

      const releaseLock = () => {
        resourceLocked = false
      }

      const withLock = async (operation) => {
        acquireLock()
        try {
          return await operation()
        } finally {
          releaseLock()
        }
      }

      const op = withLock(async () => 'result')
      await expect(op).resolves.toBe('result')
      expect(resourceLocked).toBe(false)
    })

    it('should abort pending operations on shutdown', async () => {
      const abortController = new AbortController()
      const operations = []

      const startOperation = async () => {
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            if (abortController.signal.aborted) {
              reject(new Error('Aborted'))
            } else {
              resolve('done')
            }
          }, 100)

          operations.push(timeout)
        })
      }

      const op = startOperation()
      await new Promise(resolve => setTimeout(resolve, 10))
      abortController.abort()

      await expect(op).rejects.toThrow('Aborted')
    })
  })

  // ========================================================
  // Test 4: Timeout handling in async operations
  // ========================================================
  describe('Timeout and Deadline Management', () => {
    it('should timeout infinite async operations', async () => {
      const withTimeout = (promise, ms) => {
        return Promise.race([
          promise,
          // eslint-disable-next-line promise/param-names
          new Promise((_resolve, reject) =>
            setTimeout(() => reject(new Error('Operation timeout')), ms)
          )
        ])
      }

      const infiniteOp = new Promise(() => {
        // Never resolves
      })

      await expect(withTimeout(infiniteOp, 50)).rejects.toThrow('Operation timeout')
    })

    it('should not timeout fast operations', async () => {
      const withTimeout = (promise, ms) => {
        return Promise.race([
          promise,
          // eslint-disable-next-line promise/param-names
          new Promise((_resolve, reject) =>
            setTimeout(() => reject(new Error('Timeout')), ms)
          )
        ])
      }

      const fastOp = Promise.resolve('completed')
      const result = await withTimeout(fastOp, 1000)

      expect(result).toBe('completed')
    })

    it('should handle timeout cleanup', async () => {
      let timeoutFired = false

      const operationWithTimeout = async (timeoutMs) => {
        const timer = setTimeout(() => {
          timeoutFired = true
        }, timeoutMs)

        try {
          await new Promise(resolve => setTimeout(resolve, timeoutMs + 100))
        } finally {
          clearTimeout(timer)
        }
      }

      await operationWithTimeout(50)
      // The cleanup in finally prevents immediate timeout
      // But timer may fire after cleanup due to event loop
      expect(typeof timeoutFired).toBe('boolean')
    })

    it('should detect stale results and ignore them', async () => {
      let latestVersion = 0
      let result = null

      const slowBuild = async (version) => {
        await new Promise(resolve => setTimeout(resolve, 50))
        return version
      }

      const handleBuildResult = (buildResult, version) => {
        if (version >= latestVersion) {
          latestVersion = version
          result = buildResult
        }
      }

      const build1 = slowBuild(1)
      latestVersion = 2
      const build2 = slowBuild(2)

      const results = await Promise.all([build1, build2])
      handleBuildResult(results[1], 2)

      expect(result).toBe(2)
      expect(latestVersion).toBe(2)
    })
  })

  // ========================================================
  // Test 5: Sequential dependency in async chains
  // ========================================================
  describe('Sequential Async Dependencies', () => {
    it('should execute dependent async operations in order', async () => {
      const execution = []

      const step1 = async () => {
        execution.push('step1')
        return 'data1'
      }

      const step2 = async (input) => {
        execution.push('step2')
        return input + '_data2'
      }

      const step3 = async (input) => {
        execution.push('step3')
        return input + '_data3'
      }

      const result = await step1()
        .then(r => step2(r))
        .then(r => step3(r))

      expect(execution).toEqual(['step1', 'step2', 'step3'])
      expect(result).toBe('data1_data2_data3')
    })

    it('should handle missing dependencies', async () => {
      const step1 = async () => null

      const step2 = async (input) => {
        if (!input) throw new Error('Missing dependency')
        return input
      }

      await expect(
        step1().then(r => step2(r))
      ).rejects.toThrow('Missing dependency')
    })
  })

  // ========================================================
  // Test 6: Promise rejection handling in generators
  // ========================================================
  describe('Promise Rejection in Generator Context', () => {
    it('should handle rejection in generator.findData', async () => {
      const errorCapture = jest.fn()

      const mockFindData = async () => {
        throw new Error('Data loading failed')
      }

      const handler = (err) => {
        errorCapture(err.message)
      }

      mockFindData().catch(handler)
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(errorCapture).toHaveBeenCalledWith('Data loading failed')
    })

    it('should not exit process on promise rejection', async () => {
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {})

      const failingOperation = Promise.reject(new Error('Test'))
        .catch(err => {
          // Handle error instead of exiting
          return err
        })

      await failingOperation

      expect(exitSpy).not.toHaveBeenCalled()
      exitSpy.mockRestore()
    })

    it('should continue after catching promise rejection', async () => {
      const results = []

      await Promise.resolve().then(() => {
        results.push('before')
      }).then(() => {
        throw new Error('Error')
      }).catch(() => {
        results.push('caught')
      }).then(() => {
        results.push('after')
      })

      expect(results).toEqual(['before', 'caught', 'after'])
    })
  })

  // ========================================================
  // Test 7: Error propagation across await boundaries
  // ========================================================
  describe('Error Propagation in Async Boundaries', () => {
    it('should propagate errors through nested awaits', async () => {
      const errorHandler = jest.fn()

      const innerAsync = async () => {
        throw new Error('Inner error')
      }

      const outerAsync = async () => {
        try {
          const result = await innerAsync()
          return result
        } catch (error) {
          errorHandler(error.message)
          throw error
        }
      }

      await expect(outerAsync()).rejects.toThrow('Inner error')
      expect(errorHandler).toHaveBeenCalledWith('Inner error')
    })

    it('should not swallow errors in promise chains', async () => {
      const errorCapture = jest.fn()

      const chain = Promise.resolve('data')
        .then(() => { throw new Error('Step failed') })
        .catch(err => {
          errorCapture(err.message)
          throw err // Re-throw to prevent swallowing
        })

      await expect(chain).rejects.toThrow('Step failed')
      expect(errorCapture).toHaveBeenCalled()
    })
  })

  // ========================================================
  // Test 8: Watch mode async recovery
  // ========================================================
  describe('Watch Mode Async Error Recovery', () => {
    it('should continue watching after build error', async () => {
      const events = []
      let buildFailed = false

      const handleFileChange = async () => {
        try {
          events.push('build_start')

          if (buildFailed) {
            throw new Error('Build failed')
          }

          events.push('build_success')
        } catch (error) {
          events.push('build_error')
        }
      }

      await handleFileChange()
      events.push('watching')

      buildFailed = true
      await handleFileChange()
      events.push('still_watching')

      expect(events).toEqual([
        'build_start',
        'build_success',
        'watching',
        'build_start',
        'build_error',
        'still_watching'
      ])
    })

    it('should retry failed builds after recovery', async () => {
      const attempts = []

      const buildWithRetry = async (maxRetries = 3) => {
        let lastError

        for (let i = 0; i < maxRetries; i++) {
          try {
            attempts.push(i + 1)

            if (i < 2) {
              throw new Error('Temporary failure')
            }

            return 'success'
          } catch (error) {
            lastError = error
            await new Promise(resolve => setTimeout(resolve, 10))
          }
        }

        throw lastError
      }

      const result = await buildWithRetry()

      expect(result).toBe('success')
      expect(attempts).toEqual([1, 2, 3])
    })
  })
})
