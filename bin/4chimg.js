#!/usr/bin/env node
const program = require('commander')
const { Spinner } = require('cli-spinner')
const { downloadThread } = require('../src/index')

// Allow Console Statements
/* eslint no-console: 0 */

program
  .version(require('../package.json').version)
  .arguments('<thread url>')
  .option('-D, --directory <dir>', 'Download Directory (uses current if not specified)')
  .parse(process.argv)

/**
 * @param {program} p Commander Program
 */
const main = async p => {
  if (program.args.length === 0) program.help()
  try {
    const directory = p.directory || '.'
    const [url] = p.args

    const spinner = new Spinner('%s downloading...')
    spinner.setSpinnerString(process.platform === 'win32' ? 0 : 18)
    spinner.start()

    let i = 0
    await downloadThread(url, directory, max => {
      i++
      spinner.setSpinnerTitle(`%s downloading... (${i} of ${max})`)
    })

    spinner.stop(true)
    console.log('finished downloading.')
  } catch (err) {
    console.error(err)
  }
}

main(program)
