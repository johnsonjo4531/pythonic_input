import { assertEquals, assertRejects, test } from "./dev_deps.ts";
import { inputReader } from "./input.ts";

// https://stackoverflow.com/a/21554107/2066736
function checkByteEquality(buf1: Uint8Array, buf2: Uint8Array) {
	if (buf1.byteLength != buf2.byteLength) return false;
	const dv1 = new Uint8Array(buf1);
	const dv2 = new Uint8Array(buf2);
	for (let i = 0; i != buf1.byteLength; ++i) {
		if (dv1[i] != dv2[i]) return false;
	}
	return true;
}

async function checkStreamEquality(readerOutput: ReadableStream<Uint8Array>, expectedOutput: Uint8Array[]) {
	let i = 0;
	for await (const item of readerOutput) {
		if (!checkByteEquality(item, expectedOutput[i])) return false;
		i++;
	}
	return true;
}

function createReadable(readerInput: Uint8Array | Uint8Array[]): ReadableStream<Uint8Array> {
	return new ReadableStream<Uint8Array>({
		start(controller) {
			if (Array.isArray(readerInput)) {
				for (const chunk of readerInput) {
					controller.enqueue(chunk);
				}
			} else {
				controller.enqueue(readerInput);
			}
		},
	});
}

function createTransformStream(): TransformStream<Uint8Array> {
	const transform = new TransformStream<Uint8Array>({
		start(_controller) {
		},
	})
	return transform
}

function createTransformStreamWithInput(readerInput: Uint8Array[]) {
	return new TransformStream<Uint8Array>({
		async start(controller) {
			console.log("FOOO2");
			for (const chunk of readerInput) {
				console.log("FOOO2.5");
				controller.enqueue(chunk);
			}
			controller.terminate();
		}
	});
}

async function GetStartData() {
	const linesIn = [
		"Something something",
		"Blah blah blah",
		"",
		"Don't know what to write here",
	];
	const linesOut = [
		"Enter something for first line: ",
		"Enter something for second line: ",
		"Enter something for third line: ",
		"Enter something for fourth line: ",
	];
	const encoder = new TextEncoder();
	console.log("FOOO");
	const readerInput = await createTransformStreamWithInput([encoder.encode(linesIn.join("\n"))]);
	const readerOutput = createTransformStream();
	const expectedOutput = linesOut.map((line) => encoder.encode(line));
	return {
		linesIn,
		linesOut,
		readerInput,
		readerOutput,
		expectedOutput,
	}
}

test("Input reader should read and write from Readers and Writers", async function inputReaderTest() {
	const {
		linesIn,
		linesOut,
		readerInput,
		readerOutput,
		expectedOutput,
	} = await GetStartData();


	const streamEquality = checkStreamEquality(readerOutput.readable, expectedOutput);

	const input = inputReader(readerInput, readerOutput);


	console.log("A");
	let i = 0;
	// test that we can get output correctly
	for (; i < linesIn.length; ++i) {
		console.log("B");
		console.log("length", linesIn.length, i)
		const out = await input(linesOut[i]);
		console.log("C", out, linesIn[i]);
		assertEquals(out, linesIn[i]);
		console.log("D");
	}

	await assertRejects(async () => {
		await input(linesOut[i])
	}, Deno.errors.UnexpectedEof);

	await readerOutput.writable.close();
	// test that data was output correctly
	assertEquals(await streamEquality, true);
	await new Promise(res => setTimeout(res, 1000));
});

test("Input reader should return null if nullOnEOF is set to true", async function inputReaderTest() {
	const {
		linesIn,
		linesOut,
		readerInput,
		readerOutput,
		expectedOutput,
	} = await GetStartData();

	const input = inputReader(readerInput, readerOutput, {
		nullOnEOF: true
	});

	// test that we can get output correctly
	for (var i = 0; i < linesIn.length; ++i) {
		assertEquals(await input(linesOut[i]), linesIn[i]);
	}

	assertEquals(await input(linesOut[i]), null);

	// test that data was output correctly
	assertEquals(await checkStreamEquality(readerOutput.readable, expectedOutput), true);
});


test("Output from reader should return buffers if bufferedRead is true", async function inputReaderTest() {
	const {
		linesIn,
		linesOut,
		readerInput,
		readerOutput,
		expectedOutput,
	} = await GetStartData();

	const input = inputReader(readerInput, readerOutput, {
		bufferedRead: true
	});

	let i = 0;
	// test that we can get output correctly
	for (; i < linesIn.length; ++i) {
		assertEquals(await input(linesOut[i]), new TextEncoder().encode(linesIn[i]));
	}

	await assertRejects(async () => {
		await input(linesOut[i])
	}, Deno.errors.UnexpectedEof);

	// test that data was output correctly
	assertEquals(await checkStreamEquality(readerOutput.readable, expectedOutput), true);
});

test("Writer should take in buffers if bufferedRead is true", async function inputReaderTest() {
	const {
		linesIn,
		linesOut,
		readerInput,
		readerOutput,
		expectedOutput,
	} = await GetStartData();

	const input = inputReader(readerInput, readerOutput, {
		bufferedWrite: true
	});

	// test that we can get output correctly
	for (var i = 0; i < linesIn.length; ++i) {
		assertEquals(await input(new TextEncoder().encode(linesOut[i])), linesIn[i]);
	}

	await assertRejects(async () => {
		await input(new TextEncoder().encode(linesOut[i]))
	}, Deno.errors.UnexpectedEof);

	// test that data was output correctly
	assertEquals(await checkStreamEquality(readerOutput.readable, expectedOutput), true);
});

test("Writer should write more than one input to stdout if fed more than one input", async function inputReaderTest() {
	const {
		linesIn,
		linesOut,
		readerInput,
		readerOutput,
	} = await GetStartData();

	const encoder = new TextEncoder();
	const expectedOutput = linesOut.flatMap((line) => [
		encoder.encode(line),
		encoder.encode('\n'),
	])

	const input = inputReader(readerInput, readerOutput);

	let i = 0;
	// test that we can get output correctly
	for (; i < linesIn.length; ++i) {
		assertEquals(await input(linesOut[i], "\n"), linesIn[i]);
	}

	await assertRejects(async () => {
		await input(linesOut[i]);
	}, Deno.errors.UnexpectedEof);

	// test that data was output correctly
	assertEquals(await checkStreamEquality(readerOutput.readable, expectedOutput), true);
});


