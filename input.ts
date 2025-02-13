export async function* bufferedLines(
	reader: ReadableStreamDefaultReader<Uint8Array>,
): AsyncIterator<Uint8Array> {
	let buffer = new Uint8Array(0);

	const newLine = 10;
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;

		// Concatenate the current chunk to the buffer
		const newBuffer = new Uint8Array(buffer.length + value.length);
		newBuffer.set(buffer);
		newBuffer.set(value, buffer.length);

		let index = 0;
		while (true) {
			// Find the position of the next newline character
			const nlIndex = new Uint8Array(
				newBuffer.buffer,
				newBuffer.byteOffset + index,
			).indexOf(newLine);

			if (nlIndex === -1) {
				// No complete line found, update buffer and break
				buffer = new Uint8Array(
					newBuffer.buffer,
					newBuffer.byteOffset + index,
				);
				break;
			}

			// Yield the complete line as a Uint8Array excluding the newline character
			yield new Uint8Array(
				newBuffer.buffer,
				newBuffer.byteOffset + index,
				nlIndex,
			);

			// Update index to move past the newline character and process the next line
			index += nlIndex + 1;
		}
	}

	// Process any remaining data in the buffer (last line without a trailing newline)
	if (buffer.length > 0) {
		yield buffer;
	}
}

export async function* lines(
	readable: ReadableStream<Uint8Array>,
): AsyncIterator<string> {
	const decoder = new TextDecoder();
	for await (const line of readable) {
		yield decoder.decode(line);
	}
}

/** The settings for the input reader */
export type InputReaderSettings = {
	readonly bufferedRead?: boolean;
	readonly bufferedWrite?: boolean;
	/** If true it will return null on Eof instead of throwing an error. Good if you don't know the length of the input being read. */
	readonly nullOnEOF?: boolean;
};

const InputReaderDefaults = {
	bufferedIn: false,
	bufferedOut: false,
	nullOnEOF: false,
} as const;

type WithBufferedWrite<T extends boolean | undefined> = T extends true
	? Uint8Array
	: string;
type WithBufferedRead<T extends boolean | undefined> = T extends true
	? Uint8Array
	: string;
type WithNullOnEOF<NullOnEOF extends boolean | undefined> = NullOnEOF extends
	false | undefined ? never : null;
/** Returns a python like input reader. Which uses stdin and stdout by default
 * @throws if NullOnEOF is set to true this will not throw on EOF but otherwise it will
 * @example
 * /////// DIFFERENT Readers and Writers
 * // read from stdin write to stdout
 * const input = inputReader();
 *
 * const input = inputReader(Deno);
 *
 * /////// DIFFERENT INPUTS AND OUTPUTS all the below commands can be used with different readers and writers
 * // read and write with a string
 * const input = inputReader();
 *
 * // Read from buffer
 * const stringInputAndUint8ArrOutput = inputReader(undefined, undefined, {
 * 	bufferedRead: true
 * });
 *
 * // write with buffer
 * const Uint8ArrInputAndStringOutput = inputReader(undefined, undefined, {
 * 	bufferedWrite: true
 * });
 *
 * // read and write with buffer
 * const Uint8ArrInputAndUint8ArrOutput = inputReader(undefined, undefined, {
 * 	bufferedWrite: true,
 * 	bufferedRead: true
 * });
 *
 * // instead of throwing an error return null on EOF
 * const stringInputAndStringOrNullOutput = inputReader(undefined, undefined, {
 * 	nullOnEOF: true
 * });
 *
 * // return null or buffered output
 * const stringInputAndUint8ArrOrNullOutput = inputReader(undefined, undefined, {
 * 	nullOnEOF: true,
 * 	bufferedRead: true
 * });
 */
export function inputReader<InputReadSettings extends InputReaderSettings>(
	/** The reader to read the lines from */
	reader?:
		| { readable: ReadableStream<Uint8Array> }
		| ReadableStream<Uint8Array>,
	/** The reader to write to */
	writer?:
		| { writable: WritableStream<Uint8Array> }
		| WritableStream<Uint8Array>,
	/**  */
	options?: InputReadSettings,
): (
	...writtenOutput: WithBufferedWrite<InputReadSettings["bufferedWrite"]>[]
) => Promise<
	| WithBufferedRead<InputReadSettings["bufferedRead"]>
	| WithNullOnEOF<InputReadSettings["nullOnEOF"]>
>;
export function inputReader(
	readable:
		| { readable: ReadableStream<Uint8Array> }
		| ReadableStream<Uint8Array>
		| undefined = Deno.stdin,
	writeable:
		| { writable: WritableStream<Uint8Array> }
		| WritableStream<Uint8Array>
		| undefined = Deno.stdout,
	options: InputReaderSettings | undefined = InputReaderDefaults,
) {
	const encoder = new TextEncoder();
	const decoder = new TextDecoder();

	/**
	 * Python like input reader. Returns an array containing at the first index
	 * the line read and at the second index a boolean indicating whether the eof
	 * has been reached.
	 */
	return async function input(
		...writtenOutput: (string | Uint8Array)[]
	): Promise<
		| WithBufferedRead<InputReaderSettings["bufferedRead"]>
		| WithNullOnEOF<InputReaderSettings["nullOnEOF"]>
	> {
		let value: undefined | string | Uint8Array = "",
			done: boolean | undefined = false;
		let writer: null | WritableStreamDefaultWriter<Uint8Array> = null;
		const reader: ReadableStreamDefaultReader<Uint8Array> =
			"getReader" in readable
				? readable?.getReader?.()
				: readable.readable.getReader?.();
		try {
			console.log("AA");
			if (writtenOutput.length > 0) {
				writer = "getWriter" in writeable
					? writeable?.getWriter?.()
					: writeable.writable.getWriter?.();
				for (const writeOutput of writtenOutput) {
					await (writer.write(
						options.bufferedWrite
							? writeOutput as Uint8Array
							: encoder.encode(writeOutput as string),
					));
				}
			}
			console.log("BB");
			const result = await bufferedLines(reader).next();
			value = (options.bufferedRead
				? result.value
				: decoder.decode(result.value) as string) ?? null;
			done = result.done;
			// console.log(value);
			if (options.nullOnEOF && done) {
				return null;
			} else if (done) {
				throw new Deno.errors.UnexpectedEof();
			}
			return value as
				| WithBufferedRead<InputReaderSettings["bufferedRead"]>
				| WithNullOnEOF<InputReaderSettings["nullOnEOF"]>;
		} finally {
			writer?.releaseLock?.();
			reader?.releaseLock?.();
		}
	};
}

/**
 * Takes a string to output to stdout and returns a string
 * that was given on stdin. Returns Deno.EOF when end of file is reached.
 * @throws When the EOF is reached this input reader will throw.
 */
export const input = inputReader(undefined, undefined, {
	bufferedRead: false,
	bufferedWrite: false,
	nullOnEOF: false,
});
/**
 * Like `input` but will output null on EOF instead of throwing an error.
 */
export const inputNullable = inputReader(undefined, undefined, {
	nullOnEOF: true,
});
