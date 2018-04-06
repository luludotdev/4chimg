#!/usr/bin/env node
const program = require('commander')
const { downloadThread } = require('../src/index')

// Allow Console Statements
/* eslint no-console: 0 */

program
  .version(require('../package.json').version)
  .arguments('<input>')
  .option('-D, --directory <dir>', 'Download Directory (uses current if not specified)')
  .parse(process.argv)

/**
 * @param {program} p Commander Program
 */
const main = async p => {
  if (program.args.length === 0) program.help()
  try {
    let directory = p.directory || '.'
    let [url] = p.args

    console.log('Downloading...')
    await downloadThread(url, directory)
  } catch (err) {
    console.error(err)
  }
}

main(program)
