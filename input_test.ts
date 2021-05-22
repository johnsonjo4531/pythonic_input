import { test, assertEquals, assertThrowsAsync } from "./dev_deps.ts";
import { inputReader } from "./input.ts";

// https://stackoverflow.com/a/21554107/2066736
function checkByteEquality(buf1: Uint8Array, buf2: Uint8Array) {
	if (buf1.byteLength != buf2.byteLength) return false;
	var dv1 = new Int8Array(buf1);
	var dv2 = new Int8Array(buf2);
	for (var i = 0; i != buf1.byteLength; i++) {
		if (dv1[i] != dv2[i]) return false;
	}
	return true;
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
	const readerInput = new Deno.Buffer();
	const readerOutput = new Deno.Buffer();
	readerInput.write(encoder.encode(linesIn.join("\n")));
	const expectedOutput = new Deno.Buffer();
	await Promise.all(
		linesOut.map(async (line) => expectedOutput.write(encoder.encode(line)))
	);
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

	const input = inputReader(readerInput, readerOutput);

	// test that we can get output correctly
	for (var i = 0; i < linesIn.length; ++i) {
		assertEquals(await input(linesOut[i]), linesIn[i]);
	}

	assertThrowsAsync(async () => {
		await input(linesOut[i])
	}, Deno.errors.UnexpectedEof);

	// test that data was output correctly
	assertEquals(checkByteEquality(readerOutput.bytes(), expectedOutput.bytes()), true);
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
	assertEquals(checkByteEquality(readerOutput.bytes(), expectedOutput.bytes()), true);
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

	// test that we can get output correctly
	for (var i = 0; i < linesIn.length; ++i) {
		assertEquals(await input(linesOut[i]), new TextEncoder().encode(linesIn[i]));
	}

	assertThrowsAsync(async () => {
		await input(linesOut[i])
	}, Deno.errors.UnexpectedEof);

	// test that data was output correctly
	assertEquals(checkByteEquality(readerOutput.bytes(), expectedOutput.bytes()), true);
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

	assertThrowsAsync(async () => {
		await input(new TextEncoder().encode(linesOut[i]))
	}, Deno.errors.UnexpectedEof);

	// test that data was output correctly
	assertEquals(checkByteEquality(readerOutput.bytes(), expectedOutput.bytes()), true);
});

test("Writer should write more than one input to stdout if fed more than one input", async function inputReaderTest() {
	const {
		linesIn,
		linesOut,
		readerInput,
		readerOutput,
	} = await GetStartData();

	const expectedOutput = new Deno.Buffer();
	const encoder = new TextEncoder();
	await Promise.all(
		linesOut.map(async (line) => {
			expectedOutput.write(encoder.encode(line))
			expectedOutput.write(encoder.encode('\n'))
		})
	);

	const input = inputReader(readerInput, readerOutput);

	// test that we can get output correctly
	for (var i = 0; i < linesIn.length; ++i) {
		assertEquals(await input(linesOut[i], "\n"), linesIn[i]);
	}

	assertThrowsAsync(async () => {
		await input(linesOut[i]);
	}, Deno.errors.UnexpectedEof);

	// test that data was output correctly
	assertEquals(checkByteEquality(readerOutput.bytes(), expectedOutput.bytes()), true);
});


