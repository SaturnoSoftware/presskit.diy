'use strict'

jest.mock('archiver', () => jest.fn())

jest.mock('fs', () => {
  const actualFs = jest.requireActual('fs')

  return {
    ...actualFs,
    createWriteStream: jest.fn(() => ({ on: jest.fn() })),
    createReadStream: jest.fn((filename) => ({ filename }))
  }
})

const fs = require('fs')
const path = require('upath')
const archiver = require('archiver')
const zip = require('../lib/zip')

describe('zip()', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('returns undefined when there are no files to archive', () => {
    expect(zip('images.zip', '/tmp/out', '/tmp/source', [])).toBeUndefined()
    expect(fs.createWriteStream).not.toHaveBeenCalled()
    expect(archiver).not.toHaveBeenCalled()
  })

  it('creates an archive and returns the generated filename', () => {
    const archive = {
      on: jest.fn(),
      pipe: jest.fn(),
      append: jest.fn(),
      finalize: jest.fn()
    }

    archiver.mockReturnValue(archive)

    const result = zip('images.zip', '/tmp/out', '/tmp/source', ['logo.png', 'shot.png'])

    expect(result).toBe('/tmp/out/images.zip')
    expect(fs.createWriteStream).toHaveBeenCalledWith('/tmp/out/images.zip')
    expect(archiver).toHaveBeenCalledWith('zip', { store: true })
    expect(archive.on).toHaveBeenCalledWith('error', expect.any(Function))
    expect(archive.pipe).toHaveBeenCalledTimes(1)
    expect(fs.createReadStream).toHaveBeenCalledWith(path.join('/tmp/source', 'logo.png'))
    expect(fs.createReadStream).toHaveBeenCalledWith(path.join('/tmp/source', 'shot.png'))
    expect(archive.append).toHaveBeenCalledTimes(2)
    expect(archive.append).toHaveBeenCalledWith({ filename: path.join('/tmp/source', 'logo.png') }, { name: 'logo.png' })
    expect(archive.append).toHaveBeenCalledWith({ filename: path.join('/tmp/source', 'shot.png') }, { name: 'shot.png' })
    expect(archive.finalize).toHaveBeenCalledTimes(1)
  })
})
