# Mock DOM Resources

[![npm Module](https://badge.fury.io/js/mock-dom-resources.svg)](https://www.npmjs.org/package/mock-dom-resources)
[![Dependencies](https://david-dm.org/getify/mock-dom-resources.svg)](https://david-dm.org/getify/mock-dom-resources)
[![devDependencies](https://david-dm.org/getify/mock-dom-resources/dev-status.svg)](https://david-dm.org/getify/mock-dom-resources)

A simple utility for mocking the DOM APIs to simulate browser resource preloading and loading.

Resources are not actually loaded. This is a simulation. The request for a resource (i.e. adding a `<script>` element to the mock DOM) is matched up to a delayed firing of a load or error event as if the resource had actually loaded.

For fine grained testing purposes, you can configure all aspects of the simulation, including timings, success/error, and even browser capabilities (preloading, script ordered-async, etc).

**Note:** This is not a spec compliant implementation of a DOM, nor a virtual DOM, nor do we even mock the whole DOM API. The only parts that are mocked are what's minimally necessary for common resource loading simulations.

## API

The API is a single function (by default called `$DOM`) that creates an instance of a mocked DOM (aka `window`) each time its called. This function is passed an options object to control its behavior.

Example:

```js
var win = $DOM( {
	log(msg) {
		console.log( "msg:", msg );
	},
	resources: [
		{ url: "http://some.tld/a.js", loadDelay: 300, load: true },
		{ url: "http://some.tld/b.css", loadDelay: 400, load: false },
	],
} );

var elem = win.document.createElement( "script" );
elem.setAttribute( "src", "http://some.tld/a.js" );
elem.addEventListener( "load", function(){
    console.log( "Loaded:", this.src );
} );
win.document.head.appendChild( elem );

elem = win.document.createElement( "link" );
elem.setAttribute( "href", "http://some.tld/b.css" );
elem.addEventListener( "error", function(){
    console.log( "Failed:", this.href );
} );
win.document.head.appendChild( elem );
```

The console output from the above program will be:

```
msg: { window: 503186 }
msg: { document: 111648 }
msg: { head: 645112 }
msg: { body: 298071 }
msg: { createElement: 'script', internal_id: 982599 }
msg: { setAttribute: 'src | http://some.tld/a.js', internal_id: 982599 }
msg: { addEventListener: 'load', internal_id: 982599 }
msg: { appendChild: 982599, internal_id: 645112 }
msg: { createElement: 'link', internal_id: 771705 }
msg: { setAttribute: 'href | http://some.tld/b.css', internal_id: 771705 }
msg: { addEventListener: 'error', internal_id: 771705 }
msg: { appendChild: 771705, internal_id: 645112 }
msg: { dispatchEvent: 'load', internal_id: 982599 }
Loaded: http://some.tld/a.js
msg: { dispatchEvent: 'error', internal_id: 771705 }
Failed: http://some.tld/b.css
```

**Note:** The numbers shown in the output are randomly generated internal IDs for each DOM element, and as such will vary with each use. To constrain the IDs to predictable incrementing numbers (starting at 1), pass the `sequentialIds: true` option.

`window.performance` has only the `getEntriesByName(..)` method, which takes a URL and returns an array (of only that URL) if that resource URL has been loaded already, false if not.

### Options

Before calling `$DOM(..)`, set `$DOM.replaceGlobals = true;` to define/overwrite standard DOM environment globals -- `global.window`, `global.document`, `global.performance`, `global.Event`, and `global.location` -- with the mocked elements produced by the `$DOM(..)` call. **Warning:** This ***will break in the browser***!

The options that can be passed to `$DOM(..)`:

* `sequentialIds` (`true` / `false`): Use strictly incrementing numeric IDs (starting with `1`) for created DOM elements. Defaults to `false` (generates random IDs).

* `relList` (`true` / `false`): Mock the [`relList` mechanism](http://caniuse.com/#search=relList) on DOM elements, including [`relList.supports(..)`](https://developer.mozilla.org/en-US/docs/Web/API/DOMTokenList/supports). Defaults to `true`.

* `scriptAsync` (`true` / `false`): Make `<script>` elements behave with the ["ordered async" capability](https://www.w3.org/Bugs/Public/show_bug.cgi?id=11295) where the `async` property defaults to `true` but if set to `false`, multiple requested scripts of this same sort will always execute in order of being appended to the DOM. Defaults to `true`.

* `linkPreload` (`true` / `false`): Make `<link>` elements behave with the [`rel=preload` preloading capability](https://w3c.github.io/preload/). Defaults to `true`.

* `location` (`string`): Set the default `document.location`. Defaults to `"https://some.thing/else"`.

* `baseURI` (`string`): Set the default `document.baseURI` property. Defaults to the value of `opts.location`.

* `log` (`function`): Specify a function to receive the log messages while performing mock DOM operations. This is useful for test cases where you want to verify that all operations were performed as expected. Set to an empty function to ignore/discard log messages. Defaults to printing to the console as with `console.log(..)`.

* `error` (`function`): Specify a function to receive any error messages while performing mock DOM operations. Set to an empty function to ignore/discard errors. Defaults to `throw`ing the error as an exception.

* `resources` (`array`): Specify the resources that should be available for the mock DOM to pretend to load. Each entry in this array is an object including the following specifiers:

	- `url` (required): the exact URL that the resource loading request should match. **Note:** no normalization is done on either these URLs or those requested by mock DOM elements.
	- `loaded` (optional): boolean that controls if the resource is treated as if it was already fully loaded (into the "cache") before any of the DOM processing occurs. Also adds an entry to be exposed by `window.performance.getEntriesByName(..)`. Overrides `preloadDelay`, `preload`, `loadDelay`, and `loaded` specifiers for that resource entry.
	- `preloadDelay` (optional): integer of milliseconds to emulate as delay for preloading the element (with `<link rel=preload>` functionality).
	- `preload` (optional): boolean that indicates if the preload should be complete successfully (`true`) or as a loading error (`false`).
	- `loadDelay` (optional): integer of milliseconds to emulate as delay for loading the element (with a `<link>`, `<script>`, or `<img>` element).
	- `load` (optional): boolean that indicates if the load should complete successfully (`true`) or as a loading error (`false`).

## Using with Node.js

You'll most likely use this utility to mock out a DOM for tests in Node.js. To do so, install with `npm` then require it in your script:

```js
var $DOM = require( "mock-dom-resources" );

// ..
```

## Builds

[![npm Module](https://badge.fury.io/js/mock-dom-resources.svg)](https://www.npmjs.org/package/mock-dom-resources)

The distribution library file (`dist/mock-dom.js`) comes pre-built with the npm package distribution, so you shouldn't need to rebuild it under normal circumstances.

However, if you download this repository via Git:

1. The included build utility (`scripts/build-core.js`) builds (and ~~minifies~~) `dist/mock-dom.js` from source. **Note:** Minification is currently disabled. **The build utility expects Node.js version 6+.**

2. To install the build and test dependencies, run `npm install` from the project root directory.

3. Because of how npm lifecyle events (currently: npm v4) work, `npm install` will have the side effect of automatically running the build and test utilities for you. So, no further action should be needed on your part. Starting with npm v5, the build utility will still be run automatically on `npm install`, but the test utility will not.

To run the build utility with npm:

```
npm run build
```

To run the build utility directly without npm:

```
node scripts/build-core.js
```

## Tests

A comprehensive test suite is included in this repository, as well as the npm package distribution.

1. You can run the tests in a browser by opening up `tests/index.html` (**requires ES6+ browser environment**). **Note:** The final test (that tries to overwrite the DOM globals) fails in a browser; that's only allowed in Node. This failure is by design.

2. The included Node.js test utility (`scripts/node-tests.js`) runs the test suite. **This test utility expects Node.js version 6+.**

3. Ensure the Node.js test utility dependencies are installed by running `npm install` from the project root directory.

4. Because of how npm lifecyle events (currently: npm v4) work, `npm install` will have the side effect of automatically running the build and test utilities for you. So, no further action should be needed on your part. Starting with npm v5, the build utility will still be run automatically on `npm install`, but the test utility will not.

To run the test utility with npm:

```
npm test
```

To run the test utility directly without npm:

```
node scripts/node-tests.js
```

### Test Coverage

If you have [Istanbul](https://github.com/gotwarlost/istanbul) already installed on your system (requires v1.0+), you can use it to check the test coverage:

```
npm run coverage
```

Then open up `coverage/lcov-report/index.html` in a browser to view the report.

To run Istanbul directly without npm:

```
istanbul cover scripts/node-tests.js
```

## License

All code and documentation are (c) 2017 Kyle Simpson and released under the [MIT License](http://getify.mit-license.org/). A copy of the MIT License [is also included](LICENSE.txt).
