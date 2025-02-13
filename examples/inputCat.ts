import { inputReader } from "../mod.ts";

async function cat(filenames: string[]): Promise<void> {
	const newlinebytes = new TextEncoder().encode("\n");
	for (let filename of filenames) {
		const file = await Deno.open(filename);
		const input = inputReader(file, undefined, {
			nullOnEOF: true,
			// these are for added speed... at expense of convenience
			bufferedRead: true,
			bufferedWrite: true
		});
		const newLine = new TextEncoder().encode("\n")
		// const decoder = new TextDecoder();
		try {
			let line = await input();
			while (line !== null) {
				line = await input(line, newLine);
			}
		} finally {
			file.close();
		}
	}
}
await cat(
	Deno.args
);
