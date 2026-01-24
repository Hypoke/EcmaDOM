/**
 * The CSSParser implementation
 * @module
 */
const _OBJ_REGEX = /([^{]*){([^}]*)}/g;
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
	 * @returns {Promise<Map>} Map with sorted selectors and properties
	 */
	async run(text) {
		this.text = text;
		this.map = await this.parse(text);
		return this.map;
	}

	/**
	 * @param {string} text Plain css text
	 * @returns {Promise<Map>} Final parsed map
	 */
	async parse(text) {
		const positions = this.parsePositionsFromText(text);
		const blocks = await this.parsePositionsToBlockMap(text, positions);
		const extendedBlocks = this.calculateBlockSpecifity(blocks);
		const sortedBlocks = this.sortMap(extendedBlocks);
		return sortedBlocks;
	}

	/**
	 * @param {string} text
	 * @returns {Array}
	 */
	parsePositionsFromText(text) {
		const positions = [];
		let count = 0;
		let symbolCount = 0;
		let cachePositions = [];
		const atQuery = {};
		let atPosition = 0;
		let atIs = false;

		for (const symbol of text) {
			symbolCount++;
			if (symbol === "@") {
				atIs = true;
				atPosition = symbolCount - 1;
			}
			if (symbol === "{") {
				cachePositions[count] = {};
				if (atIs) {
					const atType = text.substring(atPosition, symbolCount - 1).match(/\@[^ ]+/g);
					if (!atQuery[atType]) {
						atQuery[atType] = [];
					}
					atQuery[atType].push(this.minify(text.substring(atPosition, symbolCount - 1).replaceAll(/\@[^ ]+/g, "")));
					cachePositions[count].isAt = true;
					cachePositions[count].atType = atType;
					atIs = false;
				}
				cachePositions[count].start = symbolCount;
				cachePositions[count].atQuery = JSON.parse(JSON.stringify(atQuery));
				count++;
			}
			if (symbol === "}") {
				count--;
				if (cachePositions[count]) {
					cachePositions[count].end = symbolCount - 1;
					if (cachePositions[count].isAt) {
						atQuery[cachePositions[count].atType].pop();
					}
				}
				if (count === 0) {
					positions.push(cachePositions);
					cachePositions = [];
				}
			}
		}
		return positions;
	}

	/**
	 * @param {string} text
	 * @param {Array} positions
	 * @returns {Promise<Map>}
	 */
	async parsePositionsToBlockMap(text, positions) {
		let baseNames = [];
		let lastPos = 0;
		let endPos = 0;
		const blocks = new Map();
		// We remove nested statements by calculating new "selectors" like described in https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/Nesting_selector
		// After that we replace the old code with the new generated code
		for (const positionList of positions) {
			// Get the first Element
			for (let i = 0; i < positionList.length; i++) {
				const position = positionList[i];
				if (positionList.length > i) {
					const nextPosition = positionList[i + 1];
					let splitBaseName = text.substring(lastPos, position.start).split(";");
					if (position.isAt) {
						splitBaseName = baseNames[baseNames.length - 1] ? ["&"] : [""];
					}

					// Extract code
					let endCodePosition = position.end;
					if (nextPosition) {
						endCodePosition = nextPosition.start;
					}
					const codeArray = text.substring(position.start, endCodePosition).split(";");
					codeArray.pop();
					let code = codeArray.join(";");
					if (code !== "") {
						code = code + ";";
					}

					lastPos = position.start;
					if (i === 0) {
						endPos = position.end + 1;
					}

					let newBaseName = this.minify(splitBaseName[splitBaseName.length - 1].replaceAll(
						"{",
						"",
					));
					let removeLast = false;
					if (newBaseName.match("&")) {
						removeLast = true;
					}
					newBaseName = newBaseName.replaceAll(
						"&",
						baseNames[baseNames.length - 1] ? baseNames[baseNames.length - 1] : ":root",
					);
					if (removeLast) {
						baseNames.pop();
					}

					// TODO: Split selectors by , and split the entire codebase into single functions
					if (newBaseName !== "") {
						baseNames.push(newBaseName);
					}
					const joinedBaseName = baseNames.join(" ");
					for (const atType in position.atQuery) {
						if (position.atQuery[atType].length === 0) {
							delete (position.atQuery[atType]);
							continue;
						}

						const cacheAtQueryArray = [];
						for (const atElement of position.atQuery[atType]) {
							const splitAtElements = atElement.split("and");
							for (const splitAtElement of splitAtElements) {
								cacheAtQueryArray.push(this.minify(splitAtElement));
							}
						}
						position.atQuery[atType] = cacheAtQueryArray.sort();
					}

					const hashedName = await this.hash(joinedBaseName + JSON.stringify(position.atQuery));
					const data = {
						selectors: joinedBaseName,
						atRules: position.atQuery,
					};
					if (blocks.has(hashedName)) {
						const cacheData = blocks.get(hashedName);
						if (cacheData.code) {
							code = cacheData.code + code;
						}
					}
					if (code !== "") {
						code = this.minify(code);
						data.code = code;
						blocks.set(hashedName, data);
					}
				}
			}
			lastPos = endPos;
			baseNames = [];
		}
		return blocks;
	}

	/**
	 * @param {Map} blocks
	 * @returns {Map}
	 */
	calculateBlockSpecifity(blocks) {
		for (const [hash, block] of blocks) {
			block.selectors = {
				code: block.selectors,
				specifity: this.calculateSelectorSpecifity(block.selectors),
			};
			block.properties = this.splitProperties(block.code);
			blocks.set(hash, block);
		}
		return blocks;
	}

	/**
	 * Remove all unnecessary whitespaces and line breaks
	 * @param {string} text Blocked parsed css text
	 * @returns {string} Minified css text
	 */
	minify(text) {
		text = text.replaceAll(SPACE_REGEX, "");
		text = text.replaceAll(SPACE_REGEX_END, "");
		text = text.replaceAll("\n", "");
		return text;
	}

	/**
	 * Sort a map by the specifity values of "id", "class" and "type"
	 * @param {Map} map unsorted map
	 * @returns {Map} sorted map
	 */
	sortMap(map) {
		const sorted = Array.from(map).sort((a, b) => {
			const specA = a[1].selectors.specifity;
			const specB = b[1].selectors.specifity;
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

	/**
	 * @param {string} text
	 * @returns {Promise<string>} SHA-512 hashed string
	 */
	async hash(text) {
		const encoder = new TextEncoder();
		const data = encoder.encode(text);
		const hash = await crypto.subtle.digest("SHA-512", data);
		const hashHex = new Uint8Array(hash).toHex();
		return hashHex;
	}
}
