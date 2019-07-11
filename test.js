/* Copyright (c) Rod Vagg, Licensed under Apache-2.0 */

const bsplit = require('./')
const fs = require('fs')
const assert = require('assert')
const bl = require('bl')
const crypto = require('crypto')

function verify (actual, expected, callback) {
  return function () {
    assert.strictEqual(actual.length, expected.length, 'correct number of lines')
    for (let i = 0; i < actual.length; i++) {
      assert(Buffer.isBuffer(actual[i]), 'data chunk is a buffer')
      assert.strictEqual(actual[i].toString(), expected[i], `correct line #${i + 1}`)
      callback()
    }
  }
}

function testSmallFile (callback) {
  let expected = fs.readFileSync(__filename, 'utf8').split('\n').filter(Boolean)
  let actual = []
  fs.createReadStream(__filename)
    .pipe(bsplit())
    .on('data', (line) => actual.push(line))
    .on('end', verify(actual, expected, callback))
}

function testRandomChunks (callback) {
  let list = bl()
  let expected = []
  let actual = []
  for (let i = 0; i < 100; i++) {
    let s = ''
    do {
      let ss = crypto.randomBytes(Math.ceil(Math.random() * 1024)).toString('base64')
      expected.push(ss)
      s += `${ss}\n`
    } while (Math.random() > 0.5)
    list.append(Buffer.from(s))
  }

  list.pipe(bsplit())
    .on('data', (line) => actual.push(line))
    .on('end', verify(actual, expected, callback))
}

testSmallFile(() => {
  testRandomChunks(() => {})
})
