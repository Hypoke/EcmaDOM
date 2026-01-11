export default function () {
	if (globalThis.Deno) {
		console.log("Detect runtime 'deno'");
		globalThis.test = Deno.test;
	}

	if (globalThis.Bun) {
		console.log("Detect runtime 'bun'");
	}
}
