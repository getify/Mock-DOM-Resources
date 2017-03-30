"use strict";

QUnit.test( "build DOM", function test(assert){
	var win = $DOM( {
		sequentialIds: true,
		log: function(){},
		error: function(){},
	} );

	var x = win.document.createElement( "p" );
	x.innerHTML = "Hello";
	var y = win.document.createElement( "p" );
	y.innerHTML = "World";
	var z = win.document.createElement( "p" );
	z.innerHTML = "!";

	var w = win.document.createElement( "div" );
	w.appendChild( x );
	w.appendChild( y );
	w.appendChild( z );

	var p = win.document.createElement( "p" );
	p.innerHTML = ":)";

	win.document.body.appendChild( w );
	win.document.body.appendChild( p );

	var pElems = win.document.body.getElementsByTagName( "p" );

	var rExpected = 4;
	var pExpected = 3;
	var qExpected = {
		"tagName": "DOCUMENT",
		"childNodes": [
			{ "tagName": "HEAD", "childNodes": [], "_internal_id": 2 },
			{ "tagName": "BODY",
				"childNodes": [
					{ "tagName": "DIV",
						"childNodes": [
							{ "tagName": "P", "childNodes": [], "innerHTML": "Hello", "_internal_id": 5 },
							{ "tagName": "P", "childNodes": [], "innerHTML": "!", "_internal_id": 7 }
						],
						"_internal_id": 8
					},
					{ "tagName": "P", "childNodes": [], "innerHTML": ":)", "_internal_id": 9 }
				],
				"_internal_id": 3
			}
		],
		"_internal_id": 1
	};

	var rActual = pElems.length;
	w.removeChild( y );
	var pActual = pElems.length;
	var qActual = JSON.parse( JSON.stringify( win.document, ["tagName","childNodes","innerHTML","_internal_id"] ) );

	assert.expect( 3 );
	assert.strictEqual( rActual, rExpected, "p elements" );
	assert.strictEqual( pActual, pExpected, "p elements, after removeChild()" );
	assert.deepEqual( qActual, qExpected, "node tree structure" );
} );

QUnit.test( "check already loaded resource", function test(assert){
	assert.expect( 2 );

	var { logs, log, error } = collectLogs();

	var win = $DOM( {
		sequentialIds: true,
		log,
		error,
		resources: [
			{ url: "a.js", loaded: true },
		],
	} );

	var rExpected = ["a.js"];
	var pExpected = [];

	var rActual = win.performance.getEntriesByName( "a.js" );
	var pActual = win.performance.getEntriesByName( "b.js" );

	assert.deepEqual( rActual, rExpected, "found resource" );
	assert.deepEqual( pActual, pExpected, "resource not found" );
} );

QUnit.test( "load a script", function test(assert){
	var done = assert.async();
	assert.expect( 1 );

	var { logs, log, error } = collectLogs();

	var win = $DOM( {
		sequentialIds: true,
		log,
		error,
		resources: [
			{ url: "a.js", loadDelay: 2, load: true },
		],
	} );

	var script = win.document.createElement( "script" );
	script.setAttribute( "src", "a.js" );
	script.addEventListener( "load", function(){
		assert.deepEqual( logs, rExpected, "logs" );
		done();
	} );
	win.document.head.appendChild( script );

	var rExpected = [
		{ window: 4 },
		{ document: 1 },
		{ head: 2 },
		{ body: 3 },
		{ createElement: 'script', internal_id: 5 },
		{ setAttribute: 'src | a.js', internal_id: 5 },
		{ addEventListener: 'load', internal_id: 5 },
		{ appendChild: 5, internal_id: 2 },
		{ dispatchEvent: 'load', internal_id: 5 },
	];
} );

QUnit.test( "load multiple scripts (ordered async)", function test(assert){
	var done = assert.async( 3 );
	assert.expect( 1 );

	var { logs, log, error } = collectLogs();

	var win = $DOM( {
		sequentialIds: true,
		log,
		error,
		resources: [
			{ url: "a.js", loadDelay: 40, load: true },
			{ url: "b.js", loadDelay: 10, load: true },
			{ url: "c.js", loadDelay: 25, load: true },
		],
	} );

	var script1 = win.document.createElement( "script" );
	script1.setAttribute( "src", "a.js" );
	script1.setAttribute( "async", false );
	script1.addEventListener( "load", done );

	var script2 = win.document.createElement( "script" );
	script2.setAttribute( "src", "b.js" );
	script2.setAttribute( "async", false );
	script2.addEventListener( "load", done );

	var script3 = win.document.createElement( "script" );
	script3.setAttribute( "src", "c.js" );
	script3.setAttribute( "async", false );
	script3.addEventListener( "load", function(){
		assert.deepEqual( logs, rExpected, "logs" );
		done();
	} );

	win.document.head.appendChild( script1 );
	win.document.head.appendChild( script2 );
	win.document.head.appendChild( script3 );

	var rExpected = [
		{ window: 4 },
		{ document: 1 },
		{ head: 2 },
		{ body: 3 },
		{ createElement: 'script', internal_id: 5 },
		{ setAttribute: 'src | a.js', internal_id: 5 },
		{ setAttribute: 'async | false', internal_id: 5 },
		{ addEventListener: 'load', internal_id: 5 },
		{ createElement: 'script', internal_id: 6 },
		{ setAttribute: 'src | b.js', internal_id: 6 },
		{ setAttribute: 'async | false', internal_id: 6 },
		{ addEventListener: 'load', internal_id: 6 },
		{ createElement: 'script', internal_id: 7 },
		{ setAttribute: 'src | c.js', internal_id: 7 },
		{ setAttribute: 'async | false', internal_id: 7 },
		{ addEventListener: 'load', internal_id: 7 },
		{ appendChild: 5, internal_id: 2 },
		{ appendChild: 6, internal_id: 2 },
		{ appendChild: 7, internal_id: 2 },
		{ updateLoadQueue: 'b.js', internal_id: 6 },
		{ updateLoadQueue: 'c.js', internal_id: 7 },
		{ updateLoadQueue: 'a.js', internal_id: 5 },
		{ dispatchEvent: 'load', internal_id: 5 },
		{ dispatchEvent: 'load', internal_id: 6 },
		{ dispatchEvent: 'load', internal_id: 7 },
	];
} );

QUnit.test( "load multiple scripts (NO ordered async)", function test(assert){
	var done = assert.async( 3 );
	assert.expect( 1 );

	var { logs, log, error } = collectLogs();

	var win = $DOM( {
		sequentialIds: true,
		log,
		error,
		resources: [
			{ url: "a.js", loadDelay: 40, load: true },
			{ url: "b.js", loadDelay: 10, load: true },
			{ url: "c.js", loadDelay: 25, load: true },
		],
	} );

	var script1 = win.document.createElement( "script" );
	script1.setAttribute( "src", "a.js" );
	script1.addEventListener( "load", function(){
		assert.deepEqual( logs, rExpected, "logs" );
		done();
	} );

	var script2 = win.document.createElement( "script" );
	script2.setAttribute( "src", "b.js" );
	script2.addEventListener( "load", done );

	var script3 = win.document.createElement( "script" );
	script3.setAttribute( "src", "c.js" );
	script3.addEventListener( "load", done );

	win.document.head.appendChild( script1 );
	win.document.head.appendChild( script2 );
	win.document.head.appendChild( script3 );

	var rExpected = [
		{ window: 4 },
		{ document: 1 },
		{ head: 2 },
		{ body: 3 },
		{ createElement: 'script', internal_id: 5 },
		{ setAttribute: 'src | a.js', internal_id: 5 },
		{ addEventListener: 'load', internal_id: 5 },
		{ createElement: 'script', internal_id: 6 },
		{ setAttribute: 'src | b.js', internal_id: 6 },
		{ addEventListener: 'load', internal_id: 6 },
		{ createElement: 'script', internal_id: 7 },
		{ setAttribute: 'src | c.js', internal_id: 7 },
		{ addEventListener: 'load', internal_id: 7 },
		{ appendChild: 5, internal_id: 2 },
		{ appendChild: 6, internal_id: 2 },
		{ appendChild: 7, internal_id: 2 },
		{ dispatchEvent: 'load', internal_id: 6 },
		{ dispatchEvent: 'load', internal_id: 7 },
		{ dispatchEvent: 'load', internal_id: 5 },
	];
} );

QUnit.test( "preload a script", function test(assert){
	var done = assert.async();
	assert.expect( 1 );

	var { logs, log, error } = collectLogs();

	var win = $DOM( {
		sequentialIds: true,
		log,
		error,
		resources: [
			{ url: "a.js", preloadDelay: 2, preload: true },
		],
	} );

	var link = win.document.createElement( "link" );
	link.setAttribute( "rel", "preload" );
	link.setAttribute( "as", "script" );
	link.setAttribute( "href", "a.js" );
	link.addEventListener( "load", function(){
		assert.deepEqual( logs, rExpected, "logs" );
		done();
	} );
	win.document.head.appendChild( link );

	var rExpected = [
		{ window: 4 },
		{ document: 1 },
		{ head: 2 },
		{ body: 3 },
		{ createElement: 'link', internal_id: 5 },
		{ setAttribute: 'rel | preload', internal_id: 5 },
		{ setAttribute: 'as | script', internal_id: 5 },
		{ setAttribute: 'href | a.js', internal_id: 5 },
		{ addEventListener: 'load', internal_id: 5 },
		{ appendChild: 5, internal_id: 2 },
		{ dispatchEvent: 'load', internal_id: 5 },
	];
} );

QUnit.test( "preload multiple scripts", function test(assert){
	var done = assert.async( 3 );
	assert.expect( 1 );

	var { logs, log, error } = collectLogs();

	var win = $DOM( {
		sequentialIds: true,
		log,
		error,
		resources: [
			{ url: "a.js", preloadDelay: 40, preload: true },
			{ url: "b.js", preloadDelay: 10, preload: true },
			{ url: "c.js", preloadDelay: 25, preload: true },
		],
	} );

	var link1 = win.document.createElement( "link" );
	link1.setAttribute( "rel", "preload" );
	link1.setAttribute( "as", "script" );
	link1.setAttribute( "href", "a.js" );
	link1.addEventListener( "load", function(){
		assert.deepEqual( logs, rExpected, "logs" );
		done();
	} );

	var link2 = win.document.createElement( "link" );
	link2.setAttribute( "rel", "preload" );
	link2.setAttribute( "as", "script" );
	link2.setAttribute( "href", "b.js" );
	link2.addEventListener( "load", done );

	var link3 = win.document.createElement( "link" );
	link3.setAttribute( "rel", "preload" );
	link3.setAttribute( "as", "script" );
	link3.setAttribute( "href", "c.js" );
	link3.addEventListener( "load", done );

	win.document.head.appendChild( link1 );
	win.document.head.appendChild( link2 );
	win.document.head.appendChild( link3 );

	var rExpected = [
		{ window: 4 },
		{ document: 1 },
		{ head: 2 },
		{ body: 3 },
		{ createElement: 'link', internal_id: 5 },
		{ setAttribute: 'rel | preload', internal_id: 5 },
		{ setAttribute: 'as | script', internal_id: 5 },
		{ setAttribute: 'href | a.js', internal_id: 5 },
		{ addEventListener: 'load', internal_id: 5 },
		{ createElement: 'link', internal_id: 6 },
		{ setAttribute: 'rel | preload', internal_id: 6 },
		{ setAttribute: 'as | script', internal_id: 6 },
		{ setAttribute: 'href | b.js', internal_id: 6 },
		{ addEventListener: 'load', internal_id: 6 },
		{ createElement: 'link', internal_id: 7 },
		{ setAttribute: 'rel | preload', internal_id: 7 },
		{ setAttribute: 'as | script', internal_id: 7 },
		{ setAttribute: 'href | c.js', internal_id: 7 },
		{ addEventListener: 'load', internal_id: 7 },
		{ appendChild: 5, internal_id: 2 },
		{ appendChild: 6, internal_id: 2 },
		{ appendChild: 7, internal_id: 2 },
		{ dispatchEvent: 'load', internal_id: 6 },
		{ dispatchEvent: 'load', internal_id: 7 },
		{ dispatchEvent: 'load', internal_id: 5 },
	];
} );

QUnit.test( "preload a script, then load it", function test(assert){
	var done = assert.async();
	assert.expect( 1 );

	var { logs, log, error } = collectLogs();

	var win = $DOM( {
		sequentialIds: true,
		log,
		error,
		resources: [
			{ url: "a.js", preloadDelay: 2, preload: true, loadDelay: 5, load: true },
		],
	} );

	var link = win.document.createElement( "link" );
	link.setAttribute( "rel", "preload" );
	link.setAttribute( "as", "script" );
	link.setAttribute( "href", "a.js" );
	link.addEventListener( "load", function(){
		var script = win.document.createElement( "script" );
		script.setAttribute( "src", "a.js" );
		script.addEventListener( "load", function(){
			assert.deepEqual( logs, rExpected, "logs" );
			done();
		} );
		win.document.head.appendChild( script );
	} );
	win.document.head.appendChild( link );

	var rExpected = [
		{ window: 4 },
		{ document: 1 },
		{ head: 2 },
		{ body: 3 },
		{ createElement: 'link', internal_id: 5 },
		{ setAttribute: 'rel | preload', internal_id: 5 },
		{ setAttribute: 'as | script', internal_id: 5 },
		{ setAttribute: 'href | a.js', internal_id: 5 },
		{ addEventListener: 'load', internal_id: 5 },
		{ appendChild: 5, internal_id: 2 },
		{ dispatchEvent: 'load', internal_id: 5 },
		{ createElement: 'script', internal_id: 6 },
		{ setAttribute: 'src | a.js', internal_id: 6 },
		{ addEventListener: 'load', internal_id: 6 },
		{ appendChild: 6, internal_id: 2 },
		{ dispatchEvent: 'load', internal_id: 6 },
	];
} );

QUnit.test( "preload multiple scripts, then load them (ordered async)", function test(assert){
	var done = assert.async( 3 );
	assert.expect( 1 );

	var { logs, log, error } = collectLogs();

	var win = $DOM( {
		sequentialIds: true,
		log,
		error,
		resources: [
			{ url: "a.js", preloadDelay: 40, preload: true, loadDelay: 20, load: true },
			{ url: "b.js", preloadDelay: 10, preload: true, loadDelay: 30, load: true },
			{ url: "c.js", preloadDelay: 25, preload: true, loadDelay: 10, load: true },
		],
	} );

	var rExpected = [
		{ window: 4 },
		{ document: 1 },
		{ head: 2 },
		{ body: 3 },
		{ createElement: 'link', internal_id: 5 },
		{ setAttribute: 'rel | preload', internal_id: 5 },
		{ setAttribute: 'as | script', internal_id: 5 },
		{ setAttribute: 'href | a.js', internal_id: 5 },
		{ addEventListener: 'load', internal_id: 5 },
		{ createElement: 'link', internal_id: 6 },
		{ setAttribute: 'rel | preload', internal_id: 6 },
		{ setAttribute: 'as | script', internal_id: 6 },
		{ setAttribute: 'href | b.js', internal_id: 6 },
		{ addEventListener: 'load', internal_id: 6 },
		{ createElement: 'link', internal_id: 7 },
		{ setAttribute: 'rel | preload', internal_id: 7 },
		{ setAttribute: 'as | script', internal_id: 7 },
		{ setAttribute: 'href | c.js', internal_id: 7 },
		{ addEventListener: 'load', internal_id: 7 },
		{ appendChild: 5, internal_id: 2 },
		{ appendChild: 6, internal_id: 2 },
		{ appendChild: 7, internal_id: 2 },
		{ dispatchEvent: 'load', internal_id: 6 },
		{ dispatchEvent: 'load', internal_id: 7 },
		{ dispatchEvent: 'load', internal_id: 5 },
		{ createElement: 'script', internal_id: 8 },
		{ setAttribute: 'src | a.js', internal_id: 8 },
		{ setAttribute: 'async | false', internal_id: 8 },
		{ addEventListener: 'load', internal_id: 8 },
		{ createElement: 'script', internal_id: 9 },
		{ setAttribute: 'src | b.js', internal_id: 9 },
		{ setAttribute: 'async | false', internal_id: 9 },
		{ addEventListener: 'load', internal_id: 9 },
		{ createElement: 'script', internal_id: 10 },
		{ setAttribute: 'src | c.js', internal_id: 10 },
		{ setAttribute: 'async | false', internal_id: 10 },
		{ addEventListener: 'load', internal_id: 10 },
		{ appendChild: 8, internal_id: 2 },
		{ appendChild: 9, internal_id: 2 },
		{ appendChild: 10, internal_id: 2 },
		{ updateLoadQueue: 'c.js', internal_id: 10 },
		{ updateLoadQueue: 'a.js', internal_id: 8 },
		{ dispatchEvent: 'load', internal_id: 8 },
		{ updateLoadQueue: 'b.js', internal_id: 9 },
		{ dispatchEvent: 'load', internal_id: 9 },
		{ dispatchEvent: 'load', internal_id: 10 },
	];

	preloadScripts();


	// ***************************************

	function preloadScripts() {
		var preloadCount = 0;

		var link1 = win.document.createElement( "link" );
		link1.setAttribute( "rel", "preload" );
		link1.setAttribute( "as", "script" );
		link1.setAttribute( "href", "a.js" );
		link1.addEventListener( "load", function(){
			preloadCount++;
			if (preloadCount == 3) loadScripts();
		} );

		var link2 = win.document.createElement( "link" );
		link2.setAttribute( "rel", "preload" );
		link2.setAttribute( "as", "script" );
		link2.setAttribute( "href", "b.js" );
		link2.addEventListener( "load", function(){
			preloadCount++;
			if (preloadCount == 3) loadScripts();
		} );

		var link3 = win.document.createElement( "link" );
		link3.setAttribute( "rel", "preload" );
		link3.setAttribute( "as", "script" );
		link3.setAttribute( "href", "c.js" );
		link3.addEventListener( "load", function(){
			preloadCount++;
			if (preloadCount == 3) loadScripts();
		} );

		win.document.head.appendChild( link1 );
		win.document.head.appendChild( link2 );
		win.document.head.appendChild( link3 );
	}

	function loadScripts() {
		var script1 = win.document.createElement( "script" );
		script1.setAttribute( "src", "a.js" );
		script1.setAttribute( "async", false );
		script1.addEventListener( "load", done );

		var script2 = win.document.createElement( "script" );
		script2.setAttribute( "src", "b.js" );
		script2.setAttribute( "async", false );
		script2.addEventListener( "load", done );

		var script3 = win.document.createElement( "script" );
		script3.setAttribute( "src", "c.js" );
		script3.setAttribute( "async", false );
		script3.addEventListener( "load", function(){
			assert.deepEqual( logs, rExpected, "logs" );
			done();
		} );

		win.document.head.appendChild( script1 );
		win.document.head.appendChild( script2 );
		win.document.head.appendChild( script3 );
	}
} );






// ************************************

function collectLogs() {
	var logs = [];
	return {
		logs,
		log(msg){ logs.push( msg ); },
		error(msg) { logs.push( msg ); },
	};
}
