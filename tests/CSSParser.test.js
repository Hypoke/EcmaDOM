import { assertEquals } from "@std/assert";
import { CSSParser } from "../mod.js";
import MapRuntime from "./MapRuntime.js";
MapRuntime();

// Minify testing
test("minify", () => {
	const code = `
		#test {
			background-color: red;
		}
	`;
	const expectedMinified = `#test {background-color: red;}`;
	const parser = new CSSParser();
	const minified = parser.minify(code);
	assertEquals(minified, expectedMinified);
});

// Unnested Testing
test("remove nested structure", () => {
	const code = `#test {#test1 {background-color: red;}}`;
	const expectedMinified = `#test #test1 {background-color: red;}`;

	const parser = new CSSParser();
	const unnested = parser.parseBlocks(code);
	const minified = parser.minify(unnested);
	assertEquals(minified, expectedMinified);
});

test("replace & symbol after selector structure", () => {
	const code = `#test {#test1 & {background-color: red;}}`;
	const expectedMinified = `#test1 #test {background-color: red;}`;

	const parser = new CSSParser();
	const unnested = parser.parseBlocks(code);
	const minified = parser.minify(unnested);
	assertEquals(minified, expectedMinified);
});

test("replace & symbol before selector structure", () => {
	const code = `#test {&#test1 {background-color: red;}}`;
	const expectedMinified = `#test#test1 {background-color: red;}`;

	const parser = new CSSParser();
	const unnested = parser.parseBlocks(code);
	const minified = parser.minify(unnested);
	assertEquals(minified, expectedMinified);
});

// Parse Testing
test("parse", () => {
	const code = `#test {background-color: red;}`;
	const structureMap = new Map();
	const structurePropertiesMap = new Map();
	structurePropertiesMap.set("background-color", "red");
	structureMap.set("#test", {
		name: "#test",
		specifity: { id: 1, class: 0, type: 0 },
		attributes: "",
		properties: structurePropertiesMap,
	});

	const parser = new CSSParser();
	const parsedMap = parser.parse(code);
	assertEquals(parsedMap, structureMap);
});

// Selector Specifity
test("selector specifity", () => {
	const code = `#test .test test`;
	const selectorSpecifity = {
		id: 1,
		class: 1,
		type: 1,
	};

	const parser = new CSSParser();
	const parsedSelectorSpecifity = parser.calculateSelectorSpecifity(code);
	assertEquals(parsedSelectorSpecifity, selectorSpecifity);
});

test("none selector specifity", () => {
	const code = ``;
	const selectorSpecifity = {
		id: 0,
		class: 0,
		type: 0,
	};

	const parser = new CSSParser();
	const parsedSelectorSpecifity = parser.calculateSelectorSpecifity(code);
	assertEquals(parsedSelectorSpecifity, selectorSpecifity);
});

// Sorting function
test("sort map", () => {
	const selectorSpecifitiesArray = [
		[
			"#test",
			{
				"specifity": {
					id: 0,
					class: 1,
					type: 1,
				},
			},
		],
		[
			"#test1",
			{
				"specifity": {
					id: 0,
					class: 0,
					type: 0,
				},
			},
		],
		[
			"#test2",
			{
				"specifity": {
					id: 1,
					class: 0,
					type: 0,
				},
			},
		],
		[
			"#test3",
			{
				"specifity": {
					id: 0,
					class: 0,
					type: 0,
				},
			},
		],
	];

	const expectedSelectorSpecifitiesArray = new Map();
	expectedSelectorSpecifitiesArray.set("#test2", {
		"specifity": {
			id: 1,
			class: 0,
			type: 0,
		},
	});

	expectedSelectorSpecifitiesArray.set("#test", {
		"specifity": {
			id: 0,
			class: 1,
			type: 1,
		},
	});
	expectedSelectorSpecifitiesArray.set("#test1", {
		"specifity": {
			id: 0,
			class: 0,
			type: 0,
		},
	});
	expectedSelectorSpecifitiesArray.set("#test3", {
		"specifity": {
			id: 0,
			class: 0,
			type: 0,
		},
	});

	const parser = new CSSParser();
	const parsedSelectorSpecifity = parser.sortMap(selectorSpecifitiesArray);
	assertEquals(parsedSelectorSpecifity, expectedSelectorSpecifitiesArray);
});

// Run test
test("run", () => {
	const code = `
		#test {
			background-color: red;
		}
	`;

	const structureMap = new Map();
	const structurePropertiesMap = new Map();
	structurePropertiesMap.set("background-color", "red");
	structureMap.set("#test", {
		name: "#test",
		specifity: { id: 1, class: 0, type: 0 },
		attributes: "",
		properties: structurePropertiesMap,
	});

	const parser = new CSSParser();
	const parsed = parser.run(code);
	assertEquals(parsed, structureMap);
});
