/**
 * Accessibility testing class
 */
interface A11y {
	/**
	 * Run the test for a list of elements
	 * @param {Array} selectors
	 */
	test(selectors?: Array<object>): Promise<void>;

	/**
	 * Add all functions and objects to emulate a browser enviroment
	 * @param {NodeList} elements
	 */
	prepareElements(elements?: object): void;

	/**
	 * Calculate the width of an text for dynamic html / css width
	 * @param {string} text
	 * @param {string} fontName
	 * @param {string} fontType
	 * @param {number} fontSize
	 * @returns {number}
	 */
	getTextWidth(text: string, fontName: string, fontType?: string, fontSize?: number): Promise<number>;
}
/**
 * Parse plain css text in a Map structure, resolve nested structures and calculate specifity of each selector
 *
 * @todo Support AT
 */
interface CSSParser {
	/**
	 * @param {string} text Plain css text
	 * @returns {Map} Map with sorted selectors and properties
	 */
	run(text: string): Map<object, object>;

	/**
	 * @param {string} text Plain css text
	 * @returns {string} Unnested parsed blocks
	 */
	parseBlocks(text: string): string;

	/**
	 * Remove all unnecessary whitespaces and line breaks
	 * @param {string} text Blocked parsed css text
	 * @returns {string} Minified css text
	 */
	minify(text: string): string;

	/**
	 * @param {string} text The minified css text
	 * @returns {Map} The final Map
	 */
	parse(text: string): Map<object, object>;

	/**
	 * Sort a map by the specifity values of "id", "class" and "type"
	 * @param {Map} map unsorted map
	 * @returns {Map} sorted map
	 */
	sortMap(map: Map<object, object>): Map<object, object>;

	/**
	 * Spit a CSS code block with properies
	 * @param {string} properties Single CSS block with properties
	 * @returns {Map} Map with all clean CSS properties, values from the block input
	 */
	splitProperties(properties: string): Map<object, object>;

	/**
	 * Split a list with selectory (by ,) and calculate the specifity for each one
	 * @param {string} selectors
	 * @returns {Array}
	 */
	splitSelector(selectors: string): Array<object>;

	/**
	 * @param {string} selector A single css selector group
	 * @returns {JSON} With calculated id, class and type specifity value
	 */
	calculateSelectorSpecifity(selector: string): JSON;
}
/**
 * Represent the CSS style of an single html element
 * Implementation based on @link https://drafts.csswg.org/cssom/#the-cssstyledeclaration-interface
 */
interface CSSStyleDeclaration {
	/**
	 * @param {string} property Name of the property
	 * @returns {string}
	 */
	getPropertyValue(property: string): string;

	/**
	 * @param {string} property Name of the property
	 * @returns {("important"|"")}
	 */
	getPropertyPriority(property: string): string;

	/**
	 * @param {string} property Name of the property
	 * @param {(string|number)} value Value of the property
	 * @param {string} _priority
	 * @returns {boolean}
	 */
	setProperty(property: string, value: string | number, _priority?: string): boolean;

	/**
	 * @param {string} property Name of the property
	 * @returns {boolean}
	 */
	removeProperty(property: string): boolean;

	compute(): void;

	/**
	 * Get the default values for all css properties that are not set by the user and set a default value
	 * Also replace inherit values with the value of the parent css style declaration
	 */
	addInitialValues(): void;

	/**
	 * Calculate all units based on width, height, screen and parent sizes
	 * @param {json} screen
	 */
	parseUnits(screen?: JSON): void;
}
/**
 * The Parser Class.
 *
 * @example
 * ```js
 * import { HTMLParser } from "./mod.ts";
 *
 * const parser = new HTMLParser(`
 * <html>
 * 	<body>
 * 		<main id="test">
 * 			<p id="test2">Hello</p>
 * 		</main>
 * 		<footer>
 * 			<test-component></test-component>
 * 		</footer>
 * 	</body>
 * </html>
 * `);

 * parser.applyCSS(`
 * 	:root {
 * 		--color: yellow;
 * 		--bg: yellow;
 * 	}
 *
 * 	test-component, p {
 * 		width: 200px;
 * 	}
 *
 * 	body > #test {
 * 		--height: 100px;
 * 		width: 100px;
 * 		height: var(--height);
 * 	}
 *
 * 	#test #test2 {
 * 		background: green;
 * 		color: red;
 * 	}
 *
 * 	#test {
 * 		#test2 {
 * 			color: var(--color);
 * 			background: var(--bg);
 * 			font: 100%;
 * 		}
 * 	}
 * `);
 *
 * parser.evaluateProperties();
 *
 * console.log(parser.document.querySelector("#test2").style.getPropertyValue("background"));
 * ```
 */
interface HTMLParser {
	/**
	 * Apply a css to the html structure
	 * The function use the CSSParser class to parse the css and add an CSSStyleDeclaration to every html element
	 *
	 * @param {string} css The plain css text
	 */
	applyCSS(css: string): void;

	/**
	 * Calculate the correct css values after applying them based on the html structure
	 *
	 * @param {NodeList} elements
	 * @param {Map} properies
	 */
	evaluateProperties(elements?: object, properies?: Map<object, object>): void;
}
