/**
 * An CSSStyleDeclaration implementation
 * Based on @link https://drafts.csswg.org/cssom/#the-cssstyledeclaration-interface
 * @module
 */
import CSSDefaultValues from "../assets/settings/CSSDefaultValues.json" with {
	type: "json",
};
import CSSUnits from "../assets/settings/CSSUnits.json" with { type: "json" };
const DEFAULT_SIZES_EM = 16;

/**
 * Represent the CSS style of an single html element
 * Implementation based on @link https://drafts.csswg.org/cssom/#the-cssstyledeclaration-interface
 */
export class CSSStyleDeclaration {
	/**
	 * @param {Map} properies
	 * @param {CSSStyleDeclaration} parentStyle
	 */
	constructor(properies = new Map(), parentStyle = this) {
		this.properies = properies;
		this.computed = new Map(properies);
		this.parentStyle = parentStyle;
		this.compute();
		this.cssText = "";
	}

	/**
	 * @param {string} property Name of the property
	 * @returns {string}
	 */
	getPropertyValue(property) {
		return this.computed.get(property);
	}

	/**
	 * @param {string} property Name of the property
	 * @returns {("important"|"")}
	 */
	getPropertyPriority(property) {
		if (this.computed.has(property)) {
			if (this.computed.get(property).match("!important")) {
				return "important";
			}
		}
		return "";
	}

	/**
	 * @param {string} property Name of the property
	 * @param {(string|number)} value Value of the property
	 * @param {string} _priority
	 * @returns
	 */
	setProperty(property, value, _priority = "") {
		if (this.computed.set(property, value) instanceof Map) {
			return true;
		}
		return false;
	}

	/**
	 * @param {string} property Name of the property
	 * @returns
	 */
	removeProperty(property) {
		return this.computed.delete(property);
	}

	compute() {
		this.addInitialValues();
		this.parseUnits();
	}

	/**
	 * Get the default values for all css properties that are not set by the user and set a default value
	 * Also replace inherit values with the value of the parent css style declaration
	 */
	addInitialValues() {
		let defaultColor = CSSDefaultValues["color"].initial;
		if (this.computed.has("color")) {
			defaultColor = this.computed.get("color");
		}

		for (const propertyName in CSSDefaultValues) {
			const propertySettings = CSSDefaultValues[propertyName];
			if (!this.computed.has(propertyName)) {
				let value = propertySettings.initial;
				if (value === "The current color of the element") {
					value = defaultColor;
				}
				this.computed.set(propertyName, value);
			}

			const propertyValue = this.computed.get(propertyName);
			if (propertyValue === "inherit") {
				this.computed.set(
					propertyName,
					this.parentStyle.getPropertyValue(propertyName),
				);
			}
		}
	}

	/**
	 * Calculate all units based on width, height, screen and parent sizes
	 * @param {json} screen
	 */
	parseUnits(screen = { width: 100, height: 100 }) {
		// https://drafts.csswg.org/css-fonts/#absolute-size-mapping
		for (let [propertyName, property] of this.computed) {
			for (const emReplacement in CSSUnits.em) {
				property = property.replaceAll(
					new RegExp(emReplacement, "gm"),
					`${(DEFAULT_SIZES_EM * CSSUnits.em[emReplacement])}px`,
				);
			}

			property = property.replaceAll(/([0-9]+)em/gm, (_a, b) => {
				return `${b * DEFAULT_SIZES_EM}px`;
			});

			property = property.replaceAll(/([0-9]+)rem/gm, (_a, b) => {
				return `${b * DEFAULT_SIZES_EM}px`;
			});

			property = property.replaceAll(/([0-9]+)vw/gm, (_a, b) => {
				return `${b * screen.width}px`;
			});

			property = property.replaceAll(/([0-9]+)vh/gm, (_a, b) => {
				return `${b * screen.height}px`;
			});

			property = property.replaceAll(/([0-9]+)\%/gm, (_a, b) => {
				return `${b * this.parentStyle.getPropertyValue(propertyName)}px`;
			});
			this.computed.set(propertyName, property);
		}
	}
}
