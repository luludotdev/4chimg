const { promisify } = require('util')
const { createWriteStream } = require('fs')
const ensureDir = promisify(require('mkdirp'))
const { join, parse } = require('path')
const fetch = require('node-fetch')

/**
 * @typedef {Object} Post
 * @property {number} no
 * @property {string} now
 * @property {string} name
 * @property {string} sub
 * @property {string} com
 * @property {string} filename
 * @property {string} ext
 * @property {number} [tim]
 */

/**
 * @param {string} url Thread URL
 * @returns {Promise.<{ board: string, posts: Post[] }>}
 */
const fetchThreadJSON = async url => {
  const test = url.match(/https?:\/\/boards\.4chan\.org\/([a-z]+)\/thread\/([0-9]+)\/?/)
  if (test === null) throw new Error('Board not found!')
  const [, board, index] = test

  const resp = await fetch(`http://a.4cdn.org/${board}/thread/${index}.json`)
  const { posts } = await resp.json()

  return { board, posts }
}

/**
 * @param {Post[]} posts Posts
 * @param {string} board Board
 * @returns {string[]}
 */
const filterPosts = (posts, board) => posts
  .filter(x => x.tim !== undefined)
  .map(x => `http://i.4cdn.org/${board}/${x.tim}${x.ext}`)

/**
 * @param {string} post Post URL
 * @param {string} directory Directory to save to
 * @param {Function} [cb] Callback Function
 * @param {number} max Max number of posts
 * @returns {Promise.<void>}
 */
const saveFile = (post, directory, cb, max) => new Promise(async resolve => {
  const { base } = parse(post)
  const filePath = join(directory, base)

  const resp = await fetch(post)
  const dest = createWriteStream(filePath)

  resp.body.pipe(dest)
    .on('close', () => {
      cb(max)
      return resolve()
    })
})

/**
 * @param {string[]} posts Post URLs
 * @param {string} directory Directory to save to
 * @param {Function} [cb] Callback Function
 */
const saveAll = async (posts, directory, cb) => {
  await ensureDir(directory)
  return Promise.all(posts.map(post => saveFile(post, directory, cb, posts.length)))
}

/**
 * Download all images in a 4chan thread
 * @param {string} url Thread URL
 * @param {string} directory Directory to save into
 * @param {Function} [cb] Callback executed when a download is completed
 * @returns {Promise.<void>}
 */
const downloadThread = (url, directory, cb = () => {
  // No Op
}) => fetchThreadJSON(url)
  .then(x => filterPosts(x.posts, x.board))
  .then(posts => saveAll(posts, directory, cb))

module.exports = { downloadThread }
