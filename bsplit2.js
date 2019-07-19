/* Copyright (c) Rod Vagg, Licensed under Apache-2.0 */

const { Transform } = require('stream')

function split () {
  let overflow = []

  const stream = Transform({
    transform (chunk, enc, callback) {
      let start = 0
      for (let i = 0; i < chunk.byteLength; i++) {
        if (chunk[i] === 10) { // '\n'
          const next = chunk.slice(start, i)
          if (overflow.length) {
            overflow.push(next)
            next = Buffer.concat(overflow)
            overflow = []
          }
          this.push(next)
          start = i + 1
        }
      }

      if (start < chunk.length) {
        overflow.push(chunk.slice(start))
      }

      callback()
    },

    flush (callback) {
      if (overflow.length) {
        return callback(null, Buffer.concat(overflow))
      }
      callback()
    }
  })

  stream._readableState.objectMode = true
  if (stream._readableState.highWaterMark) {
    stream._readableState.highWaterMark = 16
  }

  return stream
}

module.exports = split
