'use strict'

const {randomBytes} = require('crypto')
const {Readable, Writable, pipeline, PassThrough} = require('stream')
const bench = require('nanobench')
const bsplit2 = require('.')

const LINE_FEED = Buffer.from('\n')
const generateChunks = (amount) => {
	return new Array(amount)
	.fill(null)
	.map(() => {
		const buf = randomBytes(100 * 1024)
		for (let i = 0; i < buf.length; i += Math.round(100 * Math.random())) {
			buf[i] = LINE_FEED
		}
		return buf
	})
}

const chunksAsReadable = (chunks) => {
	let i = 0
	return new Readable({
		read: function () {
			this.push(chunks[i++])
			if (i === chunks.length) this.push(null)
		},
	})
}

const chunksAsAsyncIt = async function* (chunks) {
	for (let i = 0; i < chunks.length; i++) {
		yield chunks[i]
	}
}

const benchPipeline = (makeSrc, makeTransform) => (b) => {
	const src = makeSrc()
	const transform = makeTransform()
	const sink = new Writable({
		write: function (_, __, cb) {
			cb()
		},
		writev: function (_, __, cb) {
			cb()
		},
	})

	b.start()
	pipeline(src, transform, sink, (err) => {
		if (err) b.error(err)
		b.end()
	})
}

const benchAsyncIt = (makeTransform) => (b) => {
	const transform = makeTransform()
	;(async () => {
		b.start()
		for await (const _ of transform) {}
		b.end()
	})()
	.catch(err => b.error(err))
}

const benchIt = (makeTransform) => (b) => {
	const transform = makeTransform()
	b.start()
	for (const _ of transform) {}
	b.end()
}

bench('passthrough, Readable src, via stream.pipeline, 1_000 * 100kb', benchPipeline(
	() => chunksAsReadable(generateChunks(1_000)),
	() => new PassThrough(),
))
bench('passthrough, Readable src, via stream.pipeline, 50_000 * 100kb', benchPipeline(
	() => chunksAsReadable(generateChunks(50_000)),
	() => new PassThrough(),
))

bench('bsplit2.js, Readable src, via stream.pipeline, 1_000 * 100kb', benchPipeline(
	() => chunksAsReadable(generateChunks(1_000)),
	() => bsplit2(),
))
bench('bsplit2.js, Readable src, via stream.pipeline, 50_000 * 100kb', benchPipeline(
	() => chunksAsReadable(generateChunks(50_000)),
	() => bsplit2(),
))

bench('bsplit2.js, Readable src, via asyncIterator, 1_000 * 100kb', benchAsyncIt(
	() => chunksAsReadable(generateChunks(1_000)).pipe(bsplit2()),
))
bench('bsplit2.js, Readable src, via asyncIterator, 50_000 * 100kb', benchAsyncIt(
	() => chunksAsReadable(generateChunks(50_000)).pipe(bsplit2()),
))
