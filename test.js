/* Copyright (c) Rod Vagg, Licensed under Apache-2.0 */

const bsplit = require('./')
const bsplitAsyncIter = require('./async-it.js')
const bsplitSyncIter = require('./it.js')
const fs = require('fs')
const assert = require('assert')
const bl = require('bl')
const crypto = require('crypto')

const fooBar = {
  input: Object.freeze([
    'foo',
    '\n',
    'baaa', 'arrr\n',
    'baz\n\nqux',
    '\ntrailing',
  ]),
  expected: Object.freeze([
    'foo',
    'baaaarrr',
    'baz',
    '',
    'qux',
    'trailing',
  ]),
}

function verify (actual, expected, callback) {
  return function () {
    assert.strictEqual(actual.length, expected.length, 'correct number of lines')
    for (let i = 0; i < actual.length; i++) {
      assert(Buffer.isBuffer(actual[i]), 'data chunk is a buffer')
      assert.strictEqual(actual[i].toString(), expected[i], `correct line #${i + 1}`)
    }
    callback()
  }
}

function testStreamSmallFile (callback) {
  let expected = fs.readFileSync(__filename, 'utf8').split('\n')
  expected = expected.slice(0, expected.length - 1)
  let actual = []
  fs.createReadStream(__filename)
    .pipe(bsplit())
    .on('data', (line) => actual.push(line))
    .on('end', verify(actual, expected, () => {
      console.info('testStreamSmallFile works')
      callback()
    }))
}

function testStreamRandomChunks (callback) {
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
    .on('end', verify(actual, expected, () => {
      console.info('testStreamRandomChunks works')
      callback()
    }))
}

const testStreamSmallFileConsumeAsync = (callback) => {
  ;(async () => {
    let expected = fs.readFileSync(__filename, 'utf8').split('\n')
    expected = expected.slice(0, expected.length - 1)
    const stream = fs.createReadStream(__filename).pipe(bsplit())

    let linesI = 0
    for await (const line of stream) {
      assert.strictEqual(line.toString(), expected[linesI], 'correct line #' + linesI)
      linesI++
    }
    assert.strictEqual(linesI, expected.length, 'correct length of file')
  })()
  .then(() => {
    console.info('testStreamSmallFileConsumeAsync works')
    callback()
  })
  .catch(assert.ifError)
}

const testAsyncIterFooBar = async (callback) => {
  const chunks = fooBar.input.map(str => Buffer.from(str))
  const reader = async function* () {
    for (const chunk of chunks) yield chunk
  }
  const it = bsplitAsyncIter(reader())

  const {expected} = fooBar
  let linesI = 0
  for await (const line of it) {
    assert.strictEqual(line.toString(), expected[linesI], 'correct linesI #' + linesI)
    linesI++
  }
  assert.strictEqual(linesI, expected.length, 'correct length of file')

  console.info('testAsyncIterFooBar works')
  callback()
}

const testAsyncIterSmallFile = (callback) => {
  ;(async () => {
    let expected = fs.readFileSync(__filename, 'utf8').split('\n')
    expected = expected.slice(0, expected.length - 1)
    const asyncIt = bsplitAsyncIter(fs.createReadStream(__filename))

    let linesI = 0
    for await (const line of asyncIt) {
      assert.strictEqual(line.toString(), expected[linesI], 'correct line #' + linesI)
      linesI++
    }
    assert.strictEqual(linesI, expected.length, 'correct length of file')
  })()
  .then(() => {
    console.info('testAsyncIterSmallFile works')
    callback()
  })
  .catch(assert.ifError)
}

const generateRandomChunks = (amount = 10) => {
  return new Array(10)
  .fill(null)
  .map(() => crypto.randomBytes(100 + Math.round(Math.random() * 1000)))
}

const testAsyncIterRandomChunks = async (callback) => {
  const chunks = generateRandomChunks()
  const expected = Buffer.concat(chunks).toString('utf8').split('\n')

  const reader = async function* () {
    for (const chunk of chunks) yield chunk
  }
  const it = bsplitAsyncIter(reader())

  let linesI = 0
  for await (const line of it) {
    assert.strictEqual(line.toString(), expected[linesI], 'correct linesI #' + linesI)
    linesI++
  }
  assert.strictEqual(linesI, expected.length, 'correct length of file')

  console.info('testAsyncIterRandomChunks works')
  callback()
}

const testSyncIterFooBar = (callback) => {
  const chunks = fooBar.input.map(str => Buffer.from(str))
  const reader = function* () {
    for (const chunk of chunks) yield chunk
  }
  const it = bsplitSyncIter(reader())

  const {expected} = fooBar
  let linesI = 0
  for (const line of it) {
    assert.strictEqual(line.toString(), expected[linesI], 'correct linesI #' + linesI)
    linesI++
  }
  assert.strictEqual(linesI, expected.length, 'correct length of file')

  console.info('testSyncIterFooBar works')
}

const testSyncIterRandomChunks = (callback) => {
  const chunks = generateRandomChunks()
  const expected = Buffer.concat(chunks).toString('utf8').split('\n')

  const reader = function* () {
    for (const chunk of chunks) yield chunk
  }
  const it = bsplitSyncIter(reader())

  let linesI = 0
  for (const line of it) {
    assert.strictEqual(line.toString(), expected[linesI], 'correct linesI #' + linesI)
    linesI++
  }
  assert.strictEqual(linesI, expected.length, 'correct length of file')

  console.info('testSyncIterRandomChunks works')
}

testStreamSmallFile(() => {
  testStreamRandomChunks(() => {
    testStreamSmallFileConsumeAsync(() => {
      testAsyncIterFooBar(() => {
        testAsyncIterSmallFile(() => {
          testAsyncIterRandomChunks(() => {
            testSyncIterFooBar()
            testSyncIterRandomChunks()
          })
        })
      })
    })
  })
})
