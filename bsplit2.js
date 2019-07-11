/* Copyright (c) Rod Vagg, Licensed under Apache-2.0 */

const { Transform } = require('stream')

function split () {
  let overflow = []

  return new Transform({
    transform (chunk, enc, callback) {
      let start = 0
      for (let i = 0; i < chunk.byteLength; i++) {
        if (chunk[i] === 10) { // '\n'
          let next = chunk.slice(start, i)
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
}

module.exports = split
