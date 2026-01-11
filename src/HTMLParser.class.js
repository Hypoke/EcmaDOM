/**
 * A js parser for HTML and CSS.
 * @module
 */
import { DOMParser } from "@b-fuze/deno-dom";
import { CSSParser } from "./CSSParser.class.js";
import { CSSStyleDeclaration } from "./CSSStyleDeclaration.class.js";

const VAR_REGEX = /var\(([^\)]*)\)/g;

/**
 * The Parser Class.
 *
 * @example
 * ```js
 * import { EcmaDOM } from "./mod.ts";
 *
 * const parser = new EcmaDOM.HTMLParser(`
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
export class HTMLParser {
	/**
	 * @param {string} text The plain html text
	 */
	constructor(text) {
		this.text = text;

		this.document = new DOMParser().parseFromString(this.text, "text/html");
	}

	/**
	 * Apply a css to the html structure
	 * The function use the CSSParser class to parse the css and add an CSSStyleDeclaration to every html element
	 *
	 * @param {string} css The plain css text
	 */
	applyCSS(css) {
		const cssParser = new CSSParser();
		cssParser.run(css);
		for (const [selector, rule] of cssParser.map) {
			const elements = this.document.querySelectorAll(selector);
			for (const element of elements) {
				if (!element.style) {
					element.style = new Map();
				}
				element.style = new CSSStyleDeclaration(
					rule.properties,
					element.parentNode.style,
				);
			}
		}
	}

	/**
	 * Calculate the correct css values after applying them based on the html structure
	 *
	 * @param {NodeList} elements
	 * @param {Map} properies
	 */
	evaluateProperties(
		elements = this.document.querySelectorAll(":root"),
		properies = new Map(),
	) {
		for (const element of elements) {
			const elementProperties = new Map(properies);
			if (element.style) {
				for (const [propertyName, propertyValue] of element.style.properies) {
					// TODO: Internal reference to variable origin with an internal ID
					if (propertyName.match("--")) {
						elementProperties.set(propertyName, propertyValue);
					}
					if (propertyValue.match("var")) {
						const variables = propertyValue.matchAll(VAR_REGEX);

						for (const variable of variables) {
							if (elementProperties.has(variable[1])) {
								element.style.setProperty(
									propertyName,
									elementProperties.get(variable[1]),
								);
							}
						}
					}
				}
			}
			if (element.childNodes.length > 0) {
				this.evaluateProperties(element.childNodes, elementProperties);
			}
		}
	}
}
