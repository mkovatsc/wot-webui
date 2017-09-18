(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.parser = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
/*! https://mths.be/punycode v1.4.1 by @mathias */
;(function(root) {

	/** Detect free variables */
	var freeExports = typeof exports == 'object' && exports &&
		!exports.nodeType && exports;
	var freeModule = typeof module == 'object' && module &&
		!module.nodeType && module;
	var freeGlobal = typeof global == 'object' && global;
	if (
		freeGlobal.global === freeGlobal ||
		freeGlobal.window === freeGlobal ||
		freeGlobal.self === freeGlobal
	) {
		root = freeGlobal;
	}

	/**
	 * The `punycode` object.
	 * @name punycode
	 * @type Object
	 */
	var punycode,

	/** Highest positive signed 32-bit float value */
	maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

	/** Bootstring parameters */
	base = 36,
	tMin = 1,
	tMax = 26,
	skew = 38,
	damp = 700,
	initialBias = 72,
	initialN = 128, // 0x80
	delimiter = '-', // '\x2D'

	/** Regular expressions */
	regexPunycode = /^xn--/,
	regexNonASCII = /[^\x20-\x7E]/, // unprintable ASCII chars + non-ASCII chars
	regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, // RFC 3490 separators

	/** Error messages */
	errors = {
		'overflow': 'Overflow: input needs wider integers to process',
		'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
		'invalid-input': 'Invalid input'
	},

	/** Convenience shortcuts */
	baseMinusTMin = base - tMin,
	floor = Math.floor,
	stringFromCharCode = String.fromCharCode,

	/** Temporary variable */
	key;

	/*--------------------------------------------------------------------------*/

	/**
	 * A generic error utility function.
	 * @private
	 * @param {String} type The error type.
	 * @returns {Error} Throws a `RangeError` with the applicable error message.
	 */
	function error(type) {
		throw new RangeError(errors[type]);
	}

	/**
	 * A generic `Array#map` utility function.
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} callback The function that gets called for every array
	 * item.
	 * @returns {Array} A new array of values returned by the callback function.
	 */
	function map(array, fn) {
		var length = array.length;
		var result = [];
		while (length--) {
			result[length] = fn(array[length]);
		}
		return result;
	}

	/**
	 * A simple `Array#map`-like wrapper to work with domain name strings or email
	 * addresses.
	 * @private
	 * @param {String} domain The domain name or email address.
	 * @param {Function} callback The function that gets called for every
	 * character.
	 * @returns {Array} A new string of characters returned by the callback
	 * function.
	 */
	function mapDomain(string, fn) {
		var parts = string.split('@');
		var result = '';
		if (parts.length > 1) {
			// In email addresses, only the domain name should be punycoded. Leave
			// the local part (i.e. everything up to `@`) intact.
			result = parts[0] + '@';
			string = parts[1];
		}
		// Avoid `split(regex)` for IE8 compatibility. See #17.
		string = string.replace(regexSeparators, '\x2E');
		var labels = string.split('.');
		var encoded = map(labels, fn).join('.');
		return result + encoded;
	}

	/**
	 * Creates an array containing the numeric code points of each Unicode
	 * character in the string. While JavaScript uses UCS-2 internally,
	 * this function will convert a pair of surrogate halves (each of which
	 * UCS-2 exposes as separate characters) into a single code point,
	 * matching UTF-16.
	 * @see `punycode.ucs2.encode`
	 * @see <https://mathiasbynens.be/notes/javascript-encoding>
	 * @memberOf punycode.ucs2
	 * @name decode
	 * @param {String} string The Unicode input string (UCS-2).
	 * @returns {Array} The new array of code points.
	 */
	function ucs2decode(string) {
		var output = [],
		    counter = 0,
		    length = string.length,
		    value,
		    extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	/**
	 * Creates a string based on an array of numeric code points.
	 * @see `punycode.ucs2.decode`
	 * @memberOf punycode.ucs2
	 * @name encode
	 * @param {Array} codePoints The array of numeric code points.
	 * @returns {String} The new Unicode string (UCS-2).
	 */
	function ucs2encode(array) {
		return map(array, function(value) {
			var output = '';
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
			return output;
		}).join('');
	}

	/**
	 * Converts a basic code point into a digit/integer.
	 * @see `digitToBasic()`
	 * @private
	 * @param {Number} codePoint The basic numeric code point value.
	 * @returns {Number} The numeric value of a basic code point (for use in
	 * representing integers) in the range `0` to `base - 1`, or `base` if
	 * the code point does not represent a value.
	 */
	function basicToDigit(codePoint) {
		if (codePoint - 48 < 10) {
			return codePoint - 22;
		}
		if (codePoint - 65 < 26) {
			return codePoint - 65;
		}
		if (codePoint - 97 < 26) {
			return codePoint - 97;
		}
		return base;
	}

	/**
	 * Converts a digit/integer into a basic code point.
	 * @see `basicToDigit()`
	 * @private
	 * @param {Number} digit The numeric value of a basic code point.
	 * @returns {Number} The basic code point whose value (when used for
	 * representing integers) is `digit`, which needs to be in the range
	 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
	 * used; else, the lowercase form is used. The behavior is undefined
	 * if `flag` is non-zero and `digit` has no uppercase form.
	 */
	function digitToBasic(digit, flag) {
		//  0..25 map to ASCII a..z or A..Z
		// 26..35 map to ASCII 0..9
		return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
	}

	/**
	 * Bias adaptation function as per section 3.4 of RFC 3492.
	 * https://tools.ietf.org/html/rfc3492#section-3.4
	 * @private
	 */
	function adapt(delta, numPoints, firstTime) {
		var k = 0;
		delta = firstTime ? floor(delta / damp) : delta >> 1;
		delta += floor(delta / numPoints);
		for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
			delta = floor(delta / baseMinusTMin);
		}
		return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
	}

	/**
	 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The Punycode string of ASCII-only symbols.
	 * @returns {String} The resulting string of Unicode symbols.
	 */
	function decode(input) {
		// Don't use UCS-2
		var output = [],
		    inputLength = input.length,
		    out,
		    i = 0,
		    n = initialN,
		    bias = initialBias,
		    basic,
		    j,
		    index,
		    oldi,
		    w,
		    k,
		    digit,
		    t,
		    /** Cached calculation results */
		    baseMinusT;

		// Handle the basic code points: let `basic` be the number of input code
		// points before the last delimiter, or `0` if there is none, then copy
		// the first basic code points to the output.

		basic = input.lastIndexOf(delimiter);
		if (basic < 0) {
			basic = 0;
		}

		for (j = 0; j < basic; ++j) {
			// if it's not a basic code point
			if (input.charCodeAt(j) >= 0x80) {
				error('not-basic');
			}
			output.push(input.charCodeAt(j));
		}

		// Main decoding loop: start just after the last delimiter if any basic code
		// points were copied; start at the beginning otherwise.

		for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

			// `index` is the index of the next character to be consumed.
			// Decode a generalized variable-length integer into `delta`,
			// which gets added to `i`. The overflow checking is easier
			// if we increase `i` as we go, then subtract off its starting
			// value at the end to obtain `delta`.
			for (oldi = i, w = 1, k = base; /* no condition */; k += base) {

				if (index >= inputLength) {
					error('invalid-input');
				}

				digit = basicToDigit(input.charCodeAt(index++));

				if (digit >= base || digit > floor((maxInt - i) / w)) {
					error('overflow');
				}

				i += digit * w;
				t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

				if (digit < t) {
					break;
				}

				baseMinusT = base - t;
				if (w > floor(maxInt / baseMinusT)) {
					error('overflow');
				}

				w *= baseMinusT;

			}

			out = output.length + 1;
			bias = adapt(i - oldi, out, oldi == 0);

			// `i` was supposed to wrap around from `out` to `0`,
			// incrementing `n` each time, so we'll fix that now:
			if (floor(i / out) > maxInt - n) {
				error('overflow');
			}

			n += floor(i / out);
			i %= out;

			// Insert `n` at position `i` of the output
			output.splice(i++, 0, n);

		}

		return ucs2encode(output);
	}

	/**
	 * Converts a string of Unicode symbols (e.g. a domain name label) to a
	 * Punycode string of ASCII-only symbols.
	 * @memberOf punycode
	 * @param {String} input The string of Unicode symbols.
	 * @returns {String} The resulting Punycode string of ASCII-only symbols.
	 */
	function encode(input) {
		var n,
		    delta,
		    handledCPCount,
		    basicLength,
		    bias,
		    j,
		    m,
		    q,
		    k,
		    t,
		    currentValue,
		    output = [],
		    /** `inputLength` will hold the number of code points in `input`. */
		    inputLength,
		    /** Cached calculation results */
		    handledCPCountPlusOne,
		    baseMinusT,
		    qMinusT;

		// Convert the input in UCS-2 to Unicode
		input = ucs2decode(input);

		// Cache the length
		inputLength = input.length;

		// Initialize the state
		n = initialN;
		delta = 0;
		bias = initialBias;

		// Handle the basic code points
		for (j = 0; j < inputLength; ++j) {
			currentValue = input[j];
			if (currentValue < 0x80) {
				output.push(stringFromCharCode(currentValue));
			}
		}

		handledCPCount = basicLength = output.length;

		// `handledCPCount` is the number of code points that have been handled;
		// `basicLength` is the number of basic code points.

		// Finish the basic string - if it is not empty - with a delimiter
		if (basicLength) {
			output.push(delimiter);
		}

		// Main encoding loop:
		while (handledCPCount < inputLength) {

			// All non-basic code points < n have been handled already. Find the next
			// larger one:
			for (m = maxInt, j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue >= n && currentValue < m) {
					m = currentValue;
				}
			}

			// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
			// but guard against overflow
			handledCPCountPlusOne = handledCPCount + 1;
			if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
				error('overflow');
			}

			delta += (m - n) * handledCPCountPlusOne;
			n = m;

			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];

				if (currentValue < n && ++delta > maxInt) {
					error('overflow');
				}

				if (currentValue == n) {
					// Represent delta as a generalized variable-length integer
					for (q = delta, k = base; /* no condition */; k += base) {
						t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
						if (q < t) {
							break;
						}
						qMinusT = q - t;
						baseMinusT = base - t;
						output.push(
							stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
						);
						q = floor(qMinusT / baseMinusT);
					}

					output.push(stringFromCharCode(digitToBasic(q, 0)));
					bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
					delta = 0;
					++handledCPCount;
				}
			}

			++delta;
			++n;

		}
		return output.join('');
	}

	/**
	 * Converts a Punycode string representing a domain name or an email address
	 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
	 * it doesn't matter if you call it on a string that has already been
	 * converted to Unicode.
	 * @memberOf punycode
	 * @param {String} input The Punycoded domain name or email address to
	 * convert to Unicode.
	 * @returns {String} The Unicode representation of the given Punycode
	 * string.
	 */
	function toUnicode(input) {
		return mapDomain(input, function(string) {
			return regexPunycode.test(string)
				? decode(string.slice(4).toLowerCase())
				: string;
		});
	}

	/**
	 * Converts a Unicode string representing a domain name or an email address to
	 * Punycode. Only the non-ASCII parts of the domain name will be converted,
	 * i.e. it doesn't matter if you call it with a domain that's already in
	 * ASCII.
	 * @memberOf punycode
	 * @param {String} input The domain name or email address to convert, as a
	 * Unicode string.
	 * @returns {String} The Punycode representation of the given domain name or
	 * email address.
	 */
	function toASCII(input) {
		return mapDomain(input, function(string) {
			return regexNonASCII.test(string)
				? 'xn--' + encode(string)
				: string;
		});
	}

	/*--------------------------------------------------------------------------*/

	/** Define the public API */
	punycode = {
		/**
		 * A string representing the current Punycode.js version number.
		 * @memberOf punycode
		 * @type String
		 */
		'version': '1.4.1',
		/**
		 * An object of methods to convert from JavaScript's internal character
		 * representation (UCS-2) to Unicode code points, and back.
		 * @see <https://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode
		 * @type Object
		 */
		'ucs2': {
			'decode': ucs2decode,
			'encode': ucs2encode
		},
		'decode': decode,
		'encode': encode,
		'toASCII': toASCII,
		'toUnicode': toUnicode
	};

	/** Expose `punycode` */
	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define('punycode', function() {
			return punycode;
		});
	} else if (freeExports && freeModule) {
		if (module.exports == freeExports) {
			// in Node.js, io.js, or RingoJS v0.8.0+
			freeModule.exports = punycode;
		} else {
			// in Narwhal or RingoJS v0.7.0-
			for (key in punycode) {
				punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
			}
		}
	} else {
		// in Rhino or a web browser
		root.punycode = punycode;
	}

}(this));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],2:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],3:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};

},{}],4:[function(require,module,exports){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

},{"./decode":2,"./encode":3}],5:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var punycode = require('punycode');
var util = require('./util');

exports.parse = urlParse;
exports.resolve = urlResolve;
exports.resolveObject = urlResolveObject;
exports.format = urlFormat;

exports.Url = Url;

function Url() {
  this.protocol = null;
  this.slashes = null;
  this.auth = null;
  this.host = null;
  this.port = null;
  this.hostname = null;
  this.hash = null;
  this.search = null;
  this.query = null;
  this.pathname = null;
  this.path = null;
  this.href = null;
}

// Reference: RFC 3986, RFC 1808, RFC 2396

// define these here so at least they only have to be
// compiled once on the first module load.
var protocolPattern = /^([a-z0-9.+-]+:)/i,
    portPattern = /:[0-9]*$/,

    // Special case for a simple path URL
    simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,

    // RFC 2396: characters reserved for delimiting URLs.
    // We actually just auto-escape these.
    delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],

    // RFC 2396: characters not allowed for various reasons.
    unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims),

    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
    autoEscape = ['\''].concat(unwise),
    // Characters that are never ever allowed in a hostname.
    // Note that any invalid chars are also handled, but these
    // are the ones that are *expected* to be seen, so we fast-path
    // them.
    nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape),
    hostEndingChars = ['/', '?', '#'],
    hostnameMaxLen = 255,
    hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/,
    hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/,
    // protocols that can allow "unsafe" and "unwise" chars.
    unsafeProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that never have a hostname.
    hostlessProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that always contain a // bit.
    slashedProtocol = {
      'http': true,
      'https': true,
      'ftp': true,
      'gopher': true,
      'file': true,
      'http:': true,
      'https:': true,
      'ftp:': true,
      'gopher:': true,
      'file:': true
    },
    querystring = require('querystring');

function urlParse(url, parseQueryString, slashesDenoteHost) {
  if (url && util.isObject(url) && url instanceof Url) return url;

  var u = new Url;
  u.parse(url, parseQueryString, slashesDenoteHost);
  return u;
}

Url.prototype.parse = function(url, parseQueryString, slashesDenoteHost) {
  if (!util.isString(url)) {
    throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
  }

  // Copy chrome, IE, opera backslash-handling behavior.
  // Back slashes before the query string get converted to forward slashes
  // See: https://code.google.com/p/chromium/issues/detail?id=25916
  var queryIndex = url.indexOf('?'),
      splitter =
          (queryIndex !== -1 && queryIndex < url.indexOf('#')) ? '?' : '#',
      uSplit = url.split(splitter),
      slashRegex = /\\/g;
  uSplit[0] = uSplit[0].replace(slashRegex, '/');
  url = uSplit.join(splitter);

  var rest = url;

  // trim before proceeding.
  // This is to support parse stuff like "  http://foo.com  \n"
  rest = rest.trim();

  if (!slashesDenoteHost && url.split('#').length === 1) {
    // Try fast path regexp
    var simplePath = simplePathPattern.exec(rest);
    if (simplePath) {
      this.path = rest;
      this.href = rest;
      this.pathname = simplePath[1];
      if (simplePath[2]) {
        this.search = simplePath[2];
        if (parseQueryString) {
          this.query = querystring.parse(this.search.substr(1));
        } else {
          this.query = this.search.substr(1);
        }
      } else if (parseQueryString) {
        this.search = '';
        this.query = {};
      }
      return this;
    }
  }

  var proto = protocolPattern.exec(rest);
  if (proto) {
    proto = proto[0];
    var lowerProto = proto.toLowerCase();
    this.protocol = lowerProto;
    rest = rest.substr(proto.length);
  }

  // figure out if it's got a host
  // user@server is *always* interpreted as a hostname, and url
  // resolution will treat //foo/bar as host=foo,path=bar because that's
  // how the browser resolves relative URLs.
  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
    var slashes = rest.substr(0, 2) === '//';
    if (slashes && !(proto && hostlessProtocol[proto])) {
      rest = rest.substr(2);
      this.slashes = true;
    }
  }

  if (!hostlessProtocol[proto] &&
      (slashes || (proto && !slashedProtocol[proto]))) {

    // there's a hostname.
    // the first instance of /, ?, ;, or # ends the host.
    //
    // If there is an @ in the hostname, then non-host chars *are* allowed
    // to the left of the last @ sign, unless some host-ending character
    // comes *before* the @-sign.
    // URLs are obnoxious.
    //
    // ex:
    // http://a@b@c/ => user:a@b host:c
    // http://a@b?@c => user:a host:c path:/?@c

    // v0.12 TODO(isaacs): This is not quite how Chrome does things.
    // Review our test case against browsers more comprehensively.

    // find the first instance of any hostEndingChars
    var hostEnd = -1;
    for (var i = 0; i < hostEndingChars.length; i++) {
      var hec = rest.indexOf(hostEndingChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }

    // at this point, either we have an explicit point where the
    // auth portion cannot go past, or the last @ char is the decider.
    var auth, atSign;
    if (hostEnd === -1) {
      // atSign can be anywhere.
      atSign = rest.lastIndexOf('@');
    } else {
      // atSign must be in auth portion.
      // http://a@b/c@d => host:b auth:a path:/c@d
      atSign = rest.lastIndexOf('@', hostEnd);
    }

    // Now we have a portion which is definitely the auth.
    // Pull that off.
    if (atSign !== -1) {
      auth = rest.slice(0, atSign);
      rest = rest.slice(atSign + 1);
      this.auth = decodeURIComponent(auth);
    }

    // the host is the remaining to the left of the first non-host char
    hostEnd = -1;
    for (var i = 0; i < nonHostChars.length; i++) {
      var hec = rest.indexOf(nonHostChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }
    // if we still have not hit it, then the entire thing is a host.
    if (hostEnd === -1)
      hostEnd = rest.length;

    this.host = rest.slice(0, hostEnd);
    rest = rest.slice(hostEnd);

    // pull out port.
    this.parseHost();

    // we've indicated that there is a hostname,
    // so even if it's empty, it has to be present.
    this.hostname = this.hostname || '';

    // if hostname begins with [ and ends with ]
    // assume that it's an IPv6 address.
    var ipv6Hostname = this.hostname[0] === '[' &&
        this.hostname[this.hostname.length - 1] === ']';

    // validate a little.
    if (!ipv6Hostname) {
      var hostparts = this.hostname.split(/\./);
      for (var i = 0, l = hostparts.length; i < l; i++) {
        var part = hostparts[i];
        if (!part) continue;
        if (!part.match(hostnamePartPattern)) {
          var newpart = '';
          for (var j = 0, k = part.length; j < k; j++) {
            if (part.charCodeAt(j) > 127) {
              // we replace non-ASCII char with a temporary placeholder
              // we need this to make sure size of hostname is not
              // broken by replacing non-ASCII by nothing
              newpart += 'x';
            } else {
              newpart += part[j];
            }
          }
          // we test again with ASCII char only
          if (!newpart.match(hostnamePartPattern)) {
            var validParts = hostparts.slice(0, i);
            var notHost = hostparts.slice(i + 1);
            var bit = part.match(hostnamePartStart);
            if (bit) {
              validParts.push(bit[1]);
              notHost.unshift(bit[2]);
            }
            if (notHost.length) {
              rest = '/' + notHost.join('.') + rest;
            }
            this.hostname = validParts.join('.');
            break;
          }
        }
      }
    }

    if (this.hostname.length > hostnameMaxLen) {
      this.hostname = '';
    } else {
      // hostnames are always lower case.
      this.hostname = this.hostname.toLowerCase();
    }

    if (!ipv6Hostname) {
      // IDNA Support: Returns a punycoded representation of "domain".
      // It only converts parts of the domain name that
      // have non-ASCII characters, i.e. it doesn't matter if
      // you call it with a domain that already is ASCII-only.
      this.hostname = punycode.toASCII(this.hostname);
    }

    var p = this.port ? ':' + this.port : '';
    var h = this.hostname || '';
    this.host = h + p;
    this.href += this.host;

    // strip [ and ] from the hostname
    // the host field still retains them, though
    if (ipv6Hostname) {
      this.hostname = this.hostname.substr(1, this.hostname.length - 2);
      if (rest[0] !== '/') {
        rest = '/' + rest;
      }
    }
  }

  // now rest is set to the post-host stuff.
  // chop off any delim chars.
  if (!unsafeProtocol[lowerProto]) {

    // First, make 100% sure that any "autoEscape" chars get
    // escaped, even if encodeURIComponent doesn't think they
    // need to be.
    for (var i = 0, l = autoEscape.length; i < l; i++) {
      var ae = autoEscape[i];
      if (rest.indexOf(ae) === -1)
        continue;
      var esc = encodeURIComponent(ae);
      if (esc === ae) {
        esc = escape(ae);
      }
      rest = rest.split(ae).join(esc);
    }
  }


  // chop off from the tail first.
  var hash = rest.indexOf('#');
  if (hash !== -1) {
    // got a fragment string.
    this.hash = rest.substr(hash);
    rest = rest.slice(0, hash);
  }
  var qm = rest.indexOf('?');
  if (qm !== -1) {
    this.search = rest.substr(qm);
    this.query = rest.substr(qm + 1);
    if (parseQueryString) {
      this.query = querystring.parse(this.query);
    }
    rest = rest.slice(0, qm);
  } else if (parseQueryString) {
    // no query string, but parseQueryString still requested
    this.search = '';
    this.query = {};
  }
  if (rest) this.pathname = rest;
  if (slashedProtocol[lowerProto] &&
      this.hostname && !this.pathname) {
    this.pathname = '/';
  }

  //to support http.request
  if (this.pathname || this.search) {
    var p = this.pathname || '';
    var s = this.search || '';
    this.path = p + s;
  }

  // finally, reconstruct the href based on what has been validated.
  this.href = this.format();
  return this;
};

// format a parsed object into a url string
function urlFormat(obj) {
  // ensure it's an object, and not a string url.
  // If it's an obj, this is a no-op.
  // this way, you can call url_format() on strings
  // to clean up potentially wonky urls.
  if (util.isString(obj)) obj = urlParse(obj);
  if (!(obj instanceof Url)) return Url.prototype.format.call(obj);
  return obj.format();
}

Url.prototype.format = function() {
  var auth = this.auth || '';
  if (auth) {
    auth = encodeURIComponent(auth);
    auth = auth.replace(/%3A/i, ':');
    auth += '@';
  }

  var protocol = this.protocol || '',
      pathname = this.pathname || '',
      hash = this.hash || '',
      host = false,
      query = '';

  if (this.host) {
    host = auth + this.host;
  } else if (this.hostname) {
    host = auth + (this.hostname.indexOf(':') === -1 ?
        this.hostname :
        '[' + this.hostname + ']');
    if (this.port) {
      host += ':' + this.port;
    }
  }

  if (this.query &&
      util.isObject(this.query) &&
      Object.keys(this.query).length) {
    query = querystring.stringify(this.query);
  }

  var search = this.search || (query && ('?' + query)) || '';

  if (protocol && protocol.substr(-1) !== ':') protocol += ':';

  // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
  // unless they had them to begin with.
  if (this.slashes ||
      (!protocol || slashedProtocol[protocol]) && host !== false) {
    host = '//' + (host || '');
    if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
  } else if (!host) {
    host = '';
  }

  if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
  if (search && search.charAt(0) !== '?') search = '?' + search;

  pathname = pathname.replace(/[?#]/g, function(match) {
    return encodeURIComponent(match);
  });
  search = search.replace('#', '%23');

  return protocol + host + pathname + search + hash;
};

function urlResolve(source, relative) {
  return urlParse(source, false, true).resolve(relative);
}

Url.prototype.resolve = function(relative) {
  return this.resolveObject(urlParse(relative, false, true)).format();
};

function urlResolveObject(source, relative) {
  if (!source) return relative;
  return urlParse(source, false, true).resolveObject(relative);
}

Url.prototype.resolveObject = function(relative) {
  if (util.isString(relative)) {
    var rel = new Url();
    rel.parse(relative, false, true);
    relative = rel;
  }

  var result = new Url();
  var tkeys = Object.keys(this);
  for (var tk = 0; tk < tkeys.length; tk++) {
    var tkey = tkeys[tk];
    result[tkey] = this[tkey];
  }

  // hash is always overridden, no matter what.
  // even href="" will remove it.
  result.hash = relative.hash;

  // if the relative url is empty, then there's nothing left to do here.
  if (relative.href === '') {
    result.href = result.format();
    return result;
  }

  // hrefs like //foo/bar always cut to the protocol.
  if (relative.slashes && !relative.protocol) {
    // take everything except the protocol from relative
    var rkeys = Object.keys(relative);
    for (var rk = 0; rk < rkeys.length; rk++) {
      var rkey = rkeys[rk];
      if (rkey !== 'protocol')
        result[rkey] = relative[rkey];
    }

    //urlParse appends trailing / to urls like http://www.example.com
    if (slashedProtocol[result.protocol] &&
        result.hostname && !result.pathname) {
      result.path = result.pathname = '/';
    }

    result.href = result.format();
    return result;
  }

  if (relative.protocol && relative.protocol !== result.protocol) {
    // if it's a known url protocol, then changing
    // the protocol does weird things
    // first, if it's not file:, then we MUST have a host,
    // and if there was a path
    // to begin with, then we MUST have a path.
    // if it is file:, then the host is dropped,
    // because that's known to be hostless.
    // anything else is assumed to be absolute.
    if (!slashedProtocol[relative.protocol]) {
      var keys = Object.keys(relative);
      for (var v = 0; v < keys.length; v++) {
        var k = keys[v];
        result[k] = relative[k];
      }
      result.href = result.format();
      return result;
    }

    result.protocol = relative.protocol;
    if (!relative.host && !hostlessProtocol[relative.protocol]) {
      var relPath = (relative.pathname || '').split('/');
      while (relPath.length && !(relative.host = relPath.shift()));
      if (!relative.host) relative.host = '';
      if (!relative.hostname) relative.hostname = '';
      if (relPath[0] !== '') relPath.unshift('');
      if (relPath.length < 2) relPath.unshift('');
      result.pathname = relPath.join('/');
    } else {
      result.pathname = relative.pathname;
    }
    result.search = relative.search;
    result.query = relative.query;
    result.host = relative.host || '';
    result.auth = relative.auth;
    result.hostname = relative.hostname || relative.host;
    result.port = relative.port;
    // to support http.request
    if (result.pathname || result.search) {
      var p = result.pathname || '';
      var s = result.search || '';
      result.path = p + s;
    }
    result.slashes = result.slashes || relative.slashes;
    result.href = result.format();
    return result;
  }

  var isSourceAbs = (result.pathname && result.pathname.charAt(0) === '/'),
      isRelAbs = (
          relative.host ||
          relative.pathname && relative.pathname.charAt(0) === '/'
      ),
      mustEndAbs = (isRelAbs || isSourceAbs ||
                    (result.host && relative.pathname)),
      removeAllDots = mustEndAbs,
      srcPath = result.pathname && result.pathname.split('/') || [],
      relPath = relative.pathname && relative.pathname.split('/') || [],
      psychotic = result.protocol && !slashedProtocol[result.protocol];

  // if the url is a non-slashed url, then relative
  // links like ../.. should be able
  // to crawl up to the hostname, as well.  This is strange.
  // result.protocol has already been set by now.
  // Later on, put the first path part into the host field.
  if (psychotic) {
    result.hostname = '';
    result.port = null;
    if (result.host) {
      if (srcPath[0] === '') srcPath[0] = result.host;
      else srcPath.unshift(result.host);
    }
    result.host = '';
    if (relative.protocol) {
      relative.hostname = null;
      relative.port = null;
      if (relative.host) {
        if (relPath[0] === '') relPath[0] = relative.host;
        else relPath.unshift(relative.host);
      }
      relative.host = null;
    }
    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
  }

  if (isRelAbs) {
    // it's absolute.
    result.host = (relative.host || relative.host === '') ?
                  relative.host : result.host;
    result.hostname = (relative.hostname || relative.hostname === '') ?
                      relative.hostname : result.hostname;
    result.search = relative.search;
    result.query = relative.query;
    srcPath = relPath;
    // fall through to the dot-handling below.
  } else if (relPath.length) {
    // it's relative
    // throw away the existing file, and take the new path instead.
    if (!srcPath) srcPath = [];
    srcPath.pop();
    srcPath = srcPath.concat(relPath);
    result.search = relative.search;
    result.query = relative.query;
  } else if (!util.isNullOrUndefined(relative.search)) {
    // just pull out the search.
    // like href='?foo'.
    // Put this after the other two cases because it simplifies the booleans
    if (psychotic) {
      result.hostname = result.host = srcPath.shift();
      //occationaly the auth can get stuck only in host
      //this especially happens in cases like
      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
      var authInHost = result.host && result.host.indexOf('@') > 0 ?
                       result.host.split('@') : false;
      if (authInHost) {
        result.auth = authInHost.shift();
        result.host = result.hostname = authInHost.shift();
      }
    }
    result.search = relative.search;
    result.query = relative.query;
    //to support http.request
    if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
      result.path = (result.pathname ? result.pathname : '') +
                    (result.search ? result.search : '');
    }
    result.href = result.format();
    return result;
  }

  if (!srcPath.length) {
    // no path at all.  easy.
    // we've already handled the other stuff above.
    result.pathname = null;
    //to support http.request
    if (result.search) {
      result.path = '/' + result.search;
    } else {
      result.path = null;
    }
    result.href = result.format();
    return result;
  }

  // if a url ENDs in . or .., then it must get a trailing slash.
  // however, if it ends in anything else non-slashy,
  // then it must NOT get a trailing slash.
  var last = srcPath.slice(-1)[0];
  var hasTrailingSlash = (
      (result.host || relative.host || srcPath.length > 1) &&
      (last === '.' || last === '..') || last === '');

  // strip single dots, resolve double dots to parent dir
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = srcPath.length; i >= 0; i--) {
    last = srcPath[i];
    if (last === '.') {
      srcPath.splice(i, 1);
    } else if (last === '..') {
      srcPath.splice(i, 1);
      up++;
    } else if (up) {
      srcPath.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (!mustEndAbs && !removeAllDots) {
    for (; up--; up) {
      srcPath.unshift('..');
    }
  }

  if (mustEndAbs && srcPath[0] !== '' &&
      (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
    srcPath.unshift('');
  }

  if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
    srcPath.push('');
  }

  var isAbsolute = srcPath[0] === '' ||
      (srcPath[0] && srcPath[0].charAt(0) === '/');

  // put the host back
  if (psychotic) {
    result.hostname = result.host = isAbsolute ? '' :
                                    srcPath.length ? srcPath.shift() : '';
    //occationaly the auth can get stuck only in host
    //this especially happens in cases like
    //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
    var authInHost = result.host && result.host.indexOf('@') > 0 ?
                     result.host.split('@') : false;
    if (authInHost) {
      result.auth = authInHost.shift();
      result.host = result.hostname = authInHost.shift();
    }
  }

  mustEndAbs = mustEndAbs || (result.host && srcPath.length);

  if (mustEndAbs && !isAbsolute) {
    srcPath.unshift('');
  }

  if (!srcPath.length) {
    result.pathname = null;
    result.path = null;
  } else {
    result.pathname = srcPath.join('/');
  }

  //to support request.http
  if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
    result.path = (result.pathname ? result.pathname : '') +
                  (result.search ? result.search : '');
  }
  result.auth = relative.auth || result.auth;
  result.slashes = result.slashes || relative.slashes;
  result.href = result.format();
  return result;
};

Url.prototype.parseHost = function() {
  var host = this.host;
  var port = portPattern.exec(host);
  if (port) {
    port = port[0];
    if (port !== ':') {
      this.port = port.substr(1);
    }
    host = host.substr(0, host.length - port.length);
  }
  if (host) this.hostname = host;
};

},{"./util":6,"punycode":1,"querystring":4}],6:[function(require,module,exports){
'use strict';

module.exports = {
  isString: function(arg) {
    return typeof(arg) === 'string';
  },
  isObject: function(arg) {
    return typeof(arg) === 'object' && arg !== null;
  },
  isNull: function(arg) {
    return arg === null;
  },
  isNullOrUndefined: function(arg) {
    return arg == null;
  }
};

},{}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var thing_description_1 = require("./thing-description");
var TD = require("./thing-description");
var typedjson_npm_1 = require("typedjson-npm");
function parseTDObject(td) {
    return parseTDString(typedjson_npm_1.TypedJSON.stringify(td, { enableTypeHints: false }));
}
exports.parseTDObject = parseTDObject;
function parseTDString(json) {
    console.log("parseTDString() parsing\n```\n" + json + "\n```");
    var td = typedjson_npm_1.TypedJSON.parse(json, thing_description_1.default);
    console.log("parseTDString() found " + td.interaction.length + " Interaction" + (td.interaction.length === 1 ? '' : 's'));
    for (var _i = 0, _a = td.interaction; _i < _a.length; _i++) {
        var interaction = _a[_i];
        if (interaction.semanticTypes.indexOf(TD.InteractionPattern.Property.toString()) !== -1) {
            console.log(" * Property '" + interaction.name + "'");
            interaction.pattern = TD.InteractionPattern.Property;
        }
        else if (interaction.semanticTypes.indexOf(TD.InteractionPattern.Action.toString()) !== -1) {
            console.log(" * Action '" + interaction.name + "'");
            interaction.pattern = TD.InteractionPattern.Action;
        }
        else if (interaction.semanticTypes.indexOf(TD.InteractionPattern.Event.toString()) !== -1) {
            console.log(" * Event '" + interaction.name + "'");
            interaction.pattern = TD.InteractionPattern.Event;
        }
        else {
            console.error("parseTDString() found unknown Interaction pattern '" + interaction.semanticTypes + "'");
        }
        if (td.base !== undefined) {
            console.log("parseTDString() applying base '" + td.base + "' to href '" + interaction.link[0].href + "'");
            var href = interaction.link[0].href;
            var url = require('url');
            var n = td.base.indexOf(':');
            var pr = td.base.substr(0, n + 1);
            var uriTemp = td.base.replace(pr, 'http:');
            uriTemp = url.resolve(uriTemp, href);
            uriTemp = uriTemp.replace('http:', pr);
            interaction.link[0].href = uriTemp;
        }
    }
    return td;
}
exports.parseTDString = parseTDString;
function serializeTD(td) {
    typedjson_npm_1.TypedJSON.config({ "enableTypeHints": false });
    var json = typedjson_npm_1.TypedJSON.stringify(td);
    var raw = JSON.parse(json);
    if (td.base === null || td.base === undefined) {
        delete raw.base;
    }
    for (var _i = 0, _a = raw.interaction; _i < _a.length; _i++) {
        var interaction = _a[_i];
        if (interaction.inputData === null) {
            delete interaction.inputData;
        }
        if (interaction.outputData === null) {
            delete interaction.outputData;
        }
        if (interaction.writable === null) {
            delete interaction.writable;
        }
        if (interaction.outputData && interaction.outputData.required !== undefined) {
            console.log("### HOTFIX for TypedJSON ###");
            var reqs = [];
            for (var req in interaction.outputData.required)
                reqs.push(interaction.outputData.required[req]);
            interaction.outputData.required = reqs;
        }
    }
    json = JSON.stringify(raw);
    console.log("serializeTD() produced\n```\n" + json + "\n```");
    return json;
}
exports.serializeTD = serializeTD;

},{"./thing-description":8,"typedjson-npm":9,"url":5}],8:[function(require,module,exports){
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var typedjson_npm_1 = require("typedjson-npm");
var InteractionPattern;
(function (InteractionPattern) {
    InteractionPattern[InteractionPattern["Property"] = 'Property'] = "Property";
    InteractionPattern[InteractionPattern["Action"] = 'Action'] = "Action";
    InteractionPattern[InteractionPattern["Event"] = 'Event'] = "Event";
})(InteractionPattern = exports.InteractionPattern || (exports.InteractionPattern = {}));
var InteractionLink = (function () {
    function InteractionLink() {
    }
    return InteractionLink;
}());
__decorate([
    typedjson_npm_1.JsonMember({ isRequired: true, type: String })
], InteractionLink.prototype, "href", void 0);
__decorate([
    typedjson_npm_1.JsonMember({ isRequired: true, type: String })
], InteractionLink.prototype, "mediaType", void 0);
InteractionLink = __decorate([
    typedjson_npm_1.JsonObject()
], InteractionLink);
exports.InteractionLink = InteractionLink;
var Interaction = (function () {
    function Interaction() {
        this.semanticTypes = [];
        this.link = [];
    }
    return Interaction;
}());
__decorate([
    typedjson_npm_1.JsonMember({ name: '@type', isRequired: true, elements: String })
], Interaction.prototype, "semanticTypes", void 0);
__decorate([
    typedjson_npm_1.JsonMember({ isRequired: true, type: String })
], Interaction.prototype, "name", void 0);
__decorate([
    typedjson_npm_1.JsonMember({ isRequired: true, elements: InteractionLink })
], Interaction.prototype, "link", void 0);
__decorate([
    typedjson_npm_1.JsonMember({ type: Boolean })
], Interaction.prototype, "writable", void 0);
__decorate([
    typedjson_npm_1.JsonMember({ type: Object })
], Interaction.prototype, "inputData", void 0);
__decorate([
    typedjson_npm_1.JsonMember({ type: Object })
], Interaction.prototype, "outputData", void 0);
Interaction = __decorate([
    typedjson_npm_1.JsonObject({ knownTypes: [InteractionLink] })
], Interaction);
exports.Interaction = Interaction;
var ThingDescription = (function () {
    function ThingDescription() {
        this.context = ['http://w3c.github.io/wot/w3c-wot-td-context.jsonld'];
        this.semanticType = ['Thing'];
        this.interaction = [];
    }
    return ThingDescription;
}());
__decorate([
    typedjson_npm_1.JsonMember({ name: '@type', elements: String })
], ThingDescription.prototype, "semanticType", void 0);
__decorate([
    typedjson_npm_1.JsonMember({ isRequired: true, type: String })
], ThingDescription.prototype, "name", void 0);
__decorate([
    typedjson_npm_1.JsonMember({ type: String })
], ThingDescription.prototype, "base", void 0);
__decorate([
    typedjson_npm_1.JsonMember({ isRequired: true, elements: Interaction })
], ThingDescription.prototype, "interaction", void 0);
__decorate([
    typedjson_npm_1.JsonMember({ name: '@context', elements: String })
], ThingDescription.prototype, "context", void 0);
ThingDescription = __decorate([
    typedjson_npm_1.JsonObject({ knownTypes: [Interaction] })
], ThingDescription);
exports.default = ThingDescription;

},{"typedjson-npm":9}],9:[function(require,module,exports){
/*!
TypedJSON v0.2.0 - https://github.com/JohnWhiteTB/TypedJSON

Typed JSON parsing and serializing that preserves type information. Parse JSON into actual class instances. Recommended (but not required)
to be used with reflect-metadata (global installation): https://github.com/rbuckton/ReflectDecorators.


The MIT License (MIT)
Copyright (c) 2016 John White

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
(function (factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    var METADATA_FIELD_KEY = "__typedJsonJsonObjectMetadataInformation__";
    var JSON;
    if (!JSON) {
        JSON = {
            parse: function (sJSON) {
                var returnval = sJSON;
                if (typeof returnval === 'object') {
                    return returnval;
                }
                else {
                    return eval('(' + sJSON + ')');
                }
            },
            stringify: (function () {
                var toString = Object.prototype.toString;
                var isArray = Array.isArray || function (a) { return toString.call(a) === '[object Array]'; };
                var escMap = { '"': '\\"', '\\': '\\\\', '\b': '\\b', '\f': '\\f', '\n': '\\n', '\r': '\\r', '\t': '\\t' };
                var escFunc = function (m) { return escMap[m] || '\\u' + (m.charCodeAt(0) + 0x10000).toString(16).substr(1); };
                var escRE = /[\\"\u0000-\u001F\u2028\u2029]/g;
                return function stringify(value) {
                    if (value == null) {
                        return 'null';
                    }
                    else if (typeof value === 'number') {
                        return isFinite(value) ? value.toString() : 'null';
                    }
                    else if (typeof value === 'boolean') {
                        return value.toString();
                    }
                    else if (typeof value === 'object') {
                        if (typeof value.toJSON === 'function') {
                            return stringify(value.toJSON());
                        }
                        else if (isArray(value)) {
                            var res = '[';
                            for (var i = 0; i < value.length; i++)
                                res += (i ? ', ' : '') + stringify(value[i]);
                            return res + ']';
                        }
                        else if (toString.call(value) === '[object Object]') {
                            var tmp = [];
                            for (var k in value) {
                                if (value.hasOwnProperty(k))
                                    tmp.push(stringify(k) + ': ' + stringify(value[k]));
                            }
                            return '{' + tmp.join(', ') + '}';
                        }
                    }
                    return '"' + value.toString().replace(escRE, escFunc) + '"';
                };
            })()
        };
    }
    var Helpers;
    (function (Helpers) {
        function assign(target) {
            var sources = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                sources[_i - 1] = arguments[_i];
            }
            var output;
            var source;
            if (target === undefined || target === null) {
                throw new TypeError("Cannot convert undefined or null to object");
            }
            output = Object(target);
            for (var i = 1; i < arguments.length; i++) {
                source = arguments[i];
                if (source !== undefined && source !== null) {
                    for (var nextKey in source) {
                        if (source.hasOwnProperty(nextKey)) {
                            output[nextKey] = source[nextKey];
                        }
                    }
                }
            }
            return output;
        }
        Helpers.assign = assign;
        function error(message) {
            var optionalParams = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                optionalParams[_i - 1] = arguments[_i];
            }
            if (typeof console === "object" && typeof console.error === "function") {
                console.error.apply(console, [message].concat(optionalParams));
            }
            else if (typeof console === "object" && typeof console.log === "function") {
                console.log.apply(console, ["ERROR: " + message].concat(optionalParams));
            }
        }
        Helpers.error = error;
        function getClassName(target) {
            var targetType;
            if (typeof target === "function") {
                targetType = target;
            }
            else if (typeof target === "object") {
                targetType = target.constructor;
            }
            if (!targetType) {
                return "undefined";
            }
            if ("name" in targetType && typeof targetType.name === "string") {
                return targetType.name;
            }
            else {
                return targetType.toString().match(/function (\w*)/)[1];
            }
        }
        Helpers.getClassName = getClassName;
        function getDefaultValue(type) {
            switch (type) {
                case Number:
                    return 0;
                case String:
                    return "";
                case Boolean:
                    return false;
                case Array:
                    return [];
                default:
                    return null;
            }
        }
        Helpers.getDefaultValue = getDefaultValue;
        function getPropertyDisplayName(target, propertyKey) {
            return getClassName(target) + "." + propertyKey.toString();
        }
        Helpers.getPropertyDisplayName = getPropertyDisplayName;
        function isArray(object) {
            if (typeof Array.isArray === "function") {
                return Array.isArray(object);
            }
            else {
                if (object instanceof Array) {
                    return true;
                }
                else {
                    return false;
                }
            }
        }
        Helpers.isArray = isArray;
        function isPrimitive(obj) {
            switch (typeof obj) {
                case "string":
                case "number":
                case "boolean":
                    return true;
            }
            if (obj instanceof String || obj === String ||
                obj instanceof Number || obj === Number ||
                obj instanceof Boolean || obj === Boolean) {
                return true;
            }
            return false;
        }
        Helpers.isPrimitive = isPrimitive;
        function isReservedMemberName(name) {
            return (name === METADATA_FIELD_KEY);
        }
        Helpers.isReservedMemberName = isReservedMemberName;
        function isSubtypeOf(A, B) {
            var aPrototype = A.prototype;
            if (A === B) {
                return true;
            }
            while (aPrototype) {
                if (aPrototype instanceof B) {
                    return true;
                }
                aPrototype = aPrototype.prototype;
            }
            return false;
        }
        Helpers.isSubtypeOf = isSubtypeOf;
        function log(message) {
            var optionalParams = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                optionalParams[_i - 1] = arguments[_i];
            }
            if (typeof console === "object" && typeof console.log === "function") {
                console.log.apply(console, [message].concat(optionalParams));
            }
        }
        Helpers.log = log;
        function merge(target) {
            var sources = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                sources[_i - 1] = arguments[_i];
            }
            var output;
            var source;
            if (target === undefined || target === null) {
                throw new TypeError("Cannot convert undefined or null to object");
            }
            output = {};
            Object.keys(target).forEach(function (nextKey) {
                output[nextKey] = target[nextKey];
            });
            for (var i = 1; i < arguments.length; i++) {
                source = arguments[i];
                if (source !== undefined && source !== null) {
                    for (var nextKey in source) {
                        if (source.hasOwnProperty(nextKey)) {
                            output[nextKey] = source[nextKey];
                        }
                    }
                }
            }
            return output;
        }
        Helpers.merge = merge;
        function valueIsDefined(value) {
            if (typeof value === "undefined" || value === null) {
                return false;
            }
            else {
                return true;
            }
        }
        Helpers.valueIsDefined = valueIsDefined;
        function warn(message) {
            var optionalParams = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                optionalParams[_i - 1] = arguments[_i];
            }
            if (typeof console === "object" && typeof console.warn === "function") {
                console.warn.apply(console, [message].concat(optionalParams));
            }
            else if (typeof console === "object" && typeof console.log === "function") {
                console.log.apply(console, ["WARNING: " + message].concat(optionalParams));
            }
        }
        Helpers.warn = warn;
    })(Helpers || (Helpers = {}));
    var JsonMemberMetadata = (function () {
        function JsonMemberMetadata() {
        }
        return JsonMemberMetadata;
    }());
    var JsonObjectMetadata = (function () {
        function JsonObjectMetadata() {
            this._dataMembers = {};
            this._knownTypes = [];
            this._knownTypeCache = null;
            this.isExplicitlyMarked = false;
        }
        JsonObjectMetadata.getJsonObjectName = function (type, inherited) {
            if (inherited === void 0) { inherited = true; }
            var metadata = this.getFromType(type, inherited);
            if (metadata !== null) {
                return metadata.className;
            }
            else {
                return Helpers.getClassName(type);
            }
        };
        JsonObjectMetadata.getFromType = function (target, inherited) {
            if (inherited === void 0) { inherited = true; }
            var targetPrototype;
            var metadata;
            if (typeof target === "function") {
                targetPrototype = target.prototype;
            }
            else {
                targetPrototype = target;
            }
            if (!targetPrototype) {
                return null;
            }
            if (targetPrototype.hasOwnProperty(METADATA_FIELD_KEY)) {
                metadata = targetPrototype[METADATA_FIELD_KEY];
            }
            else if (inherited && targetPrototype[METADATA_FIELD_KEY]) {
                metadata = targetPrototype[METADATA_FIELD_KEY];
            }
            if (metadata && metadata.isExplicitlyMarked) {
                return metadata;
            }
            else {
                return null;
            }
        };
        JsonObjectMetadata.getFromInstance = function (target, inherited) {
            if (inherited === void 0) { inherited = true; }
            return this.getFromType(Object.getPrototypeOf(target), inherited);
        };
        JsonObjectMetadata.getKnownTypeNameFromType = function (target) {
            var metadata = this.getFromType(target, false);
            if (metadata) {
                return metadata.className;
            }
            else {
                return Helpers.getClassName(target);
            }
        };
        JsonObjectMetadata.getKnownTypeNameFromInstance = function (target) {
            var metadata = this.getFromInstance(target, false);
            if (metadata) {
                return metadata.className;
            }
            else {
                return Helpers.getClassName(target.constructor);
            }
        };
        Object.defineProperty(JsonObjectMetadata.prototype, "dataMembers", {
            get: function () {
                return this._dataMembers;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(JsonObjectMetadata.prototype, "className", {
            get: function () {
                if (typeof this._className === "string") {
                    return this._className;
                }
                else {
                    return Helpers.getClassName(this.classType);
                }
            },
            set: function (value) {
                this._className = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(JsonObjectMetadata.prototype, "knownTypes", {
            get: function () {
                var knownTypes;
                var knownTypeName;
                knownTypes = {};
                this._knownTypes.forEach(function (knownType) {
                    knownTypeName = JsonObjectMetadata.getKnownTypeNameFromType(knownType);
                    knownTypes[knownTypeName] = knownType;
                });
                this._knownTypeCache = knownTypes;
                return knownTypes;
            },
            enumerable: true,
            configurable: true
        });
        JsonObjectMetadata.prototype.setKnownType = function (type) {
            if (this._knownTypes.indexOf(type) === -1) {
                this._knownTypes.push(type);
                this._knownTypeCache = null;
            }
        };
        JsonObjectMetadata.prototype.addMember = function (member) {
            var _this = this;
            Object.keys(this._dataMembers).forEach(function (propertyKey) {
                if (_this._dataMembers[propertyKey].name === member.name) {
                    throw new Error("A member with the name '" + member.name + "' already exists.");
                }
            });
            this._dataMembers[member.key] = member;
        };
        JsonObjectMetadata.prototype.sortMembers = function () {
            var _this = this;
            var memberArray = [];
            Object.keys(this._dataMembers).forEach(function (propertyKey) {
                memberArray.push(_this._dataMembers[propertyKey]);
            });
            memberArray = memberArray.sort(this.sortMembersCompare);
            this._dataMembers = {};
            memberArray.forEach(function (dataMember) {
                _this._dataMembers[dataMember.key] = dataMember;
            });
        };
        JsonObjectMetadata.prototype.sortMembersCompare = function (a, b) {
            if (typeof a.order !== "number" && typeof b.order !== "number") {
                if (a.name < b.name) {
                    return -1;
                }
                else if (a.name > b.name) {
                    return 1;
                }
            }
            else if (typeof a.order !== "number") {
                return 1;
            }
            else if (typeof b.order !== "number") {
                return -1;
            }
            else {
                if (a.order < b.order) {
                    return -1;
                }
                else if (a.order > b.order) {
                    return 1;
                }
                else {
                    if (a.name < b.name) {
                        return -1;
                    }
                    else if (a.name > b.name) {
                        return 1;
                    }
                }
            }
            return 0;
        };
        return JsonObjectMetadata;
    }());
    function JsonObject(optionsOrTarget) {
        var options;
        if (typeof optionsOrTarget === "function") {
            options = {};
        }
        else {
            options = optionsOrTarget || {};
        }
        var initializer = options.initializer;
        var serializer = options.serializer;
        var decorator = function (target) {
            var objectMetadata;
            var parentMetadata;
            var i;
            if (!target.prototype.hasOwnProperty(METADATA_FIELD_KEY)) {
                objectMetadata = new JsonObjectMetadata();
                if (parentMetadata = target.prototype[METADATA_FIELD_KEY]) {
                    Object.keys(parentMetadata.dataMembers).forEach(function (memberPropertyKey) {
                        objectMetadata.dataMembers[memberPropertyKey] = parentMetadata.dataMembers[memberPropertyKey];
                    });
                    Object.keys(parentMetadata.knownTypes).forEach(function (key) {
                        objectMetadata.setKnownType(parentMetadata.knownTypes[key]);
                    });
                }
                Object.defineProperty(target.prototype, METADATA_FIELD_KEY, {
                    enumerable: false,
                    configurable: false,
                    writable: false,
                    value: objectMetadata
                });
            }
            else {
                objectMetadata = target.prototype[METADATA_FIELD_KEY];
            }
            objectMetadata.classType = target;
            objectMetadata.isExplicitlyMarked = true;
            if (options.name) {
                objectMetadata.className = options.name;
            }
            if (options.knownTypes) {
                i = 0;
                try {
                    options.knownTypes.forEach(function (knownType) {
                        if (typeof knownType === "undefined") {
                            throw new TypeError("Known type #" + i++ + " is undefined.");
                        }
                        objectMetadata.setKnownType(knownType);
                    });
                }
                catch (e) {
                    Helpers.error(new TypeError("@JsonObject: " + e.message + " (on '" + Helpers.getClassName(target) + "')"));
                }
            }
            if (typeof initializer === "function") {
                objectMetadata.initializer = initializer;
            }

            if (typeof serializer === "function") {
                objectMetadata.serializer = serializer;
            }
        };
        if (typeof optionsOrTarget === "function") {
            return decorator(optionsOrTarget);
        }
        else {
            return decorator;
        }
    }
    exports.JsonObject = JsonObject;
    function jsonMemberTypeInit(metadata, propertyName, warnArray) {
        if (warnArray === void 0) { warnArray = false; }
        if (metadata.elements) {
            if (typeof metadata.elements === "function") {
                metadata.elements = {
                    type: metadata.elements
                };
            }
            if (!metadata.type) {
                metadata.type = Array;
            }
        }
        if (metadata.type === Array) {
            if (!metadata.elements) {
                if (warnArray) {
                    Helpers.warn("No valid 'elements' option was specified for '" + propertyName + "'.");
                }
                else {
                    throw new Error("No valid 'elements' option was specified for '" + propertyName + "'.");
                }
            }
            else {
                jsonMemberTypeInit(metadata.elements, propertyName + '[]', true);
            }
        }
        if (typeof metadata.type !== "function") {
            throw new Error("No valid 'type' option was specified for '" + propertyName + "'.");
        }
    }
    function jsonMemberKnownTypes(metadata) {
        var knownTypes = new Array();
        knownTypes.push(metadata.type);
        if (metadata.elements) {
            knownTypes = knownTypes.concat(jsonMemberKnownTypes(metadata.elements));
        }
        return knownTypes;
    }
    function JsonMember(optionsOrTarget, propertyKey) {
        var memberMetadata = new JsonMemberMetadata();
        var options;
        var decorator;
        if (typeof propertyKey === "string" || typeof propertyKey === "symbol") {
            options = {};
        }
        else {
            options = optionsOrTarget || {};
        }
        decorator = function (target, propertyKey) {
            var descriptor = Object.getOwnPropertyDescriptor(target, propertyKey.toString());
            ;
            var objectMetadata;
            var parentMetadata;
            var reflectType;
            var propertyName = Helpers.getPropertyDisplayName(target, propertyKey);
            if (typeof target === "function") {
                throw new TypeError("@JsonMember cannot be used on a static property ('" + propertyName + "').");
            }
            if (typeof target[propertyKey] === "function") {
                throw new TypeError("@JsonMember cannot be used on a method property ('" + propertyName + "').");
            }
            if (options.hasOwnProperty("elementType")) {
                Helpers.warn(propertyName + ": the 'elementType' option is deprecated, use 'elements' instead.");
                options.elements = options.elementType;
                if (options.elementType === Array) {
                    memberMetadata.forceEnableTypeHinting = true;
                }
            }
            memberMetadata = Helpers.assign(memberMetadata, options);
            memberMetadata.key = propertyKey.toString();
            memberMetadata.name = options.name || propertyKey.toString();
            if (Helpers.isReservedMemberName(memberMetadata.name)) {
                throw new Error("@JsonMember: '" + memberMetadata.name + "' is a reserved name.");
            }
            if (options.hasOwnProperty("type") && typeof options.type === "undefined") {
                throw new TypeError("@JsonMember: 'type' of '" + propertyName + "' is undefined.");
            }
            if (typeof Reflect === "object" && typeof Reflect.getMetadata === "function") {
                reflectType = Reflect.getMetadata("design:type", target, propertyKey);
                if (typeof reflectType === "undefined") {
                    throw new TypeError("@JsonMember: type detected for '" + propertyName + "' is undefined.");
                }
                if (!memberMetadata.type || typeof memberMetadata.type !== "function") {
                    memberMetadata.type = reflectType;
                }
                else if (memberMetadata.type !== reflectType) {
                    Helpers.warn("@JsonMember: 'type' specified for '" + propertyName + "' does not match detected type.");
                }
            }
            jsonMemberTypeInit(memberMetadata, propertyName);
            if (!target.hasOwnProperty(METADATA_FIELD_KEY)) {
                objectMetadata = new JsonObjectMetadata();
                if (parentMetadata = target[METADATA_FIELD_KEY]) {
                    Object.keys(parentMetadata.dataMembers).forEach(function (memberPropertyKey) {
                        objectMetadata.dataMembers[memberPropertyKey] = parentMetadata.dataMembers[memberPropertyKey];
                    });
                }
                Object.defineProperty(target, METADATA_FIELD_KEY, {
                    enumerable: false,
                    configurable: false,
                    writable: false,
                    value: objectMetadata
                });
            }
            else {
                objectMetadata = target[METADATA_FIELD_KEY];
            }
            jsonMemberKnownTypes(memberMetadata).forEach(function (knownType) {
                objectMetadata.setKnownType(knownType);
            });
            try {
                objectMetadata.addMember(memberMetadata);
            }
            catch (e) {
                throw new Error("Member '" + memberMetadata.name + "' already exists on '" + Helpers.getClassName(objectMetadata.classType) + "'.");
            }
        };
        if (typeof propertyKey === "string" || typeof propertyKey === "symbol") {
            return decorator(optionsOrTarget, propertyKey);
        }
        else {
            return decorator;
        }
    }
    exports.JsonMember = JsonMember;
    var Serializer = (function () {
        function Serializer() {
        }
        Serializer.writeObject = function (object, settings) {
            var objectMetadata = JsonObjectMetadata.getFromInstance(object);
            var ObjectType;
            if (objectMetadata) {
                ObjectType = objectMetadata.classType;
            }
            else {
                ObjectType = object.constructor;
            }
            return JSON.stringify(this.writeToJsonObject(object, {
                objectType: ObjectType,
                enableTypeHints: settings.enableTypeHints,
                typeHintPropertyKey: settings.typeHintPropertyKey
            }), settings.replacer);
        };
        Serializer.writeToJsonObject = function (object, settings) {
            var _this = this;
            var json;
            var objectMetadata;
            if (object === null || typeof object === "undefined") {
                if (settings.emitDefault) {
                    json = Helpers.getDefaultValue(settings.objectType);
                }
                else {
                    json = object;
                }
            }
            else if (Helpers.isPrimitive(object) || object instanceof Date) {
                json = object;
            }
            else if (object instanceof Array) {
                json = [];
                for (var i = 0, n = object.length; i < n; i++) {
                    json.push(this.writeToJsonObject(object[i], {
                        elements: settings.elements ? settings.elements.elements : null,
                        enableTypeHints: settings.enableTypeHints,
                        objectType: settings.elements ? settings.elements.type : Object,
                        requireTypeHints: settings.requireTypeHints,
                        typeHintPropertyKey: settings.typeHintPropertyKey
                    }));
                }
            }
            else {
                objectMetadata = JsonObjectMetadata.getFromInstance(object);
                if (objectMetadata && typeof objectMetadata.serializer === "function") {
                    json = objectMetadata.serializer(object);
                }
                else {
                    json = {};
                    if (settings.enableTypeHints && (settings.requireTypeHints || object.constructor !== settings.objectType)) {
                        json[settings.typeHintPropertyKey] = JsonObjectMetadata.getKnownTypeNameFromInstance(object);
                    }
                    if (objectMetadata) {
                        objectMetadata.sortMembers();
                        Object.keys(objectMetadata.dataMembers).forEach(function (propertyKey) {
                            var propertyMetadata = objectMetadata.dataMembers[propertyKey];
                            json[propertyMetadata.name] = _this.writeToJsonObject(object[propertyKey], {
                                elements: propertyMetadata.elements,
                                emitDefault: propertyMetadata.emitDefaultValue,
                                enableTypeHints: settings.enableTypeHints,
                                name: propertyMetadata.name,
                                objectType: propertyMetadata.type,
                                requireTypeHints: settings.requireTypeHints,
                                typeHintPropertyKey: settings.typeHintPropertyKey
                            });
                        });
                    }
                    else {
                        Object.keys(object).forEach(function (propertyKey) {
                            json[propertyKey] = _this.writeToJsonObject(object[propertyKey], {
                                enableTypeHints: settings.enableTypeHints,
                                objectType: Object,
                                requireTypeHints: settings.requireTypeHints,
                                typeHintPropertyKey: settings.typeHintPropertyKey
                            });
                        });
                    }
                }
            }
            return json;
        };
        return Serializer;
    }());
    var Deserializer = (function () {
        function Deserializer() {
        }
        Deserializer.readObject = function (json, type, settings) {
            var value;
            var instance;
            var metadata = JsonObjectMetadata.getFromType(type);
            if (typeof json === 'Object') {
                value = json;
            }
            else {
                value = JSON.parse(json, settings.reviver);
            }
            if (typeof settings.maxObjects === "number") {
                if (this.countObjects(value) > settings.maxObjects) {
                    throw new Error("JSON exceeds object count limit (" + settings.maxObjects + ").");
                }
            }
            instance = this.readJsonToInstance(value, {
                objectType: type,
                typeHintPropertyKey: settings.typeHintPropertyKey,
                enableTypeHints: settings.enableTypeHints,
                strictTypeHintMode: true,
                knownTypes: metadata ? metadata.knownTypes : {}
            });
            return instance;
        };
        Deserializer.countObjects = function (value) {
            var _this = this;
            switch (typeof value) {
                case "object":
                    if (value === null) {
                        return 0;
                    }
                    else if (Helpers.isArray(value)) {
                        var count_1 = 0;
                        value.forEach(function (item) {
                            count_1 += _this.countObjects(item);
                        });
                        return count_1;
                    }
                    else {
                        var count_2 = 0;
                        Object.keys(value).forEach(function (propertyKey) {
                            count_2 += _this.countObjects(value[propertyKey]);
                        });
                        return count_2;
                    }
                case "undefined":
                    return 0;
                default:
                    return 1;
            }
        };
        Deserializer.readJsonToInstance = function (json, settings) {
            var _this = this;
            var object;
            var objectMetadata;
            var ObjectType;
            var typeHint;
            var temp;
            var knownTypes;
            if (typeof json === "undefined" || json === null) {
                if (settings.isRequired) {
                    throw new Error("Missing required member.");
                }
            }
            else if (Helpers.isPrimitive(settings.objectType)) {
                if (json.constructor !== settings.objectType) {
                    var expectedTypeName = Helpers.getClassName(settings.objectType).toLowerCase();
                    var foundTypeName = Helpers.getClassName(json.constructor).toLowerCase();
                    throw new TypeError("Expected value to be of type '" + expectedTypeName + "', got '" + foundTypeName + "'.");
                }
                object = json;
            }
            else if (settings.objectType === Array) {
                if (!Helpers.isArray(json)) {
                    throw new TypeError("Expected value to be of type 'Array', got '" + Helpers.getClassName(json.constructor) + "'.");
                }
                object = [];
                json.forEach(function (element) {
                    object.push(_this.readJsonToInstance(element, {
                        elements: settings.elements ? settings.elements.elements : null,
                        enableTypeHints: settings.enableTypeHints,
                        knownTypes: settings.knownTypes,
                        objectType: settings.elements ? settings.elements.type : element.constructor,
                        requireTypeHints: settings.requireTypeHints,
                        strictTypeHintMode: settings.strictTypeHintMode,
                        typeHintPropertyKey: settings.typeHintPropertyKey
                    }));
                });
            }
            else if (settings.objectType === Date) {
                if (typeof json === "string") {
                    object = new Date(json);
                }
                else if (json instanceof Date) {
                    object = json;
                }
                else {
                    throw new TypeError("Expected value to be of type 'string', got '" + typeof json + "'.");
                }
            }
            else {
                typeHint = json[settings.typeHintPropertyKey];
                if (typeHint && settings.enableTypeHints) {
                    if (typeof typeHint !== "string") {
                        throw new TypeError("Type-hint (" + settings.typeHintPropertyKey + ") must be a string.");
                    }
                    if (!settings.knownTypes[typeHint]) {
                        throw new Error("'" + typeHint + "' is not a known type.");
                    }
                    if (settings.strictTypeHintMode && !Helpers.isSubtypeOf(settings.knownTypes[typeHint], settings.objectType)) {
                        throw new Error("'" + typeHint + "' is not a subtype of '" + Helpers.getClassName(settings.objectType) + "'.");
                    }
                    ObjectType = settings.knownTypes[typeHint];
                    objectMetadata = JsonObjectMetadata.getFromType(ObjectType);
                }
                else {
                    if (settings.enableTypeHints && settings.requireTypeHints) {
                        throw new Error("Missing required type-hint.");
                    }
                    ObjectType = settings.objectType;
                    objectMetadata = JsonObjectMetadata.getFromType(settings.objectType);
                }
                if (objectMetadata) {
                    if (typeof objectMetadata.initializer === "function") {
                        object = objectMetadata.initializer(json) || null;
                    }
                    else {
                        objectMetadata.sortMembers();
                        object = new ObjectType();
                        Object.keys(objectMetadata.dataMembers).forEach(function (propertyKey) {
                            var propertyMetadata = objectMetadata.dataMembers[propertyKey];
                            temp = _this.readJsonToInstance(json[propertyMetadata.name], {
                                elements: propertyMetadata.elements,
                                enableTypeHints: settings.enableTypeHints,
                                isRequired: propertyMetadata.isRequired,
                                knownTypes: Helpers.merge(settings.knownTypes, objectMetadata.knownTypes || {}),
                                objectType: propertyMetadata.type,
                                requireTypeHints: settings.requireTypeHints,
                                strictTypeHintMode: settings.strictTypeHintMode,
                                typeHintPropertyKey: settings.typeHintPropertyKey
                            });
                            if (Helpers.valueIsDefined(temp)) {
                                object[propertyKey] = temp;
                            }
                        });
                    }
                }
                else {
                    object = {};
                    Object.keys(json).forEach(function (propertyKey) {
                        if (json[propertyKey] && propertyKey !== settings.typeHintPropertyKey) {
                            object[propertyKey] = _this.readJsonToInstance(json[propertyKey], {
                                enableTypeHints: settings.enableTypeHints,
                                knownTypes: settings.knownTypes,
                                objectType: json[propertyKey].constructor,
                                requireTypeHints: settings.requireTypeHints,
                                typeHintPropertyKey: settings.typeHintPropertyKey
                            });
                        }
                    });
                }
            }
            return object;
        };
        return Deserializer;
    }());
    var configSettings = {
        enableTypeHints: true,
        typeHintPropertyKey: "__type"
    };
    var TypedJSON = {
        config: function (settings) {
            configSettings = Helpers.merge(configSettings, settings);
        },
        stringify: function (value, settings) {
            return Serializer.writeObject(value, Helpers.merge(configSettings, settings || {}));
        },
        parse: function (json, type, settings) {
            if (JsonObjectMetadata.getFromType(type)) {
                return Deserializer.readObject(json, type, Helpers.merge(configSettings, settings || {}));
            }
            else {
                return JSON.parse.apply(JSON, arguments);
            }
        }
    };
    exports.TypedJSON = TypedJSON;
});

},{}]},{},[7])(7)
});