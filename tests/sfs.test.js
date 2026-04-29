'use strict'

const mock = require('mock-fs')
const fs = require('fs')
const sfs = require('../lib/helpers/sfs')

// -------------------------------------------------------------
// Data.
// -------------------------------------------------------------

const fakeFileSystem = {
  product1: {
    'data.json': '{ "type": "product", "title": "Fake Product" }',
    images: {
      'img01.png': Buffer.from([]),
      'img02.png': Buffer.from([]),
      'img03.png': Buffer.from([])
    },
    emptyDir1: {}
  },
  product2: {
    'data.xml': '<?xml version="1.0" encoding="utf-8"?><product></product>'
  },
  misc: {
    product3: {
      'data.md': 'Fake Product'
    },
    emptyDir2: {}
  },
  emptyDir3: {},
  'data.json': '{ "type": "company", "title": "Fake Company" }'
}

// -------------------------------------------------------------
// Setup.
// -------------------------------------------------------------

beforeEach(() => {
  mock(fakeFileSystem)
})

afterEach(() => {
  mock.restore()
})

// -------------------------------------------------------------
// Tests.
// -------------------------------------------------------------

describe('createDir()', () => {
  it('should create a directory if it does not exist', () => {
    // No dir: error.
    expect(() => fs.readdirSync('tmpdir')).toThrow()

    const result = sfs.createDir('tmpdir')
    expect(result).toBeTruthy()
    expect(fs.readdirSync('tmpdir').length).toBe([].length)
  })

  it('should not create the directory if it already exists', () => {
    const result = sfs.createDir('product1')
    expect(result).toBeFalsy()
  })

  it('should create nested directories recursively', () => {
    const result = sfs.createDir('nested/path/to/site')

    expect(result).toBeTruthy()
    expect(fs.existsSync('nested/path/to/site')).toBe(true)
  })
})

describe('copyDirContent()', () => {
  it('should copy all the files of a folder to another', () => {
    const numberOfFiles = fs.readdirSync('product1/images').length
    sfs.copyDirContent('product1/images', 'copiedImages')

    expect(fs.readdirSync('copiedImages').length).toBe(numberOfFiles)
  })

  it('should create the target directory when copying content', () => {
    sfs.copyDirContent('product1/images', 'copiedImages')

    expect(fs.existsSync('copiedImages')).toBe(true)
  })

  it('should do nothing when the source directory does not exist', () => {
    sfs.copyDirContent('missing-folder', 'copiedImages')

    expect(fs.existsSync('copiedImages')).toBe(false)
  })

  it('should preserve nested directory structure when copying content', () => {
    sfs.copyDirContent('misc', 'copiedMisc')

    expect(fs.existsSync('copiedMisc/product3/data.md')).toBe(true)
  })
})

describe('findAllFiles()', () => {
  it('should return an array containing every files on the FS', () => {
    const files = sfs.findAllFiles('.')

    // Number of files in mockfs.
    expect(files.length).toBe(7)
  })

  it('should limit its search to one subfolder only', () => {
    const files = sfs.findAllFiles('.', { maxDepth: 1 })
    expect(files.length).toBe(3)
  })

  it('should support a maxDepth of zero for root-only files', () => {
    const files = sfs.findAllFiles('.', { maxDepth: 0 })

    expect(files).toEqual(['data.json'])
  })

  it('should ignore some folders', () => {
    const files = sfs.findAllFiles('.', { ignoredFolders: ['product1', 'product2'] })
    expect(files.length).toBe(2)
  })

  it('should return an empty list for a missing directory', () => {
    const files = sfs.findAllFiles('missing-folder')

    expect(files).toEqual([])
  })

  it('should include files found in nested directories by default', () => {
    const files = sfs.findAllFiles('.')

    expect(files).toContain('misc/product3/data.md')
  })

  it('should include second-level files when maxDepth allows them', () => {
    const files = sfs.findAllFiles('.', { maxDepth: 2 })

    expect(files).toContain('misc/product3/data.md')
  })

  it('should ignore hidden files and directories only when explicitly listed', () => {
    fs.writeFileSync('.hidden-file', 'secret')

    const files = sfs.findAllFiles('.')

    expect(files).toContain('.hidden-file')
  })

  it('should return an empty list when searching from a file path', () => {
    const files = sfs.findAllFiles('data.json')

    expect(files).toEqual([])
  })

  it('should ignore nested directories by basename when requested', () => {
    const files = sfs.findAllFiles('.', { ignoredFolders: ['product3'] })

    expect(files).not.toContain('misc/product3/data.md')
  })
})
