# bsplit2

[![NPM](https://nodei.co/npm/bsplit2.svg)](https://nodei.co/npm/bsplit2/)

A transform stream that splits incoming data into newline separated chunks.

Similar to [split2](https://github.com/mcollina/split2) but only operates on the binary data, doesn't do a string conversion, and _only_ looks for `\n` in the incoming stream. Use split2 if you want to break on `/\r?\n/` or if you're concerned that `\n` may not properly indicate newlines (e.g. unicode codepoints that include `\n` bytes).

Not similar and no relation to the "bsplit" package.

## API

```js
const bsplit = require('bsplit2')
const splittingStream = bsplit()
// ... pipe something through splittingStream ...
```

## Example

example.js:

```js
const fs = require('fs')
const bsplit = require('bsplit')

let i = 1
fs.createReadStream(__filename)
  .pipe(bsplit())
  .on('data', (line) => console.log(`${i++}: ${line.toString()}`))
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
```

Or if you want to use a stream as an async iterator:

```js
const fs = require('fs')
const bsplit = require('bsplit2')

async function run () {
  let i = 1
  const stream = fs.createReadStream(__filename).pipe(bsplit())

  for await (const line of stream) {
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
5:   let i = 1
6:   const stream = fs.createReadStream(__filename).pipe(bsplit())
7: 
8:   for await (const line of stream) {
9: 	  console.log(`${i++}: ${line.toString()}`)
10:   }
11: }
12: 
13: run().catch((err) => {
14:   console.error(err.stack)
15:   process.exit(1)
16: })
```

bsplit2's readable streams are "[object mode](https://nodejs.org/api/stream.html#stream_object_mode)" meaning that they apply different backpressure rules even though they are still dealing with binary data. This may be an important consideration depending on your use-case. This can be turned off by messing with `stream._readableState.objectMode` (not recommended) but the internal stream `read()` function will revert back to providing non-newline-delimited chunks because it pulls from a buffer of chunks. This impacts async iterators and some other stream modes but the `'data'` event won't be impacted although it will drop blank lines.

## Licence & Copyright

Copyright 2019 Rod Vagg

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
