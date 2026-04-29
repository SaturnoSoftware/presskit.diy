'use strict'

const path = require('path')

const {
  normalizeFsPath,
  __isBareName: isBareName,
  __isWindowsAbsolutePath: isWindowsAbsolutePath,
  __translateWindowsPathToWsl: translateWindowsPathToWsl
} = require('../lib/helpers/path-utils')

describe('path-utils', () => {
  describe('isWindowsAbsolutePath()', () => {
    it('detects drive-letter windows paths', () => {
      expect(isWindowsAbsolutePath('C:\\workspace\\presskit\\build')).toBe(true)
      expect(isWindowsAbsolutePath('D:/workspace/presskit/build')).toBe(true)
    })

    it('ignores relative paths and bare names', () => {
      expect(isWindowsAbsolutePath('build')).toBe(false)
      expect(isWindowsAbsolutePath('./build')).toBe(false)
      expect(isWindowsAbsolutePath('project\\build')).toBe(false)
    })
  })

  describe('isBareName()', () => {
    it('accepts simple names without separators', () => {
      expect(isBareName('light')).toBe(true)
      expect(isBareName('dark.css')).toBe(true)
    })

    it('rejects filesystem-like paths', () => {
      expect(isBareName('./theme.css')).toBe(false)
      expect(isBareName('themes/dark.css')).toBe(false)
      expect(isBareName('themes\\dark.css')).toBe(false)
      expect(isBareName('C:\\themes\\dark.css')).toBe(false)
    })
  })

  describe('translateWindowsPathToWsl()', () => {
    it('maps a windows absolute path to a wsl mount path', () => {
      expect(translateWindowsPathToWsl('C:\\workspace\\presskit\\build')).toBe('/mnt/c/workspace/presskit/build')
      expect(translateWindowsPathToWsl('D:/Sites/presskit/output')).toBe('/mnt/d/Sites/presskit/output')
    })

    it('leaves non-windows paths unchanged', () => {
      expect(translateWindowsPathToWsl('/tmp/build')).toBe('/tmp/build')
      expect(translateWindowsPathToWsl('build/output')).toBe('build/output')
    })
  })

  describe('normalizeFsPath()', () => {
    const isWindows = process.platform === 'win32'

    it('returns non-string values unchanged', () => {
      expect(normalizeFsPath(undefined)).toBeUndefined()
      expect(normalizeFsPath(null)).toBeNull()
    })

    it('preserves bare names when allowed', () => {
      expect(normalizeFsPath('dark', { allowBareName: true })).toBe('dark')
      expect(normalizeFsPath('dark.css', { allowBareName: true })).toBe('dark.css')
    })

    it('normalizes relative paths with backslashes', () => {
      const expected = isWindows
        ? path.normalize('themes\\dark.css')
        : 'themes/dark.css'

      expect(normalizeFsPath('themes\\dark.css')).toBe(expected)
    })

    it('normalizes windows absolute paths for the current platform', () => {
      const expected = isWindows
        ? path.normalize('C:\\workspace\\presskit\\build')
        : '/mnt/c/workspace/presskit/build'

      expect(normalizeFsPath('C:\\workspace\\presskit\\build')).toBe(expected)
    })
  })
})
