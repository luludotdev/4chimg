const fs = require('fs-extra')
const { join, parse } = require('path')
const { get } = require('snekfetch')

const fetchThreadJSON = async url => {
  let [, board, index] = url.match(/http:\/\/boards\.4chan\.org\/([a-z]+)\/thread\/([0-9]+)\/?/)
  let { text } = await get(`http://a.4cdn.org/${board}/thread/${index}.json`)
  let { posts } = JSON.parse(text)
  return posts
}

const filterPosts = posts => posts.filter(x => x.tim !== undefined)
  .map(x => `http://i.4cdn.org/h/${x.tim}${x.ext}`)

const saveAll = async (posts, directory) => {
  let dirPath = directory === undefined ? __dirname : join(__dirname, directory)

  await fs.ensureDir(dirPath)
  for (let post of posts) {
    let { base } = parse(post)
    let out = fs.createWriteStream(join(dirPath, base))
    get(post).pipe(out)
  }
}

const downloadThread = (url, directory) => fetchThreadJSON(url)
  .then(filterPosts)
  .then(posts => saveAll(posts, directory))

module.exports = { downloadThread }
