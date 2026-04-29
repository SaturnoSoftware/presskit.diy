'use strict'

const fs = require('fs')
const fse = require('fs-extra')
const path = require('upath')

function createDir (dir) {
  if (fs.existsSync(dir)) {
    return false
  }

  fs.mkdirSync(dir, { recursive: true })
  return true
}

function copyDirContent (source, target) {
  if (!fs.existsSync(source)) return

  createDir(target)

  findAllFiles(source).forEach((name) => {
    const nameWithoutSource = path.relative(source, name)
    const targetFile = path.join(target, nameWithoutSource)
    fse.outputFileSync(targetFile, fs.readFileSync(name))
  })
}

function findAllFiles (baseDir, {
  ignoredFolders = [],
  maxDepth = undefined
} = {}) {
  const list = []

  function search (dir, depth) {
    let entries
    try {
      entries = fs.readdirSync(dir)
    } catch (e) {
      return
    }

    entries.forEach(file => {
      file = path.join(dir, file)

      let stat
      try {
        stat = fs.statSync(file)
      } catch (e) {
        return
      }

      if (stat.isFile()) {
        list.push(file)
      } else if (stat.isDirectory()) {
        if (ignoredFolders.includes(path.basename(file))) {
          return
        }

        if (maxDepth !== undefined && (depth >= maxDepth)) {
          return
        }

        search(file, depth + 1)
      }
    })
  }

  search(baseDir, 0)

  return list
}

module.exports = {
  createDir,
  copyDirContent,
  findAllFiles
}
