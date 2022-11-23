const {EOL} = require('os')

module.exports = binarySplitUsingAyncIteration

async function* binarySplitUsingAyncIteration (input, splitOn = EOL) {
	const matcher = Buffer.from && Buffer.from !== Uint8Array.from
		? Buffer.from(splitOn)
		: new Buffer(splitOn) // eslint-disable-line

	let buffered = Buffer.allocUnsafe(0)
	let matchOffset = 0, matchIdx = -1
	for await (const chunk of input) {
		if (chunk.length === 0) continue

		matchOffset = 0
		while (true) {
			matchIdx = chunk.indexOf(matcher, matchOffset)
			if (matchIdx === -1) break

			const secondHalf = chunk.slice(matchOffset, matchIdx)
			if (buffered.length > 0) {
				yield Buffer.concat([buffered, secondHalf])
				// apparently not faster:
				// yield (secondHalf.length === 0
				// 	? buffered
				// 	: Buffer.concat([buffered, secondHalf])
				// )
				buffered = Buffer.allocUnsafe(0)
			} else {
				yield secondHalf
			}
			matchOffset = matchIdx + 1
		}

		// there is an unmatched part of `chunk`
		if (matchOffset < (chunk.length - 1)) {
			const rest = matchOffset === 0
				? chunk
				: chunk.slice(matchOffset)
			buffered = buffered.length === 0
				? rest
				: Buffer.concat([buffered, rest])
		}
	}

	if (buffered.length > 0) yield buffered
}
