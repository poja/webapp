
var UTILS = (function () {

	/**
	 * Check if a given value is a plain Object
	 *
	 * @param  {*}       o Any value to be checked
	 * @return {Boolean}   true if it's an Object
	 */
	function isObject(o) {
		var toString = Object.prototype.toString;
		return (toString.call(o) === toString.call({}));
	}

	/**
	 * AJAX helper function (similar to jQuery, but far from it!)
	 * Credit to Netcraft.
	 *
	 * @param {string} url     URL for the ajax request
	 * @param {Object} options AJAX settings
	 */
	function ajax(url, options) {
		var xhr = new XMLHttpRequest(),
			method = 'GET',
			options = UTILS.isObject(options) ? options : {};

		// Check if "method" was supplied
		if (options.method) {
			method = options.method;
		}

		// Setup the request
		xhr.open(method.toUpperCase(), url);

		xhr.onreadystatechange = function () {
			var status;

			// If request finished
			if (xhr.readyState === 4) {
				status = xhr.status;

				// If response is OK or fetched from cache
				if ((status >= 200 && status < 300) || status === 304) {
					var res = xhr.responseText,
						contentType = xhr.getResponseHeader('Content-Type');

					// If server sent a content type header, handle formats
					if (contentType) {
						// Handle JSON format
						if (contentType === 'text/json' ||
							contentType === 'application/json') {

							// JSON throws an exception on invalid JSON
							try {
								res = JSON.parse(res);
							} catch (err) {
								// Trigger "fail" callback if set
								if (options.fail) {
									options.fail.call(xhr, err);
									return;
								}
							}
						// Handle XML format
						} else if (contentType === 'text/xml' ||
							contentType === 'application/xml') {
							// responseXML returns a document object
							res = xhr.responseXML;

							// if XML was invalid, trigger fail callback
							if (res === null && options.fail) {
								options.fail.call(xhr, 'Bad XML file');
								return;
							}
						}
					}
					// Trigger done callback with the proper response
					if (options.done) {
						options.done.call(xhr, res);
					}
				}
			}
		};
		// Fire the request
		xhr.send(null);
	}


	/** 
	 * Allows iteration over an array-like object
	 *
	 * Using the build in Array.forEach
	 * 
	 * @param {arrayLike} list		A list to iterate over
	 * @param {function} callback	A function to call with every element
	 */
	function forEach(list, callback) {
		Array.prototype.forEach.call(list, callback);
	}

	
	/**
	 * Make an array-like object more powerful
	 * 
	 * Gives it the Array.prototype.
	 */
	function makePowerful(arrayLike) {
		Object.setPrototypeOf(arrayLike, Array.prototype);
		return arrayLike;
	}

	/** 
	 * Checks if the array includes the element
	 *
	 * @return {boolean}
	 */
	function includes(array, element) {
		array.forEach(function (el) {
			if (el == element) return true;
		});
		return false;
	}

	/**
	 * Replaces all occurences of a pattern in a string.
	 *
	 * @param {String} original		The String to make the replacement in
	 * @param {String} target 		The String to replace
	 * @param {String} replacement	The String to replace with
	 * @return {String} A new String, similar to the original except replacements.
 	 */
	function replaceAll(original, target, replacement) {
		return original.split(target).join(replacement);
	}

	return {
		isObject: isObject,
		ajax: ajax,
		forEach: forEach,
		makePowerful: makePowerful,
		includes: includes,
		replaceAll: replaceAll
	};

}());


var templateManager = (function(UTILS, document) {

	var templates = {};

	/**
	 * Identifies all templates in the document, using the template attribute.
	 * Adds them to the templates object, and deletes them from the DOM.
	 */
	function init() {
		var templatedElements = document.querySelectorAll('[template]');
		UTILS.forEach(templatedElements, function (el) {
			var name = el.getAttribute('template');
			templates[name] = el;
			el.remove();
		});
	}

	/**
	 * Creates a DOM element, based on a given template name, and keywords used
	 * inside the template. For example, a keyword 'id' with value 'quick-reports'.
	 * 
	 * @param {String} templateName 	A name of one of the existing templates.
	 * @param {Object} keywords			An object of keywords, i.e. {'id': 'quick-reports'}
	 *
	 * @return {DOMElement} An element that adheres to the given template and keywords.
	 */
	function createElement(templateName, keywords) {
		if (!templateName || !keywords || !templates[templateName])
			return null;
		
		var el = templates[templateName].cloneNode(true);
		for (key in keywords) {
			var value = keywords[key];
			el.innerHTML = UTILS.replaceAll(el.innerHTML, '{{' + key + '}}', value);
		};

		return el;
	}

	init();

	return {
		createElement: createElement
	}

}(UTILS, document));


