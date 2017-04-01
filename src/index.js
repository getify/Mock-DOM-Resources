(function UMD(name,context,definition){
	/* istanbul ignore next */if (typeof define === "function" && define.amd) { define(definition); }
	/* istanbul ignore next */else if (typeof module !== "undefined" && module.exports) { module.exports = definition(); }
	/* istanbul ignore next */else { context[name] = definition(name,context); }
})("$DOM",this,function DEF(name,context){
	"use strict";

	var global = Function("return this")();

	// default to not overwriting by default
	createMockDOM.replaceGlobals = false;

	return createMockDOM;


	// **************************************

	function createMockDOM(opts) {
		opts = opts ? Object.assign( {}, opts ) : {};
		if (!("relList" in opts)) opts.relList = true;
		if (!("scriptAsync" in opts)) opts.scriptAsync = true;
		if (!("linkPreload" in opts)) opts.linkPreload = true;
		if (!("baseURI" in opts)) opts.baseURI = "";
		if (!("log" in opts)) opts.log = function log(status) { console.log( JSON.stringify( status ) ); }
		if (!("error" in opts)) opts.error = function error(err) { throw err; };
		if (!("resources" in opts)) opts.resources = [];
		if (!("sequentialIds" in opts)) opts.sequentialIds = false;

		// copy resources list and normalize its entries
		opts.resources = opts.resources.map(function fix(resource){
			var newEntry = { url: resource.url };
			if (resource.loaded === true) {
				newEntry.loaded = true;
				newEntry.preload = true;
				newEntry.preloadDelay = 0;
				newEntry.load = true;
				newEntry.loadDelay = 0;
			}
			else {
				if ("preload" in resource) newEntry.preload = resource.preload;
				if ("preloadDelay" in resource) newEntry.preloadDelay = resource.preloadDelay;
				if ("load" in resource) newEntry.load = resource.load;
				if ("loadDelay" in resource) newEntry.loadDelay = resource.loadDelay;
			}
			return newEntry;
		} );

		// populate `opts.performanceEntries`
		var performanceEntries = opts.resources.reduce( function findLoaded(entries,resource){
			if (resource.loaded === true) entries.push( resource.url );
			return entries;
		}, [] );

		// setup Element prototype
		Element.prototype.getElementsByTagName = getElementsByTagName;
		Element.prototype.appendChild = appendChild;
		Element.prototype.removeChild = removeChild;
		Element.prototype.setAttribute = setAttribute;
		Element.prototype.getAttribute = getAttribute;
		Element.prototype.addEventListener = addEventListener;
		Element.prototype.removeEventListener = removeEventListener;
		Element.prototype.dispatchEvent = dispatchEvent;

		var sequentialId = 0;
		var loadQueue = [];
		var silent = true;

		var documentElement = createElement( "document" );
		documentElement.head = createElement( "head" );
		documentElement.body = createElement( "body" );
		documentElement.appendChild( documentElement.head );
		documentElement.appendChild( documentElement.body );
		documentElement.baseURI = opts.baseURI;
		documentElement.createElement = createElement;
		documentElement.createEvent = createEvent;

		var performanceAPI = {
			getEntriesByName: getEntriesByName,
		};

		var mockDOM = createElement( "window" );
		mockDOM.document = documentElement;
		mockDOM.performance = performanceAPI;
		mockDOM.Event = Event;

		silent = false;

		// notify: internal IDs for built-ins
		opts.log( {window: mockDOM._internal_id} );
		opts.log( {document: documentElement._internal_id} );
		opts.log( {head: documentElement.head._internal_id} );
		opts.log( {body: documentElement.body._internal_id} );

		if (createMockDOM.replaceGlobals) {
			global.window = mockDOM;
			global.document = mockDOM.document;
			global.performance = mockDOM.performance;
			global.Event = Event;
			createMockDOM.replaceGlobals = false;
		}

		return mockDOM;


		// **************************************

		// document.createElement(..)
		function createElement(tagName) {
			tagName = tagName.toLowerCase();

			var element = new Element();
			element.tagName = tagName.toUpperCase();

			!silent && opts.log( {createElement: tagName, internal_id: element._internal_id} );

			if (tagName == "script") {
				element.async = !!opts.scriptAsync;
			}
			if (tagName == "link") {
				element.href = "";
			}
			if (/^(?:script|img)$/.test( tagName )) {
				element.src = "";
			}

			return element;
		}

		function Element() {
			this.tagName = null;
			this.parentNode = null;
			this.childNodes = [];
			if (opts.relList) {
				this.relList = {
					supports: supports,
					_parent: this,
				};
			}

			// ************
			if (opts.sequentialIds) {
				this._internal_id = ++sequentialId;
			}
			else {
				this._internal_id = Math.floor( Math.random() * 1E6 );
			}
			this._tagNameNodeLists = {};
			this._eventHandlers = {};
		}

		// Element#getElementsByTagName(..)
		function getElementsByTagName(tagName) {
			this._tagNameNodeLists[tagName] = this._tagNameNodeLists[tagName] || [];
			return this._tagNameNodeLists[tagName];
		}

		// Element#appendChild(..)
		function appendChild(childElement) {
			!silent && opts.log( {appendChild: childElement._internal_id, internal_id: this._internal_id} );

			this.childNodes.push( childElement );
			childElement.parentNode = this;
			updateTagNameNodeLists( childElement );

			if (childElement.tagName.toLowerCase() == "link" && childElement.rel == "preload") {
				var resource = findMatchingOptResource( childElement.href );

				if (resource) {
					fakePreload( resource, childElement );
				}
				else {
					opts.error( new Error( "appendChild: Preload resource not found (" + childElement.href + "; " + childElement._internal_id + ")" ) );
				}
			}
			else if (/^(?:script|link|img)$/i.test( childElement.tagName )) {
				var url = (/^(?:script|img)$/i.test( childElement.tagName )) ?
					childElement.src :
					childElement.href;
				var resource = findMatchingOptResource( url );

				if (resource) {
					// track load-order queue (for ordered-async on scripts)?
					if (opts.scriptAsync && childElement.tagName.toLowerCase() == "script" && childElement.async === false) {
						loadQueue.push( {url: url, element: childElement} );
					}

					fakeLoad( resource, childElement );
				}
				else {
					opts.error( new Error( "appendChild: Load resource not found (" + url + "; " + childElement._internal_id + ")" ) );
				}
			}
			else {
				!silent && opts.error( new Error( "appendChild: Unrecognized tag (" + childElement.tagName + "; " + childElement._internal_id + ")" ) );
			}

			return childElement;
		}

		// Element#removeChild(..)
		function removeChild(childElement) {
			opts.log( {removeChild: childElement._internal_id, internal_id: this._internal_id} );

			var idx = this.childNodes.indexOf( childElement );
			if (idx != -1) {
				this.childNodes.splice( idx, 1 );
			}
			filterTagNameNodeLists( childElement );
			childElement.parentNode = null;

			return childElement;
		}

		// Element#setAttribute(..)
		function setAttribute(attrName,attrValue) {
			opts.log( {setAttribute: attrName + " | " + attrValue, internal_id: this._internal_id} );

			this[attrName] = attrValue;
		}

		// Element#getAttribute(..)
		function getAttribute(attrName) {
			return this[attrName];
		}

		// Element#addEventListener(..)
		function addEventListener(evtName,handler) {
			opts.log( {addEventListener: evtName, internal_id: this._internal_id} );

			this._eventHandlers[evtName] = this._eventHandlers[evtName] || [];
			this._eventHandlers[evtName].push( handler );
		}

		// Element#removeEventListener(..)
		function removeEventListener(evtName,handler) {
			opts.log( {removeEventListener: evtName, internal_id: this._internal_id} );

			if (this._eventHandlers[evtName]) {
				var idx = this._eventHandlers[evtName].indexOf( handler );
				this._eventHandlers[evtName].splice( idx, 1 );
			}
		}

		// Element#dispatchEvent(..)
		function dispatchEvent(evt) {
			opts.log( {dispatchEvent: evt.type, internal_id: this._internal_id} );

			if (evt.type == null) {
				opts.error( new Error( "dispatchEvent: Event not initialized (" + this._internal_id + ")" ) );
				return;
			}

			evt.target = evt.currentTarget = this;

			if (this._eventHandlers[evt.type]) {
				var evtHandlers = this._eventHandlers[evt.type].slice();

				for (var i = 0; i < evtHandlers.length; i++) {
					try { evtHandlers[i].call( this, evt ); } catch (err) {}
				}
			}
		}

		// Element#relList.supports(..)
		function supports(rel) {
			if (rel == "preload" && opts.linkPreload && this._parent.tagName.toLowerCase() == "link") {
				return true;
			}
			return false;
		}

		// performance.getEntriesByName(..)
		function getEntriesByName(url) {
			if (~performanceEntries.indexOf( url )) {
				return [url];
			}
			return [];
		}

		function updateTagNameNodeLists(element) {
			var el = element.parentNode;
			var tagName = element.tagName.toLowerCase();

			var keys = Object.keys( element._tagNameNodeLists );

			// recursively walk up the element tree
			while (el != null) {
				el._tagNameNodeLists[tagName] = el._tagNameNodeLists[tagName] || [];
				if (!~el._tagNameNodeLists[tagName].indexOf( element )) {
					el._tagNameNodeLists[tagName].push( element );
				}

				// merge element's node-lists upward
				for (var i = 0; i < keys.length; i++) {
					el._tagNameNodeLists[keys[i]] = el._tagNameNodeLists[keys[i]] || [];
					for (var j = 0; j < element._tagNameNodeLists[keys[i]].length; j++) {
						if (!~el._tagNameNodeLists[keys[i]].indexOf( element._tagNameNodeLists[keys[i]][j] )) {
							el._tagNameNodeLists[keys[i]].push( element._tagNameNodeLists[keys[i]][j] );
						}
					}
				}

				el = el.parentNode;
			}

		}

		function filterTagNameNodeLists(element) {
			var el = element.parentNode;
			var tagName = element.tagName.toLowerCase();

			// recursively walk up the element tree
			while (el != null) {
				var idx;
				if (el._tagNameNodeLists[tagName] && (idx = el._tagNameNodeLists[tagName].indexOf( element )) != -1) {
					el._tagNameNodeLists[tagName].splice( idx, 1 );
				}
				el = el.parentNode;
			}
		}

		function findMatchingOptResource(url) {
			for (var i = 0; i < opts.resources.length; i++) {
				if (opts.resources[i].url == url) {
					return opts.resources[i];
				}
			}
		}

		function fakePreload(resource,element) {
			setTimeout( function preload(){
				if (resource.preload === true) {
					var evt = new Event( "load" );
				}
				else {
					var evt = new Event( "error" );
				}

				addPerformanceEntry( resource.url );

				element.dispatchEvent( evt );
			}, resource.preloadDelay || 0 );
		}

		function fakeLoad(resource,element) {
			if (resource.load === true) {
				var evt = new Event( "load" );
			}
			else {
				var evt = new Event( "error" );
			}

			setTimeout( function load(){
				// simulating ordered-async for <script> elements?
				if (opts.scriptAsync && element.tagName.toLowerCase() == "script" && element.async === false) {
					updateLoadQueue( resource.url, element, evt );
				}
				else {
					element.dispatchEvent( evt );
				}

				addPerformanceEntry( resource.url );
			}, resource.loadDelay || 0 );
		}

		function Event(type) {
			this.type = type;
			this.name = type;
			this.target = null;
			this.currentTarget = null;
			this.bubbles = false;
			this.cancelable = false;
			this.composed = false;
			this.scoped = false;
			this.defaultPrevented = false;
			this.timestamp = Date.now();
			this.isTrusted = true;
			this.eventPhase = 2; // Event.AT_TARGET
			this.preventDefault = function(){ this.defaultPrevented = true; };
			this.stopPropagation = function(){};
			this.stopImmediatePropagation = function(){};
			this.initEvent = function(type,bubbles,cancelable){
				this.type = this.name = type;
				this.bubbles = bubbles;
				this.cancelable = cancelable;
			};
		}

		function createEvent() {
			return new Event( null );
		}

		// ensures load event order (queue) for ordered-async
		function updateLoadQueue(url,element,evt) {
			var found = false;
			var dispatchReady = true;
			var idx = 0;

			while (loadQueue.length > 0 && idx < loadQueue.length) {
				// update queue item?
				if (loadQueue[idx].url == url && loadQueue[idx].element == element) {
					opts.log( {updateLoadQueue: url, internal_id: element._internal_id} );
					loadQueue[idx].evt = evt;
					found = true;
				}

				if (dispatchReady) {
					var entry = loadQueue[0];

					if (entry.evt) {
						entry.element.dispatchEvent( entry.evt );
						loadQueue.shift();
						// NOTE: since we're shifting off index 0, no need
						// to increment `idx`
					}
					else {
						dispatchReady = false;
						idx++;
					}
				}
				else {
					idx++;
				}
			}

			if (!found) {
				opts.error( new Error( "updateLoadQueue: Entry not found (" + url + "; " + element._internal_id + ")" ) );
			}
		}

		function addPerformanceEntry(url) {
			if (!~performanceEntries.indexOf( url )) {
				performanceEntries.push( url );
			}
		}
	}
});
