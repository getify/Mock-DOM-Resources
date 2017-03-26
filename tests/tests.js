"use strict";

QUnit.test( "placeholder", function test(assert){
	var rExpected = 1;

	var rActual = 1;

	assert.expect( 1 );
	assert.strictEqual( rActual, rExpected, "placeholder" );
} );





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
