const { createWriteStream, ensureDir } = require('fs-extra')
const { join, parse } = require('path')
const { get } = require('snekfetch')

const fetchThreadJSON = async url => {
  let [, board, index] = url.match(/http:\/\/boards\.4chan\.org\/([a-z]+)\/thread\/([0-9]+)\/?/)
  let { body } = await get(`http://a.4cdn.org/${board}/thread/${index}.json`)
  let { posts } = body
  return { board, posts }
}

const filterPosts = (posts, board) => posts.filter(x => x.tim !== undefined)
  .map(x => `http://i.4cdn.org/${board}/${x.tim}${x.ext}`)

const saveFile = (post, directory, cb, max) => new Promise(resolve => {
  let { base } = parse(post)
  let out = createWriteStream(join(directory, base))
  get(post).pipe(out).on('close', () => {
    cb(max)
    return resolve()
  })
})

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
