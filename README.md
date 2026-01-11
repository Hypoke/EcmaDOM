# EcmaDOM

[![License](https://img.shields.io/badge/License-Fair-brightgreen.svg)](https://opensource.org/license/fair)

EcmaDOM is an ES6 HTML/CSS DOM manipulation library designed for automated testing and image/canvas-based rendering. With a focus on modern web development practices, EcmaDOM allows developers to emulate and manage DOM's in a seamless, user-friendly way.

## Usage

To get started quickly, you can import all classes directly from `mod.js`.

```javascript
import { EcmaDOM } from "./mod.ts";

const parser = new EcmaDOM.HTMLParser(`
<html>
	<body>
		<main id="test">
			<p id="test2">Hello</p>
		</main>
		<footer>
			<test-component></test-component>
		</footer>
	</body>
</html>
`);

parser.applyCSS(`
	:root {
		--color: yellow;
		--bg: yellow;
	}

	test, p {
		width: 200px;
	}

	body > #test {
		--height: 100px;
		width: 100px;
		height: var(--height);
	}
`);

parser.evaluateProperties();

console.log(parser.document.querySelector("#test2").style.getPropertyValue("background"));
```

## Supported Environments

| Runtime        | Availability |
| -------------- | ------------ |
| Deno           | ✅           |
| Bun            | ✅           |
| Browser        | ✅           |
| Node           | ❌           |
| Other Runtimes | 🚫           |

## Features

| Feature                         | Availability |
| ------------------------------- | ------------ |
| Nested CSS Statements           | ✅           |
| Variable Resolution             | ✅           |
| Default CSS Values              | ✅           |
| JavaScript Support              | 📝           |
| Style and Script Tag Resolution | 📝           |
| CSS Import Resolution           | 📝           |
| CSS @ Tags                      | 📝           |

## Licensing

The project itself use the Fair-License.

Disclaimer: This is only a short summary of the Full Text. Not a legal advice.

| Permission                                                          | Status |
| ------------------------------------------------------------------- | ------ |
| You can use the software for commercial purposes.                   | ✅     |
| You can grant/extend a license to the software.                     | ✅     |
| You can distribute original or modified (derivative) works.         | ✅     |
| You can modify the software and create derivatives.                 | ✅     |
| You can change the software's name if modified/distributed.         | ✅     |
| You cannot place warranty on the software licensed.                 | ❌     |
| You must include the full text of the license in modified software. | ❗     |

### Dependencys

| Package                                                  | License |
| -------------------------------------------------------- | ------- |
| [deno-dom](https://github.com/b-fuze/deno-dom)           | MIT     |
| [std](https://github.com/denoland/std)                   | MIT     |
| [opentype.js](https://github.com/opentypejs/opentype.js) | MIT     |
| [axe-core](https://github.com/dequelabs/axe-core)        | MPL-2.0 |
