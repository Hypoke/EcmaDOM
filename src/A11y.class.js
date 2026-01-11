/**
 * The A11y implementation
 * @module
 */
import { Document, Element, NamedNodeMap, Node, NodeList, NodeType } from "@b-fuze/deno-dom";
import { CSSStyleDeclaration } from "./CSSStyleDeclaration.class.js";
import { SPACE_REGEX, SPACE_REGEX_END } from "./CSSParser.class.js";
import { default as opentype } from "opentype.js";
/**
 * Accessibility testing class
 */
export class A11y {
	/**
	 * @param {Document} document
	 */
	constructor(document) {
		this.document = document;
		this.prepareElements();

		const createDocument = this.document.createElement;
		this.document.createElement = (tagName, options) => {
			const element = createDocument(tagName, options);
			element.style = new CSSStyleDeclaration();
			element.hasAttributes = () => {
				return false;
			};
			return element;
		};
		this.document.styleSheets = [];

		globalThis.document = this.document;
		globalThis.window = globalThis;
		window.Node = Node;
		window.NodeList = NodeList;
		window.NamedNodeMap = NamedNodeMap;
		window.Element = Element;
		window.Document = Document;
		window.screen = {
			orientation: {
				type: "landscape-primary",
				angle: "0",
			},
		};
		window.getComputedStyle = (element) => {
			return element.style;
		};

		window.innerWidth = 100;
		window.innerHeight = 100;
	}

	/**
	 * Run the test for a list of elements
	 * @param {Array} selectors
	 */
	async test(selectors = []) {
		if (!this.axe) {
			this.axe = (await import("axe-core")).default;
			this.axe.setup(this.document);
		}
		this.axe.run(selectors, (err, results) => {
			console.log(err);
			console.log(results.incomplete);
		});
	}

	/**
	 * Add all functions and objects to emulate a browser enviroment
	 * @param {NodeList} elements
	 */
	prepareElements(elements = this.document.querySelectorAll("*")) {
		for (const element of elements) {
			// Pimp elements for axe
			element.hasAttributes = () => {
				return false;
			};

			if (element.childNodes.length > 0) {
				this.prepareElements(element.childNodes);
			}

			if (!element.style) {
				element.style = new CSSStyleDeclaration(
					new Map(),
					element.parentNode.style,
				);
			}

			element.getBoundingClientRect = () => {
				const x = 0;
				const y = 0;
				let width = 100;
				let height = 100;

				let cacheWidth = 0;
				let cacheHeight = 0;
				for (const children of element.childNodes) {
					const childBoundingRect = children.getBoundingClientRect();
					cacheWidth = cacheWidth + childBoundingRect.width;
					cacheHeight = cacheHeight + childBoundingRect.height;
				}

				if (element.nodeType === NodeType.TEXT_NODE) {
					const _fontSize = parseInt(
						element.style.getPropertyValue("font-size").replace("px", ""),
					);
					const _lineHeight = parseInt(
						element.style.getPropertyValue("line-height").replace("px", ""),
					);
					const _text = element.textContent.replaceAll(/ +/g, " ").replaceAll(
						/\n+/g,
						" ",
					).replaceAll(SPACE_REGEX, "").replaceAll(SPACE_REGEX_END, "");
				}

				//width = width + parseInt(element.style.getPropertyValue("width").replace("px", ""));
				width = width +
					parseInt(
						element.style.getPropertyValue("padding-left").replace("px", ""),
					);
				width = width +
					parseInt(
						element.style.getPropertyValue("padding-right").replace("px", ""),
					);

				//height = height + parseInt(element.style.getPropertyValue("height").replace("px", ""));
				height = height +
					parseInt(
						element.style.getPropertyValue("padding-top").replace("px", ""),
					);
				height = height +
					parseInt(
						element.style.getPropertyValue("padding-bottom").replace("px", ""),
					);

				return {
					x: x,
					y: y,
					width: width,
					height: height,
					top: y + height,
					right: x + width,
					bottom: y + height,
					left: x + width,
				};
			};
		}
	}

	/**
	 * Calculate the width of an text for dynamic html / css width
	 * @param {string} text
	 * @param {string} fontName
	 * @param {string} fontType
	 * @param {number} fontSize
	 * @returns {number}
	 */
	async getTextWidth(text, fontName, fontType = "", fontSize = 16) {
		const font = await opentype.load(
			`./assets/fonts/${fontName}/${fontName}_${fontType}.tff`,
		);
		const { x1, x2 } = font.getPath(text, 0, 0, fontSize).getBoundingBox();
		return x2 - x1;
	}
}
