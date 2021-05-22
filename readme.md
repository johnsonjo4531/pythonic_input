# pythonic_input

Main scripts is [mod.ts](./mod.ts).

## Table of Contents

- [pythonic_input](#pythonic_input)
	- [Table of Contents](#table-of-contents)
	- [What and Why](#what-and-why)
	- [input module](#input-module)
		- [Usage](#usage)
			- [`input`](#input)
			- [inputNullable](#inputnullable)
			- [`inputReader`](#inputreader)
		- [Examples](#examples)
			- [Input Program](#input-program)
		- [Examples](#examples-1)
			- [Cat Program using Input](#cat-program-using-input)

## What and Why

Input is a module that is inspired by pythons input method. It allows writing to a Writer (like stdout) and waiting for input separated by a newline by reading from a Reader (such as stdin).

## input module

### Usage

#### `input`

The `input` method allows you to prompt the user on stdout and wait for a line of input on stdin. Throws on End of File.

Default signature:

```ts
type input = async (output?: string) => Promise<string>
```

input example:

```ts
import { input } from "https://raw.githubusercontent.com/johnsonjo4531/pythonic_input/0.0.0/input.ts";

(async () => {
	console.log("-- DENO ADDER --");
	// will throw if it hits End of File...
	const num1 = await input("Enter a number: ");
	const num2 = await input("Enter another number: ");
	console.log(`${num1} + ${num2} = ${Number(num1) + Number(num2)}`);
})();
```

#### inputNullable

The `inputNullable` method allows you to prompt the user on stdout and wait for a line of input on stdin. Returns null on End of File.

Default signature:

```ts
type inputNullable = async (output?: string) => Promise<string | null>
```

inputNullable example:

```ts
import { inputNullable } from "https://raw.githubusercontent.com/johnsonjo4531/pythonic_input/0.0.0/input.ts";

(async () => {
	console.log("-- DENO ADDER --");
	// will throw if it hits End of File...
	const num1 = await inputNullable("Enter a number: ");
	const num2 = await inputNullable("Enter another number: ");
	console.log(`${num1} + ${num2} = ${Number(num1) + Number(num2)}`);
})();
```

#### `inputReader`

The `inputReader` method allows you to create an `input` or `inputNullable` method of your own with different different input and output files besides stdin and stdout.

inputReader example:

```ts
import { inputReader } from "https://raw.githubusercontent.com/johnsonjo4531/pythonic_input/0.0.0/input.ts";

// you could substitute Deno.stdin and Deno.stdout with any open file (with appropriate permissions)
// or with a Deno Reader and Writer.
const input = inputReader(Deno.stdin, Deno.stdout, {
	// optional options can go here
});

// the below produces the same output as the input example
(async () => {
	console.log("-- DENO ADDER --");
	// get the next line throws if it reaches the EOF
	const num1 = String(await input("Enter a number: "));
	const num2 = String(await input("Enter another number: "));
	console.log(`${num1} + ${num2} = ${Number(num1) + Number(num2)}`);
})();
```

### Examples

#### Input Program

An example using the input method is given in [`./examples/input.ts`](./examples/input.ts)

Try it out

```sh
$ deno https://raw.githubusercontent.com/johnsonjo4531/pythonic_input/0.0.0/examples/input.ts
```

Here's an example run of the program

```sh
$ deno https://raw.githubusercontent.com/johnsonjo4531/pythonic_input/0.0.0/examples/input.ts
-- DENO ADDER --
Enter a number: 2
Enter another number: 3
2 + 3 = 5
```

### Examples

#### Cat Program using Input

See the [`./examples/cat.ts`](./examples/cat.ts) for an example to run. You can compare this with the cat implementation on deno's examples in the std library.

This example:

```sh
$ time deno -A examples/cat.ts mobydick.txt
```

or if you didn't install it yet:

```sh
$ time deno -A https://raw.githubusercontent.com/johnsonjo4531/pythonic_input/0.0.0/examples/cat.ts mobydick.txt
```

Deno's cat example

```sh
$ time deno -A https://deno.land/std@v0.79.0/examples/cat.ts mobydick.txt
```

You can download the [mobydick.txt from project gutenberg](https://www.gutenberg.org/files/2701/2701-0.txt) or curl it (Mac/Linux) from there like so:

```sh
$ curl https://www.gutenberg.org/files/2701/2701-0.txt -o mobydick.txt
```
