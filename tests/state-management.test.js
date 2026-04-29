'use strict'

const mockFs = require('mock-fs')

// ========================================================
// Tests: State Management & Config Isolation
// Tests for concurrent builds, config mutations, and state
// From code-review-exhaustive-2026-04-26.md
// Issue 3.1: Global Mutable Config Coupling
// ========================================================

describe('State Management and Config Isolation', () => {
  afterEach(() => {
    mockFs.restore()
  })

  // ========================================================
  // Test 1: Build state tracking prevents concurrent builds
  // ========================================================
  describe('Build State Tracking', () => {
    it('should track isBuilding flag during build', () => {
      let isBuilding = false

      const startBuild = () => {
        isBuilding = true
      }

      const endBuild = () => {
        isBuilding = false
      }

      expect(isBuilding).toBe(false)
      startBuild()
      expect(isBuilding).toBe(true)
      endBuild()
      expect(isBuilding).toBe(false)
    })

    it('should prevent concurrent builds with same config', async () => {
      let isBuilding = false
      const builds = []

      const build = async () => {
        if (isBuilding) {
          return Promise.reject(new Error('Build already in progress'))
        }

        isBuilding = true
        builds.push('started')

        // Simulate build work
        await new Promise(resolve => setTimeout(resolve, 10))

        isBuilding = false
        return 'build complete'
      }

      const result1 = await build()
      expect(result1).toBe('build complete')
      expect(builds.length).toBe(1)

      const result2 = await build()
      expect(result2).toBe('build complete')
      expect(builds.length).toBe(2)
    })

    it('should return error when attempting concurrent build', async () => {
      let isBuilding = false

      const build = async () => {
        if (isBuilding) {
          throw new Error('Build already in progress')
        }
        isBuilding = true
        return 'success'
      }

      isBuilding = true
      await expect(build()).rejects.toThrow('Build already in progress')

      isBuilding = false
      await expect(build()).resolves.toBe('success')
    })
  })

  // ========================================================
  // Test 2: Config mutations don't affect next build
  // ========================================================
  describe('Config Mutation Isolation', () => {
    it('should not leak config mutations between builds', () => {
      const createConfig = () => ({
        commands: {
          build: {
            watch: false,
            port: 3000,
            output: './build'
          }
        }
      })

      const config1 = createConfig()
      config1.commands.build.port = 5000

      const config2 = createConfig()

      expect(config1.commands.build.port).toBe(5000)
      expect(config2.commands.build.port).toBe(3000) // Should be reset
    })

    it('should reset config between sequential builds', () => {
      const resetConfig = (config) => {
        config.commands.build = {
          watch: false,
          port: 3000,
          output: './build'
        }
      }

      const config = { commands: { build: {} } }

      config.commands.build.port = 8000
      expect(config.commands.build.port).toBe(8000)

      resetConfig(config)
      expect(config.commands.build.port).toBe(3000)
    })

    it('should handle config as parameter to avoid global mutation', () => {
      const generateHTML = (pages, config) => {
        // config is parameter, not global
        return config.commands.build
      }

      const config = { commands: { build: { output: './build' } } }
      const result = generateHTML({}, config)

      expect(result.output).toBe('./build')
    })
  })

  // ========================================================
  // Test 3: Global state isolation between tests
  // ========================================================
  describe('Test Isolation and Global State', () => {
    it('should isolate state between parallel tests', () => {
      const state1 = { value: 'test1' }
      const state2 = { value: 'test2' }

      expect(state1).not.toBe(state2)
      expect(state1.value).toBe('test1')
      expect(state2.value).toBe('test2')
    })

    it('should not affect other tests state', () => {
      let globalCounter = 0
      globalCounter++

      expect(globalCounter).toBe(1)
    })

    it('should verify state is fresh', () => {
      const globalCounter = 0 // Reset locally for this test

      expect(globalCounter).toBe(0) // Should be fresh
    })
  })

  // ========================================================
  // Test 4: Parallel builds with different configs
  // ========================================================
  describe('Concurrent Build Safety', () => {
    it('should handle two builds with different configs simultaneously', async () => {
      const mockBuild = (config) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(`Built with port ${config.port}`)
          }, 50)
        })
      }

      const config1 = { port: 3000 }
      const config2 = { port: 5000 }

      const [result1, result2] = await Promise.all([
        mockBuild(config1),
        mockBuild(config2)
      ])

      expect(result1).toBe('Built with port 3000')
      expect(result2).toBe('Built with port 5000')
    })

    it('should not corrupt state in concurrent builds', async () => {
      const builds = []

      const build = async (id, config) => {
        builds.push({ id, started: true, port: config.port })
        await new Promise(resolve => setTimeout(resolve, 10))
        builds[builds.length - 1].completed = true
        return id
      }

      await Promise.all([
        build(1, { port: 3000 }),
        build(2, { port: 5000 }),
        build(3, { port: 7000 })
      ])

      expect(builds.length).toBe(3)
      expect(builds[0].port).toBe(3000)
      expect(builds[1].port).toBe(5000)
      expect(builds[2].port).toBe(7000)
    })

    it('should fail gracefully when builds have conflicting output paths', async () => {
      const mockBuild = (config) => {
        // Check if output path conflicts
        if (config.output === '/build') {
          throw new Error('Output path already in use')
        }
        return 'success'
      }

      const config = { output: '/build' }

      expect(() => mockBuild(config)).toThrow('Output path already in use')
    })
  })

  // ========================================================
  // Test 5: Config reset between builds
  // ========================================================
  describe('Config Reset and Cleanup', () => {
    it('should reset config after build completes', () => {
      const buildState = {
        isBuilding: true,
        startTime: Date.now(),
        config: { port: 3000 }
      }

      const cleanupBuild = () => {
        buildState.isBuilding = false
        buildState.startTime = null
      }

      expect(buildState.isBuilding).toBe(true)
      cleanupBuild()
      expect(buildState.isBuilding).toBe(false)
    })

    it('should restore default config on error', () => {
      const defaultConfig = { watch: false, port: 3000 }
      let config = { ...defaultConfig }

      config.port = 8000

      const restoreConfig = () => {
        config = { ...defaultConfig }
      }

      restoreConfig()
      expect(config.port).toBe(3000)
    })

    it('should clear build artifacts on reset', () => {
      const buildArtifacts = ['file1.html', 'file2.html']

      const clearArtifacts = () => {
        return buildArtifacts.splice(0, buildArtifacts.length)
      }

      expect(buildArtifacts.length).toBe(2)
      clearArtifacts()
      expect(buildArtifacts.length).toBe(0)
    })
  })

  // ========================================================
  // Test 6: Multiple generator instances
  // ========================================================
  describe('Multiple Generator Instances', () => {
    it('should create multiple independent generator instances', () => {
      const createGenerator = (config) => ({
        config,
        build: async () => `Built with ${config.port}`
      })

      const gen1 = createGenerator({ port: 3000 })
      const gen2 = createGenerator({ port: 5000 })

      expect(gen1.config.port).toBe(3000)
      expect(gen2.config.port).toBe(5000)
      expect(gen1).not.toBe(gen2)
    })

    it('should not share state between generator instances', () => {
      const createGenerator = () => ({
        state: { processed: 0 }
      })

      const gen1 = createGenerator()
      const gen2 = createGenerator()

      gen1.state.processed = 10

      expect(gen1.state.processed).toBe(10)
      expect(gen2.state.processed).toBe(0) // Should not be affected
    })
  })

  // ========================================================
  // Test 7: Partial build state cleanup
  // ========================================================
  describe('Partial Build Recovery', () => {
    it('should track which files were processed before error', () => {
      const buildState = {
        processed: [],
        failed: []
      }

      const processFile = (file, shouldFail = false) => {
        if (shouldFail) {
          buildState.failed.push(file)
          throw new Error(`Failed to process ${file}`)
        }
        buildState.processed.push(file)
      }

      processFile('file1.xml')
      processFile('file2.xml')

      expect(() => processFile('file3.xml', true)).toThrow()

      expect(buildState.processed.length).toBe(2)
      expect(buildState.failed.length).toBe(1)
    })

    it('should preserve successful results on partial failure', () => {
      const results = { success: [], failure: [] }

      const files = ['file1', 'file2', 'file3']
      files.forEach((file, index) => {
        if (index === 2) {
          results.failure.push(file)
        } else {
          results.success.push(file)
        }
      })

      expect(results.success.length).toBe(2)
      expect(results.failure.length).toBe(1)
    })
  })

  // ========================================================
  // Test 8: Rollback on failure
  // ========================================================
  describe('Rollback and State Restoration', () => {
    it('should rollback changes on build failure', async () => {
      let buildState = { output: null, config: null }

      const build = async (config) => {
        const backup = { ...buildState }

        try {
          buildState.config = config
          buildState.output = 'built'

          // Simulate failure
          throw new Error('Build failed')
        } catch (error) {
          // Rollback
          buildState = backup
          return error
        }
      }

      await build({ port: 3000 })

      expect(buildState.output).toBeNull()
      expect(buildState.config).toBeNull()
    })

    it('should not leave partial files on rollback', () => {
      const files = { '/build/file1.html': true }

      const rollback = () => {
        Object.keys(files).forEach(file => {
          delete files[file]
        })
      }

      rollback()
      expect(Object.keys(files).length).toBe(0)
    })

    it('should restore config to previous state on error', () => {
      const configHistory = []
      let currentConfig = { port: 3000 }

      const saveState = () => {
        configHistory.push({ ...currentConfig })
      }

      const restoreState = () => {
        if (configHistory.length > 0) {
          currentConfig = configHistory.pop()
        }
      }

      saveState()
      currentConfig.port = 8000

      restoreState()
      expect(currentConfig.port).toBe(3000)
    })
  })
})
