"use strict";

const WINDOW_ID = 1;
const DOCUMENT_ID = 2;
const HEAD_ID = 3;
const BODY_ID = 4;

QUnit.test( "build DOM", function test(assert){
	var win = $DOM( {
		sequentialIds: true,
		log: function log(){},
		error: function error(){},
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
	var aElems = win.document.body.getElementsByTagName( "a" );

	var rExpected = 4;
	var pExpected = 3;
	var qExpected = 3;
	var tExpected = {
		tagName: "DOCUMENT",
		childNodes: [
			{ tagName: "HEAD", childNodes: [], _internal_id: HEAD_ID, },
			{ tagName: "BODY",
				childNodes: [
					{ tagName: "DIV",
						childNodes: [
							{ tagName: "P", childNodes: [], innerHTML: "Hello", _internal_id: 5, },
							{ tagName: "P", childNodes: [], innerHTML: "!", _internal_id: 7, },
						],
						_internal_id: 8,
					},
					{ tagName: "P", childNodes: [], innerHTML: ":)", _internal_id: 9, },
				],
				_internal_id: BODY_ID,
			},
		],
		_internal_id: DOCUMENT_ID,
	};
	var sExpected = ":)";
	var uExpected = 0;

	var rActual = pElems.length;
	w.removeChild( y );
	var pActual = pElems.length;
	w.removeChild( y );
	var qActual = pElems.length;
	var tActual = JSON.parse( JSON.stringify( win.document, ["tagName","childNodes","innerHTML","_internal_id",] ) );
	var sActual = p.getAttribute( "innerHTML" );
	var uActual = aElems.length;

	assert.expect( 6 );
	assert.strictEqual( rActual, rExpected, "p elements" );
	assert.strictEqual( pActual, pExpected, "p elements, after removeChild()" );
	assert.strictEqual( qActual, qExpected, "extraneous removeChild()" );
	assert.deepEqual( tActual, tExpected, "node tree structure" );
	assert.strictEqual( sActual, sExpected, "getAttribute()" );
	assert.strictEqual( uActual, uExpected, "(no) a elements" );
} );

QUnit.test( "check already cached resource", function test(assert){
	assert.expect( 2 );

	var win = $DOM( {
		sequentialIds: true,
		log: function log(){},
		error: function error(){},
		resources: [
			{ url: "a.js", cached: true, },
		],
	} );

	var rExpected = ["a.js",];
	var pExpected = [];

	var rActual = win.performance.getEntriesByName( "a.js" );
	var pActual = win.performance.getEntriesByName( "b.js" );

	assert.deepEqual( rActual, rExpected, "found resource" );
	assert.deepEqual( pActual, pExpected, "resource not found" );
} );

QUnit.test( "relList / supports()", function test(assert){
	var win1 = $DOM( {
		relList: false,
		log: function log(){},
		error: function error(){},
	} );

	var win2 = $DOM( {
		log: function log(){},
		error: function error(){},
	} );

	var win3 = $DOM( {
		linkPreload: false,
		log: function log(){},
		error: function error(){},
	} );

	var link1 = win2.document.createElement( "link" );
	link1.setAttribute( "rel", "preload" );

	var link2 = win3.document.createElement( "link" );
	link2.setAttribute( "rel", "preload" );

	var script = win2.document.createElement( "script" );

	var rExpected = false;
	var pExpected = true;
	var qExpected = false;
	var tExpected = false;
	var sExpected = false;

	var rActual = !!win1.document.relList;
	var pActual = link1.relList.supports( "preload" );
	var qActual = link1.relList.supports( "funny" );
	var tActual = link2.relList.supports( "preload" );
	var sActual = script.relList.supports( "preload" );

	assert.expect( 5 );
	assert.strictEqual( rActual, rExpected, "no relList" );
	assert.strictEqual( pActual, pExpected, "check rel: 'preload'" );
	assert.strictEqual( qActual, qExpected, "check rel: 'funny'" );
	assert.strictEqual( tActual, tExpected, "no preloading" );
	assert.strictEqual( sActual, sExpected, "not <link>" );
} );

QUnit.test( "event listeners", function test(assert){
	var win = $DOM( {
		log: function log(){},
		error: function error(){},
	} );

	var rExpected = 3;
	var pExpected = 1;
	var qExpected = 2;

	var rActual = 0;
	var pActual = 0;
	var qActual = 0;

	var x = win.document.createElement( "script" );
	x.addEventListener( "funny", function onfunny(evt){
		evt.preventDefault();
		evt.stopPropagation();
		evt.stopImmediatePropagation();
		rActual++;
	} );
	x.addEventListener( "hello", function onhello(){
		x.removeEventListener( "hello", onhello );
		x.removeEventListener( "hello2", onhello );
		pActual++;
	} );
	x.addEventListener( "world", function onworld(){
		qActual++;
	} );

	var e1 = win.document.createEvent();
	x.dispatchEvent( e1 );
	e1.initEvent( "funny" );

	var e2 = new win.Event( "hello" );
	var e3 = new win.Event( "world" );
	var e4 = new win.Event( "!!" );

	x.dispatchEvent( e1 );
	x.dispatchEvent( e1 );
	x.dispatchEvent( e1 );
	x.dispatchEvent( e2 );
	x.dispatchEvent( e2 );
	x.dispatchEvent( e3 );
	x.dispatchEvent( e3 );
	x.dispatchEvent( e4 );

	assert.expect( 3 );
	assert.strictEqual( rActual, rExpected, "event prevented" );
	assert.strictEqual( pActual, pExpected, "event removed" );
	assert.strictEqual( qActual, qExpected, "event" );
} );

QUnit.test( "request unknown resources", function test(assert){
	var done = assert.async();
	assert.expect( 1 );

	var rExpected = [
		{ window: WINDOW_ID, },
		{ document: DOCUMENT_ID, },
		{ head: HEAD_ID, },
		{ body: BODY_ID, },
		{ createElement: "link", internal_id: 5, },
		{ setAttribute: "rel | preload", internal_id: 5, },
		{ setAttribute: "href | a.js", internal_id: 5, },
		{ createElement: "link", internal_id: 6, },
		{ setAttribute: "href | b.js", internal_id: 6, },
		{ appendChild: 5, internal_id: HEAD_ID, },
		{ message: "appendChild: Preload resource not found (a.js; 5)", },
		{ appendChild: 6, internal_id: HEAD_ID, },
		{ message: "appendChild: Load resource not found (b.js; 6)", },
		{ dispatchEvent: "DOMContentLoaded", internal_id: DOCUMENT_ID, },
		{ dispatchEvent: "load", internal_id: WINDOW_ID, },
	];

	var { logs: rActual, log, error, } = collectLogs();

	var wrappedErrorFn = function wrapped(msg) {
		if (msg instanceof Error) {
			msg = JSON.parse( JSON.stringify( msg, ["message",] ) );
		}
		return error( msg );
	};

	var win = $DOM( {
		sequentialIds: true,
		log,
		error: wrappedErrorFn,
	} );

	var link1 = win.document.createElement( "link" );
	link1.setAttribute( "rel", "preload" );
	link1.setAttribute( "href", "a.js" );

	var link2 = win.document.createElement( "link" );
	link2.setAttribute( "href", "b.js" );

	win.document.head.appendChild( link1 );
	win.document.head.appendChild( link2 );

	win.onload = function onload(){
		assert.deepEqual( rActual, rExpected, "logs" );
		done();
	};
} );

QUnit.test( "load a script", function test(assert){
	var done = assert.async( 2 );
	assert.expect( 1 );

	var rExpected = [
		{ window: WINDOW_ID, },
		{ document: DOCUMENT_ID, },
		{ head: HEAD_ID, },
		{ body: BODY_ID, },
		{ createElement: "script", internal_id: 5, },
		{ setAttribute: "src | a.js", internal_id: 5, },
		{ addEventListener: "load", internal_id: 5, },
		{ appendChild: 5, internal_id: HEAD_ID, },
		{ dispatchEvent: "DOMContentLoaded", internal_id: DOCUMENT_ID, },
		{ dispatchEvent: "load", internal_id: WINDOW_ID, },
		{ dispatchEvent: "load", internal_id: 5, },
	];

	var { logs: rActual, log, error, } = collectLogs();

	var win = $DOM( {
		sequentialIds: true,
		log,
		error,
		resources: [
			{ url: "a.js", load: true, loadDelay: "invalid" },
		],
	} );

	win.onload = done;

	var script = win.document.createElement( "script" );
	script.setAttribute( "src", "a.js" );
	script.addEventListener( "load", function onload(){
		assert.deepEqual( rActual, rExpected, "logs" );
		done();
	} );
	win.document.head.appendChild( script );
} );

QUnit.test( "load multiple scripts (ordered async)", function test(assert){
	var done = assert.async( 3 );
	assert.expect( 1 );

	var rExpected = [
		{ window: WINDOW_ID, },
		{ document: DOCUMENT_ID, },
		{ head: HEAD_ID, },
		{ body: BODY_ID, },
		{ createElement: "script", internal_id: 5, },
		{ setAttribute: "src | a.js", internal_id: 5, },
		{ addEventListener: "load", internal_id: 5, },
		{ createElement: "script", internal_id: 6, },
		{ setAttribute: "src | b.js", internal_id: 6, },
		{ addEventListener: "load", internal_id: 6, },
		{ createElement: "script", internal_id: 7, },
		{ setAttribute: "src | c.js", internal_id: 7, },
		{ addEventListener: "load", internal_id: 7, },
		{ appendChild: 5, internal_id: HEAD_ID, },
		{ appendChild: 6, internal_id: HEAD_ID, },
		{ appendChild: 7, internal_id: HEAD_ID, },
		{ dispatchEvent: "DOMContentLoaded", internal_id: DOCUMENT_ID, },
		{ dispatchEvent: "load", internal_id: WINDOW_ID, },
		{ updateExecQueue: "b.js", internal_id: 6, },
		{ updateExecQueue: "c.js", internal_id: 7, },
		{ updateExecQueue: "a.js", internal_id: 5, },
		{ dispatchEvent: "load", internal_id: 5, },
		{ dispatchEvent: "load", internal_id: 6, },
		{ dispatchEvent: "load", internal_id: 7, },
	];

	var { logs: rActual, log, error, } = collectLogs();

	var win = $DOM( {
		sequentialIds: true,
		log,
		error,
		resources: [
			{ url: "a.js", loadDelay: 40, load: true, },
			{ url: "b.js", loadDelay: 10, load: true, },
			{ url: "c.js", loadDelay: 25, load: true, },
		],
	} );

	var script1 = win.document.createElement( "script" );
	script1.setAttribute( "src", "a.js" );
	script1.async = false;
	script1.addEventListener( "load", done );

	var script2 = win.document.createElement( "script" );
	script2.setAttribute( "src", "b.js" );
	script2.async = false;
	script2.addEventListener( "load", done );

	var script3 = win.document.createElement( "script" );
	script3.setAttribute( "src", "c.js" );
	script3.async = false;
	script3.addEventListener( "load", function onload(){
		assert.deepEqual( rActual, rExpected, "logs" );
		done();
	} );

	win.document.head.appendChild( script1 );
	win.document.head.appendChild( script2 );
	win.document.head.appendChild( script3 );
} );

QUnit.test( "load multiple scripts (NO ordered async)", function test(assert){
	var done = assert.async( 3 );
	assert.expect( 1 );

	var rExpected = [
		{ window: WINDOW_ID, },
		{ document: DOCUMENT_ID, },
		{ head: HEAD_ID, },
		{ body: BODY_ID, },
		{ createElement: "script", internal_id: 5, },
		{ setAttribute: "src | a.js", internal_id: 5, },
		{ addEventListener: "load", internal_id: 5, },
		{ createElement: "script", internal_id: 6, },
		{ setAttribute: "src | b.js", internal_id: 6, },
		{ addEventListener: "load", internal_id: 6, },
		{ createElement: "script", internal_id: 7, },
		{ setAttribute: "src | c.js", internal_id: 7, },
		{ addEventListener: "load", internal_id: 7, },
		{ appendChild: 5, internal_id: HEAD_ID, },
		{ appendChild: 6, internal_id: HEAD_ID, },
		{ appendChild: 7, internal_id: HEAD_ID, },
		{ dispatchEvent: "DOMContentLoaded", internal_id: DOCUMENT_ID, },
		{ dispatchEvent: "load", internal_id: WINDOW_ID, },
		{ dispatchEvent: "load", internal_id: 6, },
		{ dispatchEvent: "load", internal_id: 7, },
		{ dispatchEvent: "load", internal_id: 5, },
	];

	var { logs: rActual, log, error, } = collectLogs();

	var win = $DOM( {
		sequentialIds: true,
		log,
		error,
		scriptAsync: false,
		resources: [
			{ url: "a.js", loadDelay: 40, load: true, },
			{ url: "b.js", loadDelay: 10, load: true, },
			{ url: "c.js", loadDelay: 25, load: true, },
		],
	} );

	var script1 = win.document.createElement( "script" );
	script1.setAttribute( "src", "a.js" );
	script1.addEventListener( "load", function onload(){
		assert.deepEqual( rActual, rExpected, "logs" );
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
} );

QUnit.test( "preload a script", function test(assert){
	var done = assert.async();
	assert.expect( 1 );

	var rExpected = [
		{ window: WINDOW_ID, },
		{ document: DOCUMENT_ID, },
		{ head: HEAD_ID, },
		{ body: BODY_ID, },
		{ createElement: "link", internal_id: 5, },
		{ setAttribute: "rel | preload", internal_id: 5, },
		{ setAttribute: "as | script", internal_id: 5, },
		{ setAttribute: "href | a.js", internal_id: 5, },
		{ addEventListener: "load", internal_id: 5, },
		{ appendChild: 5, internal_id: HEAD_ID, },
		{ dispatchEvent: "DOMContentLoaded", internal_id: DOCUMENT_ID, },
		{ dispatchEvent: "load", internal_id: WINDOW_ID, },
		{ dispatchEvent: "load", internal_id: 5, },
	];

	var { logs: rActual, log, error, } = collectLogs();

	var win = $DOM( {
		sequentialIds: true,
		log,
		error,
		resources: [
			{ url: "a.js", preloadDelay: "invalid", preload: true, },
		],
	} );

	var link = win.document.createElement( "link" );
	link.setAttribute( "rel", "preload" );
	link.setAttribute( "as", "script" );
	link.setAttribute( "href", "a.js" );
	link.addEventListener( "load", function onload(){
		assert.deepEqual( rActual, rExpected, "logs" );
		done();
	} );
	win.document.head.appendChild( link );
} );

QUnit.test( "preload multiple scripts", function test(assert){
	var done = assert.async( 3 );
	assert.expect( 1 );

	var rExpected = [
		{ window: WINDOW_ID, },
		{ document: DOCUMENT_ID, },
		{ head: HEAD_ID, },
		{ body: BODY_ID, },
		{ createElement: "link", internal_id: 5, },
		{ setAttribute: "rel | preload", internal_id: 5, },
		{ setAttribute: "as | script", internal_id: 5, },
		{ setAttribute: "href | a.js", internal_id: 5, },
		{ addEventListener: "load", internal_id: 5, },
		{ createElement: "link", internal_id: 6, },
		{ setAttribute: "rel | preload", internal_id: 6, },
		{ setAttribute: "as | script", internal_id: 6, },
		{ setAttribute: "href | b.js", internal_id: 6, },
		{ addEventListener: "load", internal_id: 6, },
		{ createElement: "link", internal_id: 7, },
		{ setAttribute: "rel | preload", internal_id: 7, },
		{ setAttribute: "as | script", internal_id: 7, },
		{ setAttribute: "href | c.js", internal_id: 7, },
		{ addEventListener: "load", internal_id: 7, },
		{ appendChild: 5, internal_id: HEAD_ID, },
		{ appendChild: 6, internal_id: HEAD_ID, },
		{ appendChild: 7, internal_id: HEAD_ID, },
		{ dispatchEvent: "DOMContentLoaded", internal_id: DOCUMENT_ID, },
		{ dispatchEvent: "load", internal_id: WINDOW_ID, },
		{ dispatchEvent: "load", internal_id: 6, },
		{ dispatchEvent: "load", internal_id: 7, },
		{ dispatchEvent: "load", internal_id: 5, },
	];

	var { logs: rActual, log, error, } = collectLogs();

	var win = $DOM( {
		sequentialIds: true,
		log,
		error,
		resources: [
			{ url: "a.js", preloadDelay: 40, preload: true, },
			{ url: "b.js", preload: true, },
			{ url: "c.js", preloadDelay: 25, preload: true, },
		],
	} );

	var link1 = win.document.createElement( "link" );
	link1.setAttribute( "rel", "preload" );
	link1.setAttribute( "as", "script" );
	link1.setAttribute( "href", "a.js" );
	link1.addEventListener( "load", function onload(){
		assert.deepEqual( rActual, rExpected, "logs" );
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
} );

QUnit.test( "preload a script, then load it", function test(assert){
	var done = assert.async();
	assert.expect( 1 );

	var rExpected = [
		{ window: WINDOW_ID, },
		{ document: DOCUMENT_ID, },
		{ head: HEAD_ID, },
		{ body: BODY_ID, },
		{ createElement: "link", internal_id: 5, },
		{ setAttribute: "rel | preload", internal_id: 5, },
		{ setAttribute: "as | script", internal_id: 5, },
		{ setAttribute: "href | a.js", internal_id: 5, },
		{ addEventListener: "load", internal_id: 5, },
		{ appendChild: 5, internal_id: HEAD_ID, },
		{ dispatchEvent: "DOMContentLoaded", internal_id: DOCUMENT_ID, },
		{ dispatchEvent: "load", internal_id: WINDOW_ID, },
		{ dispatchEvent: "load", internal_id: 5, },
		{ createElement: "script", internal_id: 6, },
		{ setAttribute: "src | a.js", internal_id: 6, },
		{ addEventListener: "load", internal_id: 6, },
		{ appendChild: 6, internal_id: HEAD_ID, },
		{ dispatchEvent: "load", internal_id: 6, },
	];

	var { logs: rActual, log, error, } = collectLogs();

	var win = $DOM( {
		sequentialIds: true,
		log,
		error,
		resources: [
			{ url: "a.js", preloadDelay: 25, preload: true, loadDelay: 50, load: true, },
		],
	} );

	var link = win.document.createElement( "link" );
	link.setAttribute( "rel", "preload" );
	link.setAttribute( "as", "script" );
	link.setAttribute( "href", "a.js" );
	link.addEventListener( "load", function onload(){
		var script = win.document.createElement( "script" );
		script.setAttribute( "src", "a.js" );
		script.addEventListener( "load", function onload(){
			assert.deepEqual( rActual, rExpected, "logs" );
			done();
		} );
		win.document.head.appendChild( script );
	} );
	win.document.head.appendChild( link );
} );

QUnit.test( "preload multiple scripts, then load them (ordered async)", function test(assert){
	var done = assert.async( 3 );
	assert.expect( 2 );

	var rExpected = [
		{ window: WINDOW_ID, },
		{ document: DOCUMENT_ID, },
		{ head: HEAD_ID, },
		{ body: BODY_ID, },
		{ createElement: "link", internal_id: 5, },
		{ setAttribute: "rel | preload", internal_id: 5, },
		{ setAttribute: "as | script", internal_id: 5, },
		{ setAttribute: "href | a.js", internal_id: 5, },
		{ addEventListener: "load", internal_id: 5, },
		{ createElement: "link", internal_id: 6, },
		{ setAttribute: "rel | preload", internal_id: 6, },
		{ setAttribute: "as | script", internal_id: 6, },
		{ setAttribute: "href | b.js", internal_id: 6, },
		{ addEventListener: "load", internal_id: 6, },
		{ createElement: "link", internal_id: 7, },
		{ setAttribute: "rel | preload", internal_id: 7, },
		{ setAttribute: "as | script", internal_id: 7, },
		{ setAttribute: "href | c.js", internal_id: 7, },
		{ addEventListener: "load", internal_id: 7, },
		{ appendChild: 5, internal_id: HEAD_ID, },
		{ appendChild: 6, internal_id: HEAD_ID, },
		{ appendChild: 7, internal_id: HEAD_ID, },
		{ dispatchEvent: "DOMContentLoaded", internal_id: DOCUMENT_ID, },
		{ dispatchEvent: "load", internal_id: WINDOW_ID, },
		{ dispatchEvent: "load", internal_id: 6, },
		{ dispatchEvent: "load", internal_id: 7, },
		{ dispatchEvent: "load", internal_id: 5, },
		{ createElement: "script", internal_id: 8, },
		{ setAttribute: "src | a.js", internal_id: 8, },
		{ addEventListener: "load", internal_id: 8, },
		{ createElement: "script", internal_id: 9, },
		{ setAttribute: "src | b.js", internal_id: 9, },
		{ addEventListener: "load", internal_id: 9, },
		{ createElement: "script", internal_id: 10, },
		{ setAttribute: "src | c.js", internal_id: 10, },
		{ addEventListener: "load", internal_id: 10, },
		{ appendChild: 8, internal_id: HEAD_ID, },
		{ appendChild: 9, internal_id: HEAD_ID, },
		{ appendChild: 10, internal_id: HEAD_ID, },
		{ updateExecQueue: "c.js", internal_id: 10, },
		{ updateExecQueue: "a.js", internal_id: 8, },
		{ dispatchEvent: "load", internal_id: 8, },
		{ updateExecQueue: "b.js", internal_id: 9, },
		{ dispatchEvent: "load", internal_id: 9, },
		{ dispatchEvent: "load", internal_id: 10, },
	];
	var pExpected = ["a.js","b.js","c.js",];

	var { logs: rActual, log, error, } = collectLogs();

	var win = $DOM( {
		sequentialIds: true,
		log,
		error,
		resources: [
			{ url: "a.js", preloadDelay: 40, preload: true, loadDelay: 20, load: true, },
			{ url: "b.js", preloadDelay: 10, preload: true, loadDelay: 30, load: true, },
			{ url: "c.js", preloadDelay: 25, preload: true, loadDelay: 10, load: true, },
		],
	} );

	preloadScripts();


	// ***************************************

	function preloadScripts() {
		var preloadCount = 0;

		var link1 = win.document.createElement( "link" );
		link1.setAttribute( "rel", "preload" );
		link1.setAttribute( "as", "script" );
		link1.setAttribute( "href", "a.js" );
		link1.addEventListener( "load", function onload(){
			preloadCount++;
			if (preloadCount == 3) loadScripts();
		} );

		var link2 = win.document.createElement( "link" );
		link2.setAttribute( "rel", "preload" );
		link2.setAttribute( "as", "script" );
		link2.setAttribute( "href", "b.js" );
		link2.addEventListener( "load", function onload(){
			preloadCount++;
			if (preloadCount == 3) loadScripts();
		} );

		var link3 = win.document.createElement( "link" );
		link3.setAttribute( "rel", "preload" );
		link3.setAttribute( "as", "script" );
		link3.setAttribute( "href", "c.js" );
		link3.addEventListener( "load", function onload(){
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
		script1.async = false;
		script1.addEventListener( "load", done );

		var script2 = win.document.createElement( "script" );
		script2.setAttribute( "src", "b.js" );
		script2.async = false;
		script2.addEventListener( "load", done );

		var script3 = win.document.createElement( "script" );
		script3.setAttribute( "src", "c.js" );
		script3.async = false;
		script3.addEventListener( "load", function onload(){
			var pActual =
				win.performance.getEntriesByName( "a.js" )
				.concat(
					win.performance.getEntriesByName( "b.js" ),
					win.performance.getEntriesByName( "c.js" )
				);

			assert.deepEqual( rActual, rExpected, "logs" );
			assert.deepEqual( pActual, pExpected, "performance entries" );
			done();
		} );

		win.document.head.appendChild( script1 );
		win.document.head.appendChild( script2 );
		win.document.head.appendChild( script3 );
	}
} );

// probably not running in the browser?
if (typeof window == "undefined" || Function("return this")() !== window || !window.document) {
	QUnit.test( "location (default); non-browser", function test(assert){
		var rExpected = {
			href: "https://some.thing/else",
			protocol: "https:",
			pathname: "/else",
			port: "",
			host: "some.thing",
			hostname: "some.thing",
			hash: "",
			search: "",
			origin: "https://some.thing",
		};
		var pExpected = "https://some.thing/else";
		var qExpected = "https://some.thing/else";
		var tExpected = "https://some.thing/else";
		var sExpected = "https://some.thing/else";
		var uExpected = "https://some.thing/else";

		var win = $DOM( {
			log: function log(){},
			error: function error(){},
		} );

		var rActual = JSON.parse( JSON.stringify( win.location ) );
		var pActual = win.location.href;
		var qActual = win.location.href.toString();
		var tActual = win.location.toString();
		var sActual = "" + win.location;
		var uActual = win.document.baseURI;

		assert.expect( 6 );
		assert.deepEqual( rActual, rExpected, "location object" );
		assert.strictEqual( pActual, pExpected, "location.href" );
		assert.strictEqual( qActual, qExpected, "location.href.toString()" );
		assert.strictEqual( tActual, tExpected, "location.toString()" );
		assert.strictEqual( sActual, sExpected, "location + ''" );
		assert.strictEqual( uActual, uExpected, "baseURI default" );
	} );

	QUnit.test( "location (changed); non-browser", function test(assert){
		var rExpected = {
			href: "http://user1:pw1@some.tld:8080/foo/bar?bam=baz#haha",
			protocol: "http:",
			pathname: "/foo/bar",
			port: "8080",
			host: "some.tld:8080",
			hostname: "some.tld",
			hash: "#haha",
			search: "?bam=baz",
			origin: "http://some.tld:8080",
			username: "user1",
			password: "pw1",
		};
		var pExpected = {
			href: "https://some.thing/better",
			protocol: "https:",
			pathname: "/better",
			port: "",
			host: "some.thing",
			hostname: "some.thing",
			hash: "",
			search: "",
			origin: "https://some.thing",
		};
		var qExpected = "http://user1:pw1@some.tld:8080/foo/bar?bam=baz#haha";
		var tExpected = "https://a.tld/funny";
		var sExpected = "http://some.tld/foo/bar";
		var uExpected = "https://other.tld";
		var mExpected = "http://user1:pw1@some.tld:8080/foo/bar?bam=baz#haha";

		var win = $DOM( {
			replaceGlobals: true,
			log: function log(){},
			error: function error(){},
			location: "http://user1:pw1@some.tld:8080/foo/bar?bam=baz#haha",
		} );
		win.location.reload();

		var rActual = JSON.parse( JSON.stringify( win.document.location ) );

		win.location = "https://some.thing/better";
		var pActual = JSON.parse( JSON.stringify( win.location ) );

		global.location = "http://user1:pw1@some.tld:8080/foo/bar?bam=baz#haha";
		var qActual = win.location.href.toString();

		document.location = "https://a.tld/funny";
		var tActual = win.location.href.toString();

		win.location.assign( "http://some.tld/foo/bar" );
		var sActual = win.location.href.toString();

		win.location.replace( "https://other.tld" );
		var uActual = win.location.href.toString();
		var mActual = win.document.baseURI;

		$DOM.restoreGlobals();

		assert.expect( 7 );
		assert.deepEqual( rActual, rExpected, "location object" );
		assert.deepEqual( pActual, pExpected, "win.location = .." );
		assert.strictEqual( qActual, qExpected, "global.location = .." );
		assert.strictEqual( tActual, tExpected, "document.location = .." );
		assert.strictEqual( sActual, sExpected, "location.assign()" );
		assert.strictEqual( uActual, uExpected, "location.replace()" );
		assert.strictEqual( mActual, mExpected, "baseURI" );
	} );

	QUnit.test( "replace and restore globals; non-browser", function test(assert){
		var globalObj = typeof global != "undefined" ? global : Function( "return this" )();

		var pExpected = [
			globalObj.window,
			globalObj.document,
			globalObj.performance,
			globalObj.Event,
			globalObj.location,
		];

		var win = $DOM( {
			replaceGlobals: true,
			log: function log(){},
			error: function error(){},
		} );

		var rExpected = [
			win,
			win.document,
			win.performance,
			win.Event,
			win.location,
		];

		var rActual = [
			globalObj.window,
			globalObj.document,
			globalObj.performance,
			globalObj.Event,
			globalObj.location,
		];

		$DOM.restoreGlobals();

		var pActual = [
			globalObj.window,
			globalObj.document,
			globalObj.performance,
			globalObj.Event,
			globalObj.location,
		];

		assert.expect( 2 );
		assert.deepEqual( rActual, rExpected, "replaced globals" );
		assert.deepEqual( pActual, pExpected, "restored globals" );
	} );
}
// otherwise, probably running in the browser
else {
	QUnit.test( "replace and restore globals; browser", function test(assert){
		var pExpected = [
			window.document.createElement,
			window.document.createEvent,
			window.document.appendChild,
			window.document.removeChild,
			window.document.getElementsByTagName,
			window.document.head.appendChild,
			window.document.head.removeChild,
			window.document.head.getElementsByTagName,
			window.document.body.appendChild,
			window.document.body.removeChild,
			window.document.body.getElementsByTagName,
			window.performance.getEntriesByName,
			window.Event,
		];

		var win = $DOM( {
			replaceGlobals: true,
			log: function log(){},
			error: function error(){},
		} );

		var rExpected = [
			win.document.createElement,
			win.document.createEvent,
			win.document.appendChild,
			win.document.removeChild,
			win.document.getElementsByTagName,
			win.document.head.appendChild,
			win.document.head.removeChild,
			win.document.head.getElementsByTagName,
			win.document.body.appendChild,
			win.document.body.removeChild,
			win.document.body.getElementsByTagName,
			win.performance.getEntriesByName,
			win.Event,
		];

		var rActual = [
			window.document.createElement,
			window.document.createEvent,
			window.document.appendChild,
			window.document.removeChild,
			window.document.getElementsByTagName,
			window.document.head.appendChild,
			window.document.head.removeChild,
			window.document.head.getElementsByTagName,
			window.document.body.appendChild,
			window.document.body.removeChild,
			window.document.body.getElementsByTagName,
			window.performance.getEntriesByName,
			window.Event,
		];

		// restore original globals
		$DOM.restoreGlobals();

		var pActual = [
			window.document.createElement,
			window.document.createEvent,
			window.document.appendChild,
			window.document.removeChild,
			window.document.getElementsByTagName,
			window.document.head.appendChild,
			window.document.head.removeChild,
			window.document.head.getElementsByTagName,
			window.document.body.appendChild,
			window.document.body.removeChild,
			window.document.body.getElementsByTagName,
			window.performance.getEntriesByName,
			window.Event,
		];

		assert.expect( 2 );
		assert.deepEqual( rActual, rExpected, "replaced globals" );
		assert.deepEqual( pActual, pExpected, "restored globals" );
	} );
}

QUnit.test( "document.readyState", function test(assert){
	var done = assert.async( 6 );
	assert.expect( 5 );

	var rExpected = [
		{ window: WINDOW_ID, },
		{ document: DOCUMENT_ID, },
		{ head: HEAD_ID, },
		{ body: BODY_ID, },
		{ addEventListener: "DOMContentLoaded", internal_id: DOCUMENT_ID, },
		{ addEventListener: "load", internal_id: WINDOW_ID, },
		{ dispatchEvent: "DOMContentLoaded", internal_id: DOCUMENT_ID, },
		{ dispatchEvent: "load", internal_id: WINDOW_ID, },
	];
	var pExpected = [
		{ window: WINDOW_ID, },
		{ document: DOCUMENT_ID, },
		{ head: HEAD_ID, },
		{ body: BODY_ID, },
		{ addEventListener: "DOMContentLoaded", internal_id: WINDOW_ID, },
		{ addEventListener: "load", internal_id: WINDOW_ID, },
		{ dispatchEvent: "load", internal_id: WINDOW_ID, },
	];
	var qExpected = [
		{ window: WINDOW_ID, },
		{ document: DOCUMENT_ID, },
		{ head: HEAD_ID, },
		{ body: BODY_ID, },
		{ addEventListener: "DOMContentLoaded", internal_id: WINDOW_ID, },
		{ addEventListener: "load", internal_id: WINDOW_ID, },
	];
	var tExpected = [
		{ window: WINDOW_ID, },
		{ document: DOCUMENT_ID, },
		{ head: HEAD_ID, },
		{ body: BODY_ID, },
		{ addEventListener: "DOMContentLoaded", internal_id: DOCUMENT_ID, },
		{ addEventListener: "load", internal_id: WINDOW_ID, },
		{ dispatchEvent: "DOMContentLoaded", internal_id: DOCUMENT_ID, },
		{ dispatchEvent: "load", internal_id: WINDOW_ID, },
	];
	var sExpected = "complete";

	var callDone = function callDone(){ done(); };
	var reportError = function reportError(err){ throw err; };

	var { logs: rActual, log: log1, error: error1, } = collectLogs();
	var { logs: pActual, log: log2, error: error2, } = collectLogs();
	var { logs: qActual, log: log3, error: error3, } = collectLogs();
	var { logs: tActual, log: log4, error: error4, } = collectLogs();

	var win1 = $DOM( {
		sequentialIds: true,
		log: log1,
		error: error1,
		docReadyDelay: 30,
	} );
	win1.document.addEventListener( "DOMContentLoaded", callDone );
	win1.addEventListener( "load", callDone );
	win1.onload = function onload(){
		win1.document.readyState = "ignored";
		var sActual = win1.document.readyState;

		assert.deepEqual( rActual, rExpected, "300ms DOMContentLoaded" );
		assert.deepEqual( pActual, pExpected, "invalid delay" );
		assert.deepEqual( qActual, qExpected, "document already complete" );
		assert.deepEqual( tActual, tExpected, "invalid ready-state" );
		assert.strictEqual( sActual, sExpected, "document.readyState" );

		done();
	};

	var win2 = $DOM( {
		sequentialIds: true,
		log: log2,
		error: error2,
		docReadyState: "interactive",
		docReadyDelay: "anything but a number like it should be",
	} );
	win2.addEventListener( "DOMContentLoaded", reportError );
	win2.addEventListener( "load", callDone );

	var win3 = $DOM( {
		sequentialIds: true,
		log: log3,
		error: error3,
		docReadyState: "complete",
	} );
	win3.addEventListener( "DOMContentLoaded", reportError );
	win3.addEventListener( "load", reportError );

	var win4 = $DOM( {
		sequentialIds: true,
		log: log4,
		error: error4,
		docReadyState: "other",
	} );
	win4.document.addEventListener( "DOMContentLoaded", callDone );
	win4.addEventListener( "load", callDone );
} );

QUnit.test( "scripts: initial and API", function test(assert){
	var done = assert.async();
	assert.expect( 1 );

	var rExpected = [
	];

	var { logs: rActual, log, error, } = collectLogs();

	var win = $DOM( {
		sequentialIds: true,
		log,
		error,
		docReadyDelay: 30,
		resources: [
			{ url: "a.js", loadDelay: 50, load: true, },
			{ url: "b.js", loadDelay: 10, load: true, },
			{ url: "c.js", loadDelay: 20, load: true, },
		],
		initialDOM: {
			head: [
				{ tagName: "script", src: "a.js", },
			],
			body: [
				{ tagName: "script", src: "b.js", },
			],
		},
	} );

	var script = win.document.createElement( "script" );
	script.setAttribute( "src", "c.js" );
	win.document.body.appendChild( script );

	win.document.head.childNodes[0].addEventListener( "load", function load(){
		assert.deepEqual( rActual, rExpected, "all scripts" );
		done();
	} );
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
