"use strict";

QUnit.test( "load a script", function test(assert){
	var done = assert.async();
	assert.expect( 1 );

	var { logs, log, error } = collectLogs();

	var win = $DOM( {
		sequentialIds: true,
		log: log,
		error: error,
		resources: [
			{ url: "a.js", preloadDelay: 2, preload: true, loadDelay: 2, load: true },
		],
	} );
	var script = win.document.createElement( "script" );
	script.setAttribute( "src", "a.js" );
	script.addEventListener( "load", function(){
		var rActual = JSON.stringify( logs );

		assert.strictEqual( rActual, rExpected, "logs" );

		done();
	} );
	win.document.head.appendChild( script );

	var rExpected = JSON.stringify( [
		{ window: 4 },
		{ document: 1 },
		{ head: 2 },
		{ body: 3 },
		{ createElement: 'script', internal_id: 5 },
		{ setAttribute: 'src | a.js', internal_id: 5 },
		{ addEventListener: 'load', internal_id: 5 },
		{ appendChild: 5, internal_id: 2 },
		{ dispatchEvent: 'load', internal_id: 5 },
  	] );
} );









function collectLogs() {
	var logs = [];
	return {
		logs,
		log(msg){ logs.push( msg ); },
		error(msg) { logs.push( msg ); },
	};
}

function _hasProp(obj,prop) {
	return Object.hasOwnProperty.call( obj, prop );
}

function _isFunction(v) {
	return typeof v == "function";
}

function _isObject(v) {
	return v && typeof v == "object" && !_isArray( v );
}

function _isArray(v) {
	return Array.isArray( v );
}
