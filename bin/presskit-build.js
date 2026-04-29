'use strict'

const path = require('path')
const chalk = require('chalk')
const { program } = require('commander')
const presskit = require('../lib/index')

// -------------------------------------------------------------
// Constants.
// -------------------------------------------------------------

const version = require('../package.json').version

const usage = chalk.green('[options]') + ' ' + chalk.yellow('<entry point>')

const description = `Generate a presskit.diy site from \`data.xml\` or \`data.json\` files. The output stays intentionally close to the classic ${chalk.blue('http://dopresskit.com/')} style, but the result is a static HTML build.

  This fork is maintained by Saturno.Software and builds on presskit.html by Pixelnest Studio.
  Primary CLI: ${chalk.blue('presskit-diy build')} (compatibility alias: ${chalk.blue('presskit build')}).`

const helpFooter = `
Saturno.Software
  Copyright (c) 2026 Saturno.Software
  https://saturno.software

Original credits
  presskit.html by Pixelnest Studio
  presskit() by Rami Ismail / Vlambeer
`

// -------------------------------------------------------------
// Module.
// -------------------------------------------------------------

program
  .version(version)
  .description(description)
  .usage(usage)
  .addHelpText('after', helpFooter)
  .option(
    '-o, --output [destination]', 'output the build folder to the [destination] (defaults to ./build)',
    path.join(process.cwd(), 'build')
  )
  .option('-w, --watch', 'watch project for changes and re-generate if needed')
  .option('-d, --dev', 'add monitoring of CSS and templates in watch mode')
  .option('-p, --port [8080]', 'set the server port to [8080]', 8080)
  .option('-D, --clean-build-folder', 'delete the build folder beforehand')
  .option('-L, --pretty-links', 'hide index.html at the end of links')
  .option('-M, --collapse-menu', 'use a collapsed menu (hamburger) on small screens')
  .option('-B, --base-url [base]', 'prefix absolute urls with [base] (if your presskit is not at the root of your server)', '/')
  .option('-T, --ignore-thumbnails', 'use original images in galleries instead of thumbnails (will increase pages size)')
  .option('-C, --css [name]', 'CSS theme to use: a built-in name (light, dark) or a path to a custom file', 'light')
  .parse(process.argv)

const opts = program.opts()
presskit.runBuildCommand({
  entryPoint: program.args[0],
  cleanBuildFolder: opts.cleanBuildFolder,
  ignoreThumbnails: opts.ignoreThumbnails,
  prettyLinks: opts.prettyLinks,
  baseUrl: opts.baseUrl,
  css: opts.css,
  hamburger: opts.collapseMenu,
  output: opts.output,
  watch: opts.watch,
  port: opts.port,
  dev: opts.dev
})
