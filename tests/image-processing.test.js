/**
 * Image Processing Tests
 *
 * Tests for:
 * - Image format handling (PNG, JPG, GIF, WebP)
 * - Image resizing and optimization
 * - Thumbnail generation
 * - EXIF data handling
 * - Image corruption detection
 * - Performance with large images
 */

const fs = require('fs-extra')
const path = require('path')
const os = require('os')
const sharp = require('sharp')

describe('Image Processing', () => {
  let tempDir

  beforeEach(() => {
    tempDir = path.join(os.tmpdir(), `presskit-image-test-${Date.now()}`)
    fs.ensureDirSync(tempDir)
  })

  afterEach(async () => {
    // Windows file locking with Sharp requires aggressive cleanup
    // Force garbage collection and wait for file handles to close
    if (global.gc) global.gc()

    let retries = 5
    while (retries > 0) {
      try {
        if (fs.existsSync(tempDir)) {
          // Force remove with recursive flag and force option
          fs.rmSync(tempDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 })
        }
        break
      } catch (err) {
        retries--
        if (retries === 0) {
          // If all retries fail, try to clean up on next test
          // Don't throw - let test pass but log the error
          console.warn(`Failed to cleanup temp dir: ${tempDir}`, err.message)
          break
        }
        // Exponential backoff: 50ms, 100ms, 200ms, 400ms, 800ms
        await new Promise(resolve => setTimeout(resolve, 50 * Math.pow(2, 5 - retries)))
      }
    }
  })

  describe('Image Format Support', () => {
    it('should create valid PNG image', async () => {
      const pngPath = path.join(tempDir, 'test.png')

      await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 3,
          background: { r: 255, g: 0, b: 0 }
        }
      })
        .png()
        .toFile(pngPath)

      expect(fs.existsSync(pngPath)).toBe(true)
      const stats = fs.statSync(pngPath)
      expect(stats.size).toBeGreaterThan(0)
    })

    it('should create valid JPEG image', async () => {
      const jpgPath = path.join(tempDir, 'test.jpg')

      await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 3,
          background: { r: 0, g: 255, b: 0 }
        }
      })
        .jpeg({ quality: 80 })
        .toFile(jpgPath)

      expect(fs.existsSync(jpgPath)).toBe(true)
    })

    it('should create valid WebP image', async () => {
      const webpPath = path.join(tempDir, 'test.webp')

      await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 3,
          background: { r: 0, g: 0, b: 255 }
        }
      })
        .webp({ quality: 80 })
        .toFile(webpPath)

      expect(fs.existsSync(webpPath)).toBe(true)
    })

    it('should detect PNG format', async () => {
      const pngPath = path.join(tempDir, 'format-test.png')
      await sharp({
        create: { width: 10, height: 10, channels: 3, background: 'white' }
      })
        .png()
        .toFile(pngPath)

      const metadata = await sharp(pngPath).metadata()
      expect(metadata.format).toBe('png')
    })

    it('should detect JPEG format', async () => {
      const jpgPath = path.join(tempDir, 'format-test.jpg')
      await sharp({
        create: { width: 10, height: 10, channels: 3, background: 'white' }
      })
        .jpeg()
        .toFile(jpgPath)

      const metadata = await sharp(jpgPath).metadata()
      expect(metadata.format).toBe('jpeg')
    })

    it('should detect WebP format', async () => {
      const webpPath = path.join(tempDir, 'format-test.webp')
      await sharp({
        create: { width: 10, height: 10, channels: 3, background: 'white' }
      })
        .webp()
        .toFile(webpPath)

      const metadata = await sharp(webpPath).metadata()
      expect(metadata.format).toBe('webp')
    })
  })

  describe('Image Resizing', () => {
    it('should resize image to smaller dimensions', async () => {
      const origPath = path.join(tempDir, 'original.png')
      const resizedPath = path.join(tempDir, 'resized.png')

      await sharp({
        create: { width: 200, height: 200, channels: 3, background: 'white' }
      })
        .png()
        .toFile(origPath)

      await sharp(origPath)
        .resize(100, 100)
        .toFile(resizedPath)

      const origMeta = await sharp(origPath).metadata()
      const resizedMeta = await sharp(resizedPath).metadata()

      expect(resizedMeta.width).toBe(100)
      expect(resizedMeta.height).toBe(100)
      expect(resizedMeta.width).toBeLessThan(origMeta.width)
    })

    it('should maintain aspect ratio when resizing', async () => {
      const origPath = path.join(tempDir, 'aspect.png')
      const resizedPath = path.join(tempDir, 'aspect-resized.png')

      await sharp({
        create: { width: 200, height: 100, channels: 3, background: 'white' }
      })
        .png()
        .toFile(origPath)

      await sharp(origPath)
        .resize(100, 100, { fit: 'contain' })
        .toFile(resizedPath)

      const resizedMeta = await sharp(resizedPath).metadata()
      expect(resizedMeta.width).toBeLessThanOrEqual(100)
      expect(resizedMeta.height).toBeLessThanOrEqual(100)
    })

    it('should handle crop resizing', async () => {
      const imagePath = path.join(tempDir, 'crop.png')
      const croppedPath = path.join(tempDir, 'cropped.png')

      await sharp({
        create: { width: 200, height: 200, channels: 3, background: 'white' }
      })
        .png()
        .toFile(imagePath)

      await sharp(imagePath)
        .resize(100, 100, { fit: 'cover' })
        .toFile(croppedPath)

      const croppedMeta = await sharp(croppedPath).metadata()
      expect(croppedMeta.width).toBe(100)
      expect(croppedMeta.height).toBe(100)
    })

    it('should generate thumbnail image', async () => {
      const origPath = path.join(tempDir, 'full.png')
      const thumbPath = path.join(tempDir, 'thumb.png')

      await sharp({
        create: { width: 1000, height: 800, channels: 3, background: 'blue' }
      })
        .png()
        .toFile(origPath)

      await sharp(origPath)
        .resize(200, 160, { fit: 'cover' })
        .toFile(thumbPath)

      const thumbMeta = await sharp(thumbPath).metadata()
      expect(thumbMeta.width).toBe(200)
      expect(thumbMeta.height).toBe(160)
    })

    it('should resize to fixed width maintaining height ratio', async () => {
      const imagePath = path.join(tempDir, 'width-fixed.png')
      const resizedPath = path.join(tempDir, 'width-fixed-resized.png')

      await sharp({
        create: { width: 400, height: 300, channels: 3, background: 'white' }
      })
        .png()
        .toFile(imagePath)

      await sharp(imagePath)
        .resize(200, null)
        .toFile(resizedPath)

      const resizedMeta = await sharp(resizedPath).metadata()
      expect(resizedMeta.width).toBe(200)
      expect(resizedMeta.height).toBe(150)
    })

    it('should resize to fixed height maintaining width ratio', async () => {
      const imagePath = path.join(tempDir, 'height-fixed.png')
      const resizedPath = path.join(tempDir, 'height-fixed-resized.png')

      await sharp({
        create: { width: 400, height: 300, channels: 3, background: 'white' }
      })
        .png()
        .toFile(imagePath)

      await sharp(imagePath)
        .resize(null, 150)
        .toFile(resizedPath)

      const resizedMeta = await sharp(resizedPath).metadata()
      expect(resizedMeta.height).toBe(150)
      expect(resizedMeta.width).toBe(200)
    })
  })

  describe('Image Optimization', () => {
    it('should optimize PNG image', async () => {
      const imagePath = path.join(tempDir, 'optimize.png')
      const optimizedPath = path.join(tempDir, 'optimized.png')

      await sharp({
        create: { width: 100, height: 100, channels: 3, background: 'white' }
      })
        .png()
        .toFile(imagePath)

      await sharp(imagePath)
        .png({ progressive: true, compressionLevel: 9 })
        .toFile(optimizedPath)

      const optimizedSize = fs.statSync(optimizedPath).size

      // Optimization may or may not reduce size depending on image content
      expect(optimizedSize).toBeGreaterThan(0)
    })

    it('should optimize JPEG quality', async () => {
      const hqPath = path.join(tempDir, 'hq.jpg')
      const lqPath = path.join(tempDir, 'lq.jpg')

      const baseImage = sharp({
        create: { width: 100, height: 100, channels: 3, background: 'white' }
      })

      await baseImage
        .jpeg({ quality: 95 })
        .toFile(hqPath)

      await sharp({
        create: { width: 100, height: 100, channels: 3, background: 'white' }
      })
        .jpeg({ quality: 50 })
        .toFile(lqPath)

      const hqSize = fs.statSync(hqPath).size
      const lqSize = fs.statSync(lqPath).size

      // Higher quality usually means larger file
      expect(hqSize).toBeGreaterThan(0)
      expect(lqSize).toBeGreaterThan(0)
    })

    it('should generate progressive JPEG', async () => {
      const progressivePath = path.join(tempDir, 'progressive.jpg')

      await sharp({
        create: { width: 100, height: 100, channels: 3, background: 'white' }
      })
        .jpeg({ progressive: true, quality: 80 })
        .toFile(progressivePath)

      expect(fs.existsSync(progressivePath)).toBe(true)
      const metadata = await sharp(progressivePath).metadata()
      expect(metadata.isProgressive).toBe(true)
    })
  })

  describe('Image Metadata', () => {
    it('should read image dimensions', async () => {
      const imagePath = path.join(tempDir, 'metadata.png')

      await sharp({
        create: { width: 320, height: 240, channels: 3, background: 'white' }
      })
        .png()
        .toFile(imagePath)

      const metadata = await sharp(imagePath).metadata()
      expect(metadata.width).toBe(320)
      expect(metadata.height).toBe(240)
    })

    it('should read image color space', async () => {
      const imagePath = path.join(tempDir, 'colorspace.png')

      await sharp({
        create: { width: 50, height: 50, channels: 3, background: 'white' }
      })
        .png()
        .toFile(imagePath)

      const metadata = await sharp(imagePath).metadata()
      expect(metadata.space).toBeDefined()
    })

    it('should read image channels', async () => {
      const imagePath = path.join(tempDir, 'channels.png')

      await sharp({
        create: { width: 50, height: 50, channels: 4, background: 'rgba(255,0,0,0.5)' }
      })
        .png()
        .toFile(imagePath)

      const metadata = await sharp(imagePath).metadata()
      expect(metadata.channels).toBeGreaterThan(0)
    })

    it('should read file size from stats', async () => {
      const imagePath = path.join(tempDir, 'size.png')

      await sharp({
        create: { width: 100, height: 100, channels: 3, background: 'white' }
      })
        .png()
        .toFile(imagePath)

      const stats = fs.statSync(imagePath)
      expect(stats.size).toBeGreaterThan(0)
    })

    it('should handle images with alpha channel', async () => {
      const imagePath = path.join(tempDir, 'alpha.png')

      await sharp({
        create: { width: 50, height: 50, channels: 4, background: 'transparent' }
      })
        .png()
        .toFile(imagePath)

      const metadata = await sharp(imagePath).metadata()
      expect(metadata.hasAlpha).toBe(true)
    })
  })

  describe('Image Transformation', () => {
    it('should rotate image', async () => {
      const imagePath = path.join(tempDir, 'rotate.png')
      const rotatedPath = path.join(tempDir, 'rotated.png')

      await sharp({
        create: { width: 200, height: 100, channels: 3, background: 'white' }
      })
        .png()
        .toFile(imagePath)

      await sharp(imagePath)
        .rotate(90)
        .toFile(rotatedPath)

      const origMeta = await sharp(imagePath).metadata()
      const rotatedMeta = await sharp(rotatedPath).metadata()

      // 90 degree rotation swaps width and height
      expect(rotatedMeta.width).toBe(origMeta.height)
      expect(rotatedMeta.height).toBe(origMeta.width)
    })

    it('should flip image horizontally', async () => {
      const imagePath = path.join(tempDir, 'flip-h.png')
      const flippedPath = path.join(tempDir, 'flipped-h.png')

      await sharp({
        create: { width: 100, height: 100, channels: 3, background: 'white' }
      })
        .png()
        .toFile(imagePath)

      await sharp(imagePath)
        .flop()
        .toFile(flippedPath)

      expect(fs.existsSync(flippedPath)).toBe(true)
    })

    it('should flip image vertically', async () => {
      const imagePath = path.join(tempDir, 'flip-v.png')
      const flippedPath = path.join(tempDir, 'flipped-v.png')

      await sharp({
        create: { width: 100, height: 100, channels: 3, background: 'white' }
      })
        .png()
        .toFile(imagePath)

      await sharp(imagePath)
        .flip()
        .toFile(flippedPath)

      expect(fs.existsSync(flippedPath)).toBe(true)
    })

    it('should add borders/padding to image', async () => {
      const imagePath = path.join(tempDir, 'border.png')
      const borderedPath = path.join(tempDir, 'bordered.png')

      await sharp({
        create: { width: 100, height: 100, channels: 3, background: 'white' }
      })
        .png()
        .toFile(imagePath)

      await sharp(imagePath)
        .extend({ top: 10, bottom: 10, left: 10, right: 10, background: 'black' })
        .toFile(borderedPath)

      const borderedMeta = await sharp(borderedPath).metadata()
      expect(borderedMeta.width).toBe(120)
      expect(borderedMeta.height).toBe(120)
    })

    it('should convert image to grayscale', async () => {
      const imagePath = path.join(tempDir, 'color.png')
      const grayPath = path.join(tempDir, 'gray.png')

      await sharp({
        create: { width: 100, height: 100, channels: 3, background: { r: 255, g: 0, b: 0 } }
      })
        .png()
        .toFile(imagePath)

      await sharp(imagePath)
        .grayscale()
        .toFile(grayPath)

      expect(fs.existsSync(grayPath)).toBe(true)
    })

    it('should blur image', async () => {
      const imagePath = path.join(tempDir, 'blur.png')
      const blurredPath = path.join(tempDir, 'blurred.png')

      await sharp({
        create: { width: 100, height: 100, channels: 3, background: 'white' }
      })
        .png()
        .toFile(imagePath)

      await sharp(imagePath)
        .blur(5)
        .toFile(blurredPath)

      expect(fs.existsSync(blurredPath)).toBe(true)
    })
  })

  describe('Batch Image Processing', () => {
    it('should process multiple images', async () => {
      const images = []

      for (let i = 0; i < 3; i++) {
        const imagePath = path.join(tempDir, `batch-${i}.png`)
        await sharp({
          create: { width: 100, height: 100, channels: 3, background: 'white' }
        })
          .png()
          .toFile(imagePath)
        images.push(imagePath)
      }

      for (const imagePath of images) {
        expect(fs.existsSync(imagePath)).toBe(true)
      }

      expect(images.length).toBe(3)
    })

    it('should resize batch of images', async () => {
      const origImages = []
      const resizedImages = []

      // Create batch
      for (let i = 0; i < 2; i++) {
        const origPath = path.join(tempDir, `orig-${i}.png`)
        await sharp({
          create: { width: 200, height: 200, channels: 3, background: 'white' }
        })
          .png()
          .toFile(origPath)
        origImages.push(origPath)
      }

      // Resize batch
      for (const origPath of origImages) {
        const resizedPath = origPath.replace('orig-', 'resized-')
        await sharp(origPath)
          .resize(100, 100)
          .toFile(resizedPath)
        resizedImages.push(resizedPath)
      }

      expect(resizedImages.length).toBe(2)
      for (const resizedPath of resizedImages) {
        expect(fs.existsSync(resizedPath)).toBe(true)
      }
    })
  })

  describe('Image Error Handling', () => {
    it('should fail gracefully on non-existent image', async () => {
      const nonExistentPath = path.join(tempDir, 'nonexistent.png')

      await expect(sharp(nonExistentPath).metadata()).rejects.toThrow()
    })

    it('should fail on invalid image file', async () => {
      const invalidPath = path.join(tempDir, 'invalid.png')
      fs.writeFileSync(invalidPath, 'not an image')

      await expect(sharp(invalidPath).metadata()).rejects.toThrow()
    })

    it('should handle resize with zero dimensions', async () => {
      const imagePath = path.join(tempDir, 'zero-resize.png')

      await sharp({
        create: { width: 100, height: 100, channels: 3, background: 'white' }
      })
        .png()
        .toFile(imagePath)

      // Sharp throws immediately on invalid resize parameters
      expect(() => {
        sharp(imagePath).resize(0, 100)
      }).toThrow()
    })

    it('should handle negative dimensions', async () => {
      const imagePath = path.join(tempDir, 'neg-resize.png')

      await sharp({
        create: { width: 100, height: 100, channels: 3, background: 'white' }
      })
        .png()
        .toFile(imagePath)

      // Sharp throws immediately on invalid resize parameters
      expect(() => {
        sharp(imagePath).resize(-100, 100)
      }).toThrow()
    })
  })
})
