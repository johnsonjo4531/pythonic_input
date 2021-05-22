import { readDelim, readLines } from "https://deno.land/std@0.79.0/io/bufio.ts";

async function* linesBuffer(
	reader: Deno.Reader,
): AsyncIterableIterator<Uint8Array> { yield* readDelim(reader, new TextEncoder().encode('\n')) };

async function cat(filenames: string[]): Promise<void> {
	const newlinebytes = new TextEncoder().encode("\n");
	for (let filename of filenames) {
		const file = await Deno.open(filename);
		const buffer = new Deno.Buffer();
		try {
			const file_lines: Uint8Array[] = [];
			for await (const line of linesBuffer(file)) {
				// you could transform the line buffers here
				buffer.write(line);
				buffer.write(newlinebytes);
			}
			Deno.copy(buffer, Deno.stdout);
		} finally {
			file.close();
		}
	}
}
cat(Deno.args);
