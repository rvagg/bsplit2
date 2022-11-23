# bsplit2

[![NPM](https://nodei.co/npm/bsplit2.svg)](https://nodei.co/npm/bsplit2/)

A transform stream that splits incoming data into newline separated chunks.

Similar to [split2](https://github.com/mcollina/split2) but only operates on the binary data, doesn't do a string conversion, and _only_ looks for `\n` in the incoming stream. Use split2 if you want to break on `/\r?\n/` or if you're concerned that `\n` may not properly indicate newlines (e.g. unicode codepoints that include `\n` bytes).

Not similar and no relation to the "bsplit" package.

## API

### `Transform` stream

`bsplit2` is a [transform stream](https://nodejs.org/docs/latest-v16.x/api/stream.html#class-streamtransform), so you can use e.g. `.pipe()` to connect it to other streams:

```js
const fs = require('fs')
const bsplit = require('bsplit')

let i = 1
fs.createReadStream(__filename)
  .pipe(bsplit())
  .on('data', (line) => console.log(`${i++}: ${line.toString()}`))
  .once('end', () => console.log('end of file.'))
```

When run, will output:

```
1: const fs = require('fs')
2: const bsplit = require('bsplit2')
3: 
4: let i = 1
5: fs.createReadStream(__filename)
6:   .pipe(bsplit())
7:   .on('data', (line) => console.log(`${i++}: ${line.toString()}`))
8:   .once('end', () => console.log('end of file.'))
end of file.
```

Because any readable stream is an [async iterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#the_async_iterator_and_async_iterable_protocols), you can read from a `bsplit2` stream using `for await`:

```js
const fs = require('fs')
const bsplit = require('bsplit2')

async function run () {
  const file = fs.createReadStream(__filename)
  const lines = file.pipe(bsplit())

  let i = 1
  for await (const line of lines) {
    console.log(`${i++}: ${line.toString()}`)
  }
}

run().catch((err) => {
  console.error(err.stack)
  process.exit(1)
})
```

When run, will output:

```
1: const fs = require('fs')
2: const bsplit = require('bsplit2')
3: 
4: async function run () {
5:   const file = fs.createReadStream(__filename)
6:   const lines = file.pipe(bsplit()) 
7:   let i = 1
8:   for await (const line of lines) {
9:     console.log(`${i++}: ${line.toString()}`)
10:   }
11: }
12: 
13: run().catch((err) => {
14:   console.error(err.stack)
15:   process.exit(1)
16: })
```

bsplit2's readable streams are "[object mode](https://nodejs.org/api/stream.html#stream_object_mode)" meaning that they apply different backpressure rules even though they are still dealing with binary data. This may be an important consideration depending on your use-case. This can be turned off by messing with `stream._readableState.objectMode` (not recommended) but the internal stream `read()` function will revert back to providing non-newline-delimited chunks because it pulls from a buffer of chunks. This impacts async iterators and some other stream modes but the `'data'` event won't be impacted although it will drop blank lines.

### async iteration

If you want to consume `bsplit2` via [async iteration](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#the_async_iterator_and_async_iterable_protocols) *anyways* and don't need the transform stream behavior (see above), you can use `bsplit2/async-it.js`, which

- is 5-10x faster than the stream-based `bsplit2`, but
- requires the input to be an async iterable/iterator.

```js
const fs = require('fs')
const bsplitAsyncIt = require('bsplit2/async-it.js')

const file = fs.createReadStream(__filename)
const lines = bsplitAsyncIt(file)

let i = 1
for await (const line of lines) {
  console.log(`${i++}: ${line.toString()}`)
}
```

### (synchronous) iteration

If you want to consume `bsplit2` via [synchronous/"plain" iteration](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#the_iterator_protocol) and don't need an asynchronicity whatsoever, you can use `bsplit2/it.js`, which

- is 10-20x faster than the stream-based `bsplit2`, but
- requires the input to be a (synchronous) iterable/iterator, and
- blocks Node's event loop until it has split all input data.

Because in Node.js almost all APIs are asynchronous/streaming, legitimate use cases for this are rare!

```js
const {randomBytes} = require('crypto')
const bsplitAsyncIt = require('bsplit2/async-it.js')

// we make up random data
const someData = [
  randomBytes(1024), // 1kb
  randomBytes(100),
  randomBytes(3 * 1024),
]
const reader = function* () {
  for (let i = 0; i < someData.length; i++) {
    yield someData[i]
  }  
}

const lines = bsplitAsyncIt(reader())
let i = 1
for (const line of stream) {
  console.log(`${i++}: ${line.toString()}`)
}
```

## performance

```
NANOBENCH version 2
> /opt/homebrew/Cellar/node/19.1.0/bin/node benchmark.js

# passthrough, Readable src, via stream.pipeline, 1_000 * 100kb
ok ~11 ms (0 s + 10856000 ns)

# passthrough, Readable src, via stream.pipeline, 50_000 * 100kb
ok ~38 ms (0 s + 37563542 ns)

# bsplit2.js, Readable src, via stream.pipeline, 1_000 * 100kb
ok ~908 ms (0 s + 907881792 ns)

# bsplit2.js, Readable src, via stream.pipeline, 50_000 * 100kb
ok ~45 s (44 s + 951027916 ns)

# bsplit2.js, Readable src, via asyncIterator, 1_000 * 100kb
ok ~951 ms (0 s + 950868500 ns)

# bsplit2.js, Readable src, via asyncIterator, 50_000 * 100kb
ok ~48 s (47 s + 703336458 ns)

# async-it.js, Readable src, via asyncIterator, 1_000 * 100kb
ok ~107 ms (0 s + 107212959 ns)

# async-it.js, Readable src, via asyncIterator, 50_000 * 100kb
ok ~5.12 s (5 s + 116922959 ns)

# async-it.js, asyncIterator src, via asyncIterator, 1_000 * 100kb
ok ~102 ms (0 s + 102475125 ns)

# async-it.js, asyncIterator src, via asyncIterator, 50_000 * 100kb
ok ~5.12 s (5 s + 116871834 ns)

# it.js, iterator src, via iterator, 1_000 * 100kb
ok ~53 ms (0 s + 53113542 ns)

# it.js, iterator src, via iterator, 50_000 * 100kb
ok ~2.59 s (2 s + 590209416 ns)

all benchmarks completed
ok ~1.78 min (107 s + 648340043 ns)
```

## Licence & Copyright

Copyright 2019 Rod Vagg

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
