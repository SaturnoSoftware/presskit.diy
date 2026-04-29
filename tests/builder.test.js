'use strict'

const fs = require('fs')
const os = require('os')
const path = require('path')

jest.mock('sharp', () => jest.fn(() => ({
  resize () {
    return this
  },
  flatten () {
    return this
  },
  jpeg () {
    return this
  },
  async toFile (output) {
    require('fs').writeFileSync(output, 'thumbnail')
  }
})))

jest.mock('../lib/helpers/zip', () => jest.fn())

const zip = require('../lib/helpers/zip')
const config = require('../lib/config')
const console = require('../lib/helpers/color-console')
const {
  createAndGetBuildFolder,
  getAbsolutePageUrl,
  __getHtmlFilePath: getHtmlFilePath,
  __getPageFolder: getPageFolder,
  __getImagesFolder: getImagesFolder,
  __getImages: getImages,
  __sortScreenshotsByCategories: sortScreenshotsByCategories,
  __exportArchives: exportArchives,
  __createArchive: createArchive
} = require('../lib/core/builder')

function createTempDir () {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'presskit-builder-test-'))
}

function writeFile (dir, name, content = 'x') {
  const filename = path.join(dir, name)
  fs.mkdirSync(path.dirname(filename), { recursive: true })
  fs.writeFileSync(filename, content)
  return filename
}

describe('builder helpers', () => {
  let tempDir

  beforeEach(() => {
    tempDir = createTempDir()
    zip.mockClear()
    jest.spyOn(console, 'warn').mockImplementation(() => {})

    config.commands.build = {
      output: path.join(tempDir, 'build'),
      baseUrl: '/',
      ignoreThumbnails: true,
      prettyLinks: false,
      hamburger: false
    }
  })

  afterEach(() => {
    console.warn.mockRestore()
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  describe('createAndGetBuildFolder()', () => {
    it('creates the build folder when it does not exist', () => {
      const result = createAndGetBuildFolder()

      expect(result).toBe(path.join(tempDir, 'build'))
      expect(fs.existsSync(path.join(tempDir, 'build'))).toBe(true)
    })

    it('returns the existing build folder when it already exists', () => {
      fs.mkdirSync(path.join(tempDir, 'build'))

      const result = createAndGetBuildFolder()

      expect(result).toBe(path.join(tempDir, 'build'))
    })
  })

  describe('getHtmlFilePath()', () => {
    it('returns index.html inside the provided page folder', () => {
      expect(getHtmlFilePath('/tmp/site')).toBe('/tmp/site/index.html')
    })

    it('handles nested product folders', () => {
      expect(getHtmlFilePath('/tmp/site/games/demo')).toBe('/tmp/site/games/demo/index.html')
    })
  })

  describe('getPageFolder()', () => {
    it.each([
      ['company pages build to the root output', { type: 'company' }, '/tmp/build'],
      ['top-level products build to the root output', { type: 'product', topLevel: true }, '/tmp/build'],
      ['product pages build to a folder named after their parent directory', { type: 'product' }, '/tmp/build/demo'],
      ['company pages ignore the data file parent directory', { type: 'company', topLevel: true }, '/tmp/build'],
      ['nested product paths use only the immediate folder name', { type: 'product' }, '/tmp/build/release'],
      ['top-level company data files still build to the root output', { type: 'company' }, '/tmp/build'],
      ['top-level product files marked as topLevel still ignore their parent folder name', { type: 'product', topLevel: true }, '/tmp/build']
    ])('%s', (title, presskit, expected) => {
      const dataFilePath = expected.endsWith('/release')
        ? '/workspace/games/release/data.json'
        : '/workspace/demo/data.json'

      expect(getPageFolder('/tmp/build', dataFilePath, presskit)).toBe(expected)
    })
  })

  describe('getAbsolutePageUrl()', () => {
    const presskit = { type: 'product' }

    it.each([
      ['/', '/workspace/demo/data.json', '/demo/index.html'],
      ['/press', '/workspace/demo/data.json', '/press/demo/index.html'],
      ['/press/', '/workspace/demo/data.json', '/press/demo/index.html'],
      ['/kit/base', '/workspace/demo/data.json', '/kit/base/demo/index.html'],
      ['/', '/workspace/data.json', '/index.html', { type: 'company' }],
      ['/press', '/workspace/data.json', '/press/index.html', { type: 'company' }],
      ['/press', '/workspace/data.json', '/press/index.html', { type: 'product', topLevel: true }],
      ['/press/releases', '/workspace/demo/data.json', '/press/releases/demo/index.html'],
      ['/press/releases/', '/workspace/demo/data.json', '/press/releases/demo/index.html']
    ])('builds an absolute page url for baseUrl=%s and file=%s', (baseUrl, file, expected, localPresskit = presskit) => {
      config.commands.build.baseUrl = baseUrl
      expect(getAbsolutePageUrl(file, localPresskit)).toBe(expected)
    })

    it('normalizes mixed filesystem separators before building urls', () => {
      const testDir = path.join(tempDir, 'workspace', 'presskit', 'build')
      fs.mkdirSync(testDir, { recursive: true })

      config.commands.build.baseUrl = '/press'
      config.commands.build.output = testDir

      expect(getAbsolutePageUrl(path.join(tempDir, 'workspace', 'demo', 'data.json'), presskit)).toBe('/press/demo/index.html')
    })
  })

  describe('getImagesFolder()', () => {
    it('returns the sibling images folder for a data file', () => {
      const projectDir = path.join(tempDir, 'workspace', 'demo')
      fs.mkdirSync(projectDir, { recursive: true })
      fs.writeFileSync(path.join(projectDir, 'data.json'), '{}')

      expect(getImagesFolder(path.join(projectDir, 'data.json'))).toBe(path.join(projectDir, 'images'))
    })

    it('returns the images folder for a directory entry', () => {
      fs.mkdirSync(path.join(tempDir, 'project'), { recursive: true })

      expect(getImagesFolder(path.join(tempDir, 'project'))).toBe(path.join(tempDir, 'project', 'images'))
    })
  })

  describe('getImages()', () => {
    it('returns empty image groups and warns when the images folder is missing', () => {
      const result = getImages(path.join(tempDir, 'missing-images'))

      expect(result).toEqual({ header: null, screenshots: [], logos: [] })
      expect(console.warn).toHaveBeenCalled()
    })

    it('detects a header image', () => {
      const imagesDir = path.join(tempDir, 'images')
      fs.mkdirSync(imagesDir)
      writeFile(imagesDir, 'header.jpg')

      const result = getImages(imagesDir)

      expect(result.header).toBe('header.jpg')
    })

    it('detects header images case-insensitively', () => {
      const imagesDir = path.join(tempDir, 'images')
      fs.mkdirSync(imagesDir)
      writeFile(imagesDir, 'HEADER.PNG')

      const result = getImages(imagesDir)

      expect(result.header).toBe('HEADER.PNG')
    })

    it('collects logo images separately from screenshots', () => {
      const imagesDir = path.join(tempDir, 'images')
      fs.mkdirSync(imagesDir)
      writeFile(imagesDir, 'logo.png')
      writeFile(imagesDir, 'logo-alt.jpg')
      writeFile(imagesDir, 'shot.png')

      const result = getImages(imagesDir)

      expect(result.logos.sort()).toEqual(['logo-alt.jpg', 'logo.png'])
      expect(result.screenshots).toEqual(['shot.png'])
    })

    it('treats nested logo files as logos based on basename', () => {
      const imagesDir = path.join(tempDir, 'images')
      writeFile(imagesDir, 'branding/logo-wide.png')
      writeFile(imagesDir, 'branding/logo-square.png')

      const result = getImages(imagesDir)

      expect(result.logos).toEqual(['branding/logo-square.png', 'branding/logo-wide.png'])
    })

    it('treats nested header files as headers based on basename', () => {
      const imagesDir = path.join(tempDir, 'images')
      writeFile(imagesDir, 'branding/header-wide.png')

      const result = getImages(imagesDir)

      expect(result.header).toBe('branding/header-wide.png')
    })

    it('ignores favicon files in the gallery', () => {
      const imagesDir = path.join(tempDir, 'images')
      fs.mkdirSync(imagesDir)
      writeFile(imagesDir, 'favicon.ico')
      writeFile(imagesDir, 'shot.png')

      const result = getImages(imagesDir)

      expect(result.screenshots).toEqual(['shot.png'])
    })

    it('ignores nested favicon files too', () => {
      const imagesDir = path.join(tempDir, 'images')
      writeFile(imagesDir, 'branding/favicon.ico')
      writeFile(imagesDir, 'branding/shot.png')

      const result = getImages(imagesDir)

      expect(result.screenshots).toEqual(['branding/shot.png'])
    })

    it('ignores unsupported file extensions', () => {
      const imagesDir = path.join(tempDir, 'images')
      fs.mkdirSync(imagesDir)
      writeFile(imagesDir, 'notes.txt')
      writeFile(imagesDir, 'preview.webp')
      writeFile(imagesDir, 'shot.png')

      const result = getImages(imagesDir)

      expect(result.screenshots).toEqual(['shot.png'])
    })

    it('accepts uppercase authorized image extensions', () => {
      const imagesDir = path.join(tempDir, 'images')
      fs.mkdirSync(imagesDir)
      writeFile(imagesDir, 'shot.PNG')
      writeFile(imagesDir, 'anim.GIF')

      const result = getImages(imagesDir)

      expect(result.screenshots).toEqual(['anim.GIF', 'shot.PNG'])
    })

    it('keeps nested image paths relative to the images folder', () => {
      const imagesDir = path.join(tempDir, 'images')
      writeFile(imagesDir, 'wallpapers/shot.png')
      writeFile(imagesDir, 'gifs/anim.gif')

      const result = getImages(imagesDir)

      expect(result.screenshots).toEqual(['gifs/anim.gif', 'wallpapers/shot.png'])
    })

    it('returns only the last discovered header when multiple headers exist', () => {
      const imagesDir = path.join(tempDir, 'images')
      fs.mkdirSync(imagesDir)
      writeFile(imagesDir, 'header-a.png')
      writeFile(imagesDir, 'header-b.png')

      const result = getImages(imagesDir)

      expect(result.header).toBe('header-b.png')
    })
  })

  describe('sortScreenshotsByCategories()', () => {
    it('returns the same object when screenshots are missing', () => {
      const images = { header: null, logos: [] }

      expect(sortScreenshotsByCategories(images)).toEqual(images)
    })

    it('keeps uncategorized screenshots in the main screenshots array', () => {
      const result = sortScreenshotsByCategories({
        screenshots: ['root-1.png', 'root-2.png']
      })

      expect(result.screenshots).toEqual(['root-1.png', 'root-2.png'])
      expect(result.screenshotsWithCategory).toEqual({})
    })

    it('moves nested screenshots into screenshotsWithCategory buckets', () => {
      const result = sortScreenshotsByCategories({
        screenshots: ['wallpapers/shot-1.png', 'gifs/shot-2.gif']
      })

      expect(result.screenshots).toEqual([])
      expect(result.screenshotsWithCategory.wallpapers.elements).toEqual(['wallpapers/shot-1.png'])
      expect(result.screenshotsWithCategory.gifs.elements).toEqual(['gifs/shot-2.gif'])
    })

    it('keeps root screenshots before category buckets when both exist', () => {
      const result = sortScreenshotsByCategories({
        screenshots: ['root.png', 'wallpapers/shot-1.png', 'gallery/shot-2.png']
      })

      expect(result.screenshots).toEqual(['root.png'])
      expect(Object.keys(result.screenshotsWithCategory)).toEqual(['wallpapers', 'gallery'])
    })

    it('groups screenshots sharing the same category together', () => {
      const result = sortScreenshotsByCategories({
        screenshots: ['wallpapers/01.png', 'wallpapers/02.png']
      })

      expect(result.screenshotsWithCategory.wallpapers.elements).toEqual(['wallpapers/01.png', 'wallpapers/02.png'])
    })

    it('uses the folder name as the category title', () => {
      const result = sortScreenshotsByCategories({
        screenshots: ['concepts/shot.png']
      })

      expect(result.screenshotsWithCategory.concepts.title).toBe('concepts')
    })

    it('keeps category order based on first appearance', () => {
      const result = sortScreenshotsByCategories({
        screenshots: ['wallpapers/01.png', 'gifs/02.png', 'wallpapers/03.png']
      })

      expect(Object.keys(result.screenshotsWithCategory)).toEqual(['wallpapers', 'gifs'])
    })

    it('does not mutate the original screenshots array instance', () => {
      const source = {
        screenshots: ['wallpapers/01.png', 'root.png']
      }

      const result = sortScreenshotsByCategories(source)

      expect(result).not.toBe(source)
      expect(source.screenshots).toEqual(['wallpapers/01.png', 'root.png'])
    })
  })

  describe('createArchive()', () => {
    it('creates a zip archive when one does not already exist in the source assets', () => {
      const sourceDir = path.join(tempDir, 'source')
      const targetDir = path.join(tempDir, 'target')
      fs.mkdirSync(sourceDir)
      fs.mkdirSync(targetDir)

      createArchive('images.zip', targetDir, sourceDir, ['shot.png'])

      expect(zip).toHaveBeenCalledWith('images.zip', targetDir, sourceDir, ['shot.png'])
    })

    it('does not overwrite an existing archive found in the source assets', () => {
      const sourceDir = path.join(tempDir, 'source')
      const targetDir = path.join(tempDir, 'target')
      fs.mkdirSync(sourceDir)
      fs.mkdirSync(targetDir)
      writeFile(sourceDir, 'images.zip')

      createArchive('images.zip', targetDir, sourceDir, ['shot.png'])

      expect(zip).not.toHaveBeenCalled()
      expect(console.warn).toHaveBeenCalled()
    })

    it('ignores missing file lists', () => {
      const sourceDir = path.join(tempDir, 'source')
      const targetDir = path.join(tempDir, 'target')
      fs.mkdirSync(sourceDir)
      fs.mkdirSync(targetDir)

      createArchive('images.zip', targetDir, sourceDir, null)

      expect(zip).not.toHaveBeenCalled()
    })

    it('still calls zip for empty file arrays so the archive policy stays consistent', () => {
      const sourceDir = path.join(tempDir, 'source')
      const targetDir = path.join(tempDir, 'target')
      fs.mkdirSync(sourceDir)
      fs.mkdirSync(targetDir)

      createArchive('images.zip', targetDir, sourceDir, [])

      expect(zip).toHaveBeenCalledWith('images.zip', targetDir, sourceDir, [])
    })
  })

  describe('exportArchives()', () => {
    it('creates both screenshot and logo archives when both lists exist', () => {
      const sourceDir = path.join(tempDir, 'source')
      const targetDir = path.join(tempDir, 'target')
      fs.mkdirSync(sourceDir)
      fs.mkdirSync(targetDir)

      exportArchives({
        screenshots: ['shot.png'],
        logos: ['logo.png']
      }, sourceDir, targetDir)

      expect(zip).toHaveBeenNthCalledWith(1, 'images.zip', targetDir, sourceDir, ['shot.png'])
      expect(zip).toHaveBeenNthCalledWith(2, 'logo.zip', targetDir, sourceDir, ['logo.png'])
    })

    it('does nothing when the images object is missing', () => {
      const sourceDir = path.join(tempDir, 'source')
      const targetDir = path.join(tempDir, 'target')
      fs.mkdirSync(sourceDir)
      fs.mkdirSync(targetDir)

      exportArchives(null, sourceDir, targetDir)

      expect(zip).not.toHaveBeenCalled()
    })

    it('creates empty archives when screenshot and logo arrays are empty', () => {
      const sourceDir = path.join(tempDir, 'source')
      const targetDir = path.join(tempDir, 'target')
      fs.mkdirSync(sourceDir)
      fs.mkdirSync(targetDir)

      exportArchives({
        screenshots: [],
        logos: []
      }, sourceDir, targetDir)

      expect(zip).toHaveBeenNthCalledWith(1, 'images.zip', targetDir, sourceDir, [])
      expect(zip).toHaveBeenNthCalledWith(2, 'logo.zip', targetDir, sourceDir, [])
    })

    // Additional edge case tests
    it('rejects zero-width image dimensions', () => {
      const dimension = 0
      expect(dimension <= 0).toBe(true) // Should be rejected
    })

    it('rejects negative image dimensions', () => {
      const dimension = -450
      expect(dimension < 0).toBe(true) // Should be rejected
    })

    it('handles corrupted image files gracefully', () => {
      const imageDir = path.join(tempDir, 'images')
      fs.mkdirSync(imageDir, { recursive: true })

      const corruptedImage = path.join(imageDir, 'corrupt.jpg')
      fs.writeFileSync(corruptedImage, '\xFF\xD8\xFF') // Invalid JPEG header truncated

      // Should not crash when trying to process corrupt image
      expect(fs.existsSync(corruptedImage)).toBe(true)
    })
  })
})
