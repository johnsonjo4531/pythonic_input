import { bufferedLines } from "../mod.ts";

async function cat(filenames: string[]): Promise<void> {
	const newlinebytes = new TextEncoder().encode("\n");
	for (let filename of filenames) {
		const file = await Deno.open(filename, {read: true});
		try {
			const file_lines: Uint8Array[] = [];
			for await (const line of bufferedLines(file.readable)) {
				Deno.stdout.write(line)
			}
			
		} finally {
			file.close();
		}
	}
}
cat(Deno.args);
