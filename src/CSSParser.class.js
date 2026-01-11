/**
 * The CSSParser implementation
 * @module
 */
const OBJ_REGEX = /([^{]*){([^}]*)}/g;
const _TOKEN_REGEX = /([^:]*): ([^;]*);/g;
const _AT_REGEX = /@.+ (.*)/g;
/**
 * @ignore
 */
export const SPACE_REGEX = /^[ \t]*/gm;
/**
 * @ignore
 */
export const SPACE_REGEX_END = /[ \t]*$/gm;

const SPECIFITY_REGEX = {
	ID: /#/g,
	CLASS: /\.|[[^\]]|[^:]:[a-z]/g,
	TYPE: /(^|\+|\>|\~| |\|\|)[a-zA-Z]|::[a-z]/g,
};

/**
 * Parse plain css text in a Map structure, resolve nested structures and calculate specifity of each selector
 *
 * @todo Support AT
 */
export class CSSParser {
	constructor() {
		this.root = {};
	}

	/**
	 * @param {string} text Plain css text
	 * @returns {Map} Map with sorted selectors and properties
	 */
	run(text) {
		this.text = this.parseBlocks(text);
		this.text = this.minify(this.text);
		this.map = this.parse(this.text);
		return this.map;
	}

	/**
	 * @param {string} text Plain css text
	 * @returns {string} Unnested parsed blocks
	 */
	parseBlocks(text) {
		const positions = [];
		let count = 0;
		let symbolCount = 0;
		let cachePositions = [];

		for (const symbol of text) {
			symbolCount++;
			if (symbol === "{") {
				cachePositions[count] = {};
				cachePositions[count].start = symbolCount;
				count++;
			}
			if (symbol === "}") {
				count--;
				if (cachePositions[count]) {
					cachePositions[count].end = symbolCount - 1;
				}
				if (count === 0) {
					positions.push(cachePositions);
					cachePositions = [];
				}
			}
		}

		let baseNames = [];
		let lastPos = 0;
		let endPos = 0;
		const newCode = new Map();
		// We remove nested statements by calculating new "selectors" like described in https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/Nesting_selector
		// After that we replace the old code with the new generated code
		for (const positionList of positions) {
			// Get the first Element
			for (let i = 0; i < positionList.length; i++) {
				const position = positionList[i];
				if (positionList.length > i) {
					const nextPosition = positionList[i + 1];
					const splitBaseName = text.substring(lastPos, position.start)
						.split(";");

					// Extract code
					let endCodePosition = position.end;
					if (nextPosition) {
						endCodePosition = nextPosition.start;
					}
					const codeArray = text.substring(position.start, endCodePosition)
						.split(";");
					codeArray.pop();
					let code = codeArray.join(";");
					if (code !== "") {
						code = code + ";";
					}

					lastPos = position.start;
					if (i === 0) {
						endPos = position.end + 1;
					}

					let newBaseName = splitBaseName[splitBaseName.length - 1].replaceAll(
						"{",
						"",
					).replaceAll("\n", "").replaceAll(SPACE_REGEX, "").replaceAll(
						SPACE_REGEX_END,
						"",
					);
					let removeLast = false;
					if (newBaseName.match("&")) {
						removeLast = true;
					}
					newBaseName = newBaseName.replaceAll(
						"&",
						baseNames[baseNames.length - 1],
					);
					if (removeLast) {
						baseNames.pop();
					}
					baseNames.push(newBaseName);
					const joinedBaseName = baseNames.join(" ");
					if (newCode.has(joinedBaseName)) {
						code = newCode.get(joinedBaseName) + code;
					}
					if (code !== "") {
						newCode.set(joinedBaseName, code);
					}
				}
			}
			lastPos = endPos;
			baseNames = [];
		}

		let parsed = "";
		for (const [selector, code] of newCode) {
			parsed = `
${parsed}
${selector} {
	${code}
}`;
		}

		return parsed;
	}

	/**
	 * Remove all unnecessary whitespaces and line breaks
	 * @param {string} text Blocked parsed css text
	 * @returns {string} Minified css text
	 */
	minify(text) {
		text = text.replaceAll(SPACE_REGEX, "");
		text = text.replaceAll("\n", "");
		return text;
	}

	/**
	 * @param {string} text The minified css text
	 * @returns {Map} The final Map
	 */
	parse(text) {
		const matchBlocks = text.matchAll(OBJ_REGEX);
		const blockMaps = new Map();
		for (const block of matchBlocks) {
			const selectors = this.splitSelector(block[1]);
			const properties = this.splitProperties(block[2]);

			for (const selector of selectors) {
				const spaceFreeSelector = selector.selector.replaceAll(SPACE_REGEX, "").replaceAll(SPACE_REGEX_END, "");
				const blockMap = blockMaps.has(spaceFreeSelector) ? blockMaps.get(spaceFreeSelector) : {
					name: spaceFreeSelector,
					specifity: selector.specifity,
					attributes: selector.attributes,
					properties: new Map(),
				};
				blockMap.properties = new Map([...blockMap.properties, ...properties]);
				blockMaps.set(spaceFreeSelector, blockMap);
			}
		}
		return this.sortMap(blockMaps);
	}

	/**
	 * Sort a map by the specifity values of "id", "class" and "type"
	 * @param {Map} map unsorted map
	 * @returns {Map} sorted map
	 */
	sortMap(map) {
		const sorted = Array.from(map).sort((a, b) => {
			const specA = a[1].specifity;
			const specB = b[1].specifity;
			if (specA.id > specB.id) {
				return 1;
			} else if (specA.id < specB.id) {
				return -1;
			}

			if (specA.class > specB.class) {
				return 1;
			} else if (specA.class < specB.class) {
				return -1;
			}

			if (specA.type > specB.type) {
				return 1;
			} else if (specA.type < specB.type) {
				return -1;
			}

			return 0;
		});

		return new Map(sorted);
	}

	/**
	 * Spit a CSS code block with properies
	 * @param {string} properties Single CSS block with properties
	 * @returns {Map} Map with all clean CSS properties, values from the block input
	 */
	splitProperties(properties) {
		const propertiesArray = properties.split(";");
		const propertiesData = new Map();
		for (const property of propertiesArray) {
			if (property === "") {
				continue;
			}
			const splitProperty = property.split(":", 2);
			if (splitProperty.length === 2) {
				propertiesData.set(
					splitProperty[0],
					splitProperty[1].replaceAll(SPACE_REGEX, "").replaceAll(
						SPACE_REGEX_END,
						"",
					),
				);
			}
		}
		return propertiesData;
	}

	/**
	 * Split a list with selectory (by ,) and calculate the specifity for each one
	 * @param {string} selectors
	 * @returns {Array}
	 */
	splitSelector(selectors) {
		const selectorsArray = selectors.split(",");
		const selectorsData = [];
		for (let selector of selectorsArray) {
			const attributes = "";
			selector = selector.replaceAll(SPACE_REGEX, "");
			if (selector.match("@")) {
				continue;
				//attributes = selector.substring(selector.indexOf(" ") + 1);
				//selector = selector.substring(0, selector.indexOf(" "));
			}

			selectorsData.push({
				selector: selector,
				specifity: this.calculateSelectorSpecifity(selector),
				attributes: attributes,
			});
		}
		return selectorsData;
	}

	/**
	 * @param {string} selector A single css selector group
	 * @returns {JSON} With calculated id, class and type specifity value
	 */
	calculateSelectorSpecifity(selector) {
		const idMatch = selector.match(SPECIFITY_REGEX.ID);
		const classMatch = selector.match(SPECIFITY_REGEX.CLASS);
		const typeMatch = selector.match(SPECIFITY_REGEX.TYPE);
		return {
			id: idMatch ? idMatch.length : 0,
			class: classMatch ? classMatch.length : 0,
			type: typeMatch ? typeMatch.length : 0,
		};
	}
}
