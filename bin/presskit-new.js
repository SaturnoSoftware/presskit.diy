'use strict'

const chalk = require('chalk')
const { program } = require('commander')
const presskit = require('../lib/index')

// -------------------------------------------------------------
// Constants.
// -------------------------------------------------------------

const version = require('../package.json').version

const usage = chalk.green('[options]') + ' ' + chalk.yellow('<destination>')

const description = `Create a guided presskit.diy starter \`data.json\` file and its \`images/\` folder in the <destination> folder (current working directory by default).

  The generated \`data.json\` uses JSONC-style comments so it can act as a filled guide as well as a starter file.

  Primary CLI: ${chalk.blue('presskit-diy new')} (compatibility alias: ${chalk.blue('presskit new')}).

  There are two template types available: ${chalk.blue('company')} (default) or ${chalk.blue('product')}.`

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
  .option('-t, --type [company]', 'set the type of the new `data.json` file', 'company')
  .parse(process.argv)

presskit.runNewCommand(program.opts().type, program.args[0] || process.cwd())
