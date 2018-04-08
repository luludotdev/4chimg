const fs = require('fs-extra')
const { join, parse } = require('path')
const { get } = require('snekfetch')

const fetchThreadJSON = async url => {
  let [, board, index] = url.match(/http:\/\/boards\.4chan\.org\/([a-z]+)\/thread\/([0-9]+)\/?/)
  let { text } = await get(`http://a.4cdn.org/${board}/thread/${index}.json`)
  let { posts } = JSON.parse(text)
  return { board, posts }
}

const filterPosts = (posts, board) => posts.filter(x => x.tim !== undefined)
  .map(x => `http://i.4cdn.org/${board}/${x.tim}${x.ext}`)

const saveFile = (post, directory) => new Promise(resolve => {
  let { base } = parse(post)
  let out = fs.createWriteStream(join(directory, base))
  get(post).pipe(out).on('close', () => { resolve() })
})

const saveAll = async (posts, directory) => {
  await fs.ensureDir(directory)
  return Promise.all(posts.map(post => saveFile(post, directory)))
}

/**
 * Download all images in a 4chan thread
 * @param {string} url Thread URL
 * @param {string} directory Directory to save into
 * @returns {Promise.<void>}
 */
const downloadThread = (url, directory) => fetchThreadJSON(url)
  .then(x => filterPosts(x.posts, x.board))
  .then(posts => saveAll(posts, directory))

module.exports = { downloadThread }
