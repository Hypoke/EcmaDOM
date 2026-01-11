import { assertEquals } from "@std/assert";
import { EcmaDOM } from "../mod.js";
import MapRuntime from "./MapRuntime.js";
MapRuntime();

// Test get property
test("get property", () => {
	const structurePropertiesMap = new Map();
	structurePropertiesMap.set("background-color", "red");

	const cssStyle = new EcmaDOM.CSSStyleDeclaration(structurePropertiesMap);
	assertEquals(cssStyle.getPropertyValue("background-color"), "red");
});

// Test property priority
test("get property priority", () => {
	const structurePropertiesMap = new Map();
	structurePropertiesMap.set("background-color", "red");

	const cssStyle = new EcmaDOM.CSSStyleDeclaration(structurePropertiesMap);
	assertEquals(cssStyle.getPropertyPriority("background-color"), "");
});

test("get property priority important", () => {
	const structurePropertiesMap = new Map();
	structurePropertiesMap.set("background-color", "red !important");

	const cssStyle = new EcmaDOM.CSSStyleDeclaration(structurePropertiesMap);
	assertEquals(cssStyle.getPropertyPriority("background-color"), "important");
});

// Test delete property
test("delete property", () => {
	const structurePropertiesMap = new Map();
	structurePropertiesMap.set("background-color", "red");

	const cssStyle = new EcmaDOM.CSSStyleDeclaration(structurePropertiesMap);
	assertEquals(cssStyle.removeProperty("background-color"), true);
});

test("delete not existing property", () => {
	const structurePropertiesMap = new Map();

	const cssStyle = new EcmaDOM.CSSStyleDeclaration(structurePropertiesMap);
	assertEquals(cssStyle.removeProperty("not-existing"), false);
});

// Test set property
test("set property", () => {
	const structurePropertiesMap = new Map();
	structurePropertiesMap.set("background-color", "red");

	const cssStyle = new EcmaDOM.CSSStyleDeclaration(structurePropertiesMap);
	assertEquals(cssStyle.setProperty("background-color", "green"), true);
	assertEquals(cssStyle.getPropertyValue("background-color"), "green");
});

// Test remove property
test("remove property", () => {
	const structurePropertiesMap = new Map();
	structurePropertiesMap.set("background-color", "red");

	const cssStyle = new EcmaDOM.CSSStyleDeclaration(structurePropertiesMap);
	assertEquals(cssStyle.removeProperty("background-color"), true);
	assertEquals(cssStyle.getPropertyValue("background-color"), undefined);
});
