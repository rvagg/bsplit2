# bsplit2

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
2: const bsplit = require('bsplit')
3: let i = 1
4: fs.createReadStream(__filename)
5:   .pipe(bsplit())
6:   .on('data', (line) => console.log(`${i++}: ${line.toString()}`))
```

Note the missing blank line. Empty chunks are not passed on with Node streams so you will not get an additional chunk in between consecutive `\n` characters.

## Licence & Copyright

Copyright 2019 Rod Vagg

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
