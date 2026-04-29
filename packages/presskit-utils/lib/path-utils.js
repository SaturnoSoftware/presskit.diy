'use strict'

const path = require('path')

function normalizeFsPath (value, { allowBareName = false } = {}) {
  if (typeof value !== 'string') return value

  const trimmed = value.trim()
  if (!trimmed) return trimmed

  if (allowBareName && isBareName(trimmed)) {
    return trimmed
  }

  if (process.platform === 'win32') {
    return path.normalize(trimmed)
  }

  const translated = translateWindowsPathToWsl(trimmed)
  return path.normalize(translated.replace(/\\/g, '/'))
}

function isBareName (value) {
  return !value.includes('/') &&
    !value.includes('\\') &&
    !isWindowsAbsolutePath(value) &&
    !isUncPath(value)
}

function isWindowsAbsolutePath (value) {
  return /^[a-zA-Z]:[\\/]/.test(value)
}

function isUncPath (value) {
  return /^\\\\[^\\]/.test(value)
}

function translateWindowsPathToWsl (value) {
  if (!isWindowsAbsolutePath(value)) {
    return value
  }

  const drive = value[0].toLowerCase()
  const remainder = value
    .slice(2)
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')

  return path.posix.join('/mnt', drive, remainder)
}

module.exports = {
  normalizeFsPath,
  __isBareName: isBareName,
  __isWindowsAbsolutePath: isWindowsAbsolutePath,
  __translateWindowsPathToWsl: translateWindowsPathToWsl
}
