import { assertEquals } from "@std/assert";
import { EcmaDOM } from "../mod.js";
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
	const parser = new EcmaDOM.CSSParser();
	const minified = parser.minify(code);
	assertEquals(minified, expectedMinified);
});

// Parse Testing
test("parse", async () => {
	const code = `#test {background-color: red;}`;
	const structureMap = new Map();
	const structurePropertiesMap = new Map();
	structurePropertiesMap.set("background-color", "red");
	structureMap.set(
		"49f0d9fe041ed6b3db7facb6c93df4753eb3ebba583ced83c9daa0c12a6ddcd016f21cd68798082956ef40e6f72834ee4c0f9515c5a8f438def77b779c935f20",
		{
			selectors: {
				code: "#test",
				specifity: { id: 1, class: 0, type: 0 },
			},
			code: "background-color: red;",
			atRules: {},
			properties: structurePropertiesMap,
		},
	);

	const parser = new EcmaDOM.CSSParser();
	const parsedMap = await parser.parse(code);
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

	const parser = new EcmaDOM.CSSParser();
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

	const parser = new EcmaDOM.CSSParser();
	const parsedSelectorSpecifity = parser.calculateSelectorSpecifity(code);
	assertEquals(parsedSelectorSpecifity, selectorSpecifity);
});

// Sorting function
test("sort map", () => {
	const selectorSpecifitiesArray = [
		[
			"1",
			{
				selectors: {
					"specifity": {
						id: 0,
						class: 1,
						type: 1,
					},
				},
			},
		],
		[
			"2",
			{
				selectors: {
					"specifity": {
						id: 2,
						class: 0,
						type: 1,
					},
				},
			},
		],
		[
			"3",
			{
				selectors: {
					"specifity": {
						id: 0,
						class: 0,
						type: 2,
					},
				},
			},
		],
		[
			"4",
			{
				selectors: {
					"specifity": {
						id: 0,
						class: 0,
						type: 0,
					},
				},
			},
		],
	];

	const expectedSelectorSpecifitiesArray = new Map();
	expectedSelectorSpecifitiesArray.set("4", {
		"selectors": {
			"specifity": {
				id: 0,
				class: 0,
				type: 0,
			},
		},
	});
	expectedSelectorSpecifitiesArray.set("3", {
		"selectors": {
			"specifity": {
				id: 0,
				class: 0,
				type: 2,
			},
		},
	});
	expectedSelectorSpecifitiesArray.set("1", {
		"selectors": {
			"specifity": {
				id: 0,
				class: 1,
				type: 1,
			},
		},
	});
	expectedSelectorSpecifitiesArray.set("2", {
		"selectors": {
			"specifity": {
				id: 2,
				class: 0,
				type: 1,
			},
		},
	});

	const parser = new EcmaDOM.CSSParser();
	const parsedSelectorSpecifity = parser.sortMap(selectorSpecifitiesArray);
	const parsedArray = Array.from(parsedSelectorSpecifity);
	const expectedArray = Array.from(expectedSelectorSpecifitiesArray);
	assertEquals(parsedArray, expectedArray);
});

// Run test
test("run", async () => {
	const code = `
		#test {
			background-color: red;
		}
	`;

	const structureMap = new Map();
	const structurePropertiesMap = new Map();
	structurePropertiesMap.set("background-color", "red");
	structureMap.set(
		"49f0d9fe041ed6b3db7facb6c93df4753eb3ebba583ced83c9daa0c12a6ddcd016f21cd68798082956ef40e6f72834ee4c0f9515c5a8f438def77b779c935f20",
		{
			selectors: {
				code: "#test",
				specifity: { id: 1, class: 0, type: 0 },
			},
			properties: structurePropertiesMap,
			code: "background-color: red;",
			atRules: {},
		},
	);

	const parser = new EcmaDOM.CSSParser();
	const parsed = await parser.run(code);
	assertEquals(parsed, structureMap);
});
