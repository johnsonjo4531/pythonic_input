type Reader = Deno.Reader;
import { readDelim, readLines } from "https://deno.land/std@0.79.0/io/bufio.ts";

const newLine = new TextEncoder().encode('\n');
async function* linesBuffer(
	reader: Deno.Reader,
): AsyncIterableIterator<Uint8Array> { yield* readDelim(reader, newLine) };

/** Reads from a reader and yields each line as a str. */
const lines = readLines;

/** The settings for the input reader */
export type InputReaderSettings = {
	readonly bufferedRead?: boolean;
	readonly bufferedWrite?: boolean;
	/** If true it will return null on Eof instead of throwing an error. Good if you don't know the length of the input being read. */
	readonly nullOnEOF?: boolean;
}

const InputReaderDefaults = {
	bufferedIn: false,
	bufferedOut: false,
	nullOnEOF: false
} as const;

type WithBufferedWrite<T extends boolean | undefined> = false | undefined extends T ? string : Uint8Array;
type WithBufferedRead<T extends boolean | undefined> = false | undefined extends T ? string : Uint8Array;
type WithNullOnEOF<NullOnEOF extends boolean | undefined> = false | undefined extends NullOnEOF ? never : null;
/** Returns a python like input reader. Which uses stdin and stdout by default
 * @throws if NullOnEOF is set to true this will not throw on EOF but otherwise it will
 * @example
 * /////// DIFFERENT Readers and Writers 
 * // read from stdin write to stdout
 * const input = inputReader();
 * 
 * const input = inputReader(Deno);
 *
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
	reader?: Deno.Reader,
	/** The reader to write to */
	writer?: Deno.Writer,
	/**  */
	options?: InputReadSettings
): (...writtenOutput: WithBufferedWrite<InputReadSettings["bufferedWrite"]>[]) => Promise<WithBufferedRead<InputReadSettings["bufferedRead"]> | WithNullOnEOF<InputReadSettings["nullOnEOF"]>>
export function inputReader(): (...writtenOutput: string[]) => Promise<string>
export function inputReader(
	reader: Deno.Reader | undefined = Deno.stdin,
	writer: Deno.Writer | undefined = Deno.stdout,
	options: InputReaderSettings | undefined = InputReaderDefaults
) {
	const lineReader = (options.bufferedRead ? linesBuffer : lines)(reader);
	const encoder = new TextEncoder();
	/**
	 * Python like input reader. Returns an array containing at the first index
	 * the line read and at the second index a boolean indicating whether the eof
	 * has been reached.
	 */
	let value: undefined | string | Uint8Array = '', done: boolean | undefined = false;
	return async function input(...writtenOutput: (string | Uint8Array)[]) {
		for (const writeOutput of writtenOutput) {
			await (writer.write(options.bufferedWrite ? writeOutput as Uint8Array : encoder.encode(writeOutput as string)));
		}
		({ value, done } = await lineReader.next());
		// console.log(value);
		if (options.nullOnEOF && done) {
			return null as any;
		} else if (done) {
			throw new Deno.errors.UnexpectedEof();
		}
		return value;
	};
}

/**
 * Takes a string to output to stdout and returns a string
 * that was given on stdin. Returns Deno.EOF when end of file is reached.
 * @throws When the EOF is reached this input reader will throw.
 */
export const input = inputReader();
/**
 * Like `input` but will output null on EOF instead of throwing an error.
 */
export const inputNullable = inputReader(undefined, undefined, {
	nullOnEOF: true
});

