'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

require('raf').polyfill();

var root = typeof window === 'undefined' ? global : window;

var milliToNano = exports.milliToNano = function milliToNano(milli) {
	return milli * 1e+6;
};
var nanoToMilli = exports.nanoToMilli = function nanoToMilli(nano) {
	return nano / 1e+6;
};

var TimeCircuits = exports.TimeCircuits = function () {
	function TimeCircuits(options) {
		_classCallCheck(this, TimeCircuits);

		this.options = _extends({}, options);
		this.node = this.getTimeMode();
		this.startingTime = null;
		this.handlers = [];

		this.margin = 0.0024;
	}

	_createClass(TimeCircuits, [{
		key: 'getTimeMode',
		value: function getTimeMode() {
			this.node = false;

			if (typeof performance === 'undefined') {
				if (typeof process === 'undefined') {
					var env = this.node ? 'environment' : 'browser';
					throw new Error('time-circuits: ' + env + ' not supported!');
				} else {
					this.node = true;
				}
			}

			return this.node;
		}
	}, {
		key: 'start',
		value: function start() {
			this.startingTime = this.getTime();
			this.timeLoop();
			return this;
		}
	}, {
		key: 'reset',
		value: function reset() {
			this.startingTime = this.getTime();
			return this;
		}
	}, {
		key: 'set',
		value: function set(func, time, id) {
			this.handlers.push({
				time: milliToNano(time),
				func: func,
				id: id
			});
			return this;
		}
	}, {
		key: 'unset',
		value: function unset(targetId) {
			this.handlers = this.handlers.filter(function (_ref) {
				var id = _ref.id;
				return id === targetId;
			});
			return this;
		}
	}, {
		key: 'timeLoop',
		value: function timeLoop() {
			var _this = this;

			var nanosecSinceStart = this.getTimeSinceStart();

			this.handlers = this.handlers.map(function (handler) {
				var nanosecBottomLimit = handler.time * (1 - _this.margin);
				var nanosecTopLimit = handler.time * (1 + _this.margin);

				var isInsideTimeLimit = nanosecSinceStart >= nanosecBottomLimit && nanosecSinceStart <= nanosecTopLimit;

				var hasMissedTimeLimit = nanosecTopLimit <= nanosecSinceStart;

				if (isInsideTimeLimit) {
					handler.func();
					return null;
				} else if (hasMissedTimeLimit) {
					if (!_this.options.ignoreMissed) {
						handler.func();
					}

					return null;
				}

				return handler;
			}).filter(function (x) {
				return x;
			});

			requestAnimationFrame(this.timeLoop.bind(this));
		}
	}, {
		key: 'getTime',
		value: function getTime() {
			if (this.node) {
				var timeStamp = process.hrtime();
				// Seconds to nanoseconds
				var time = timeStamp[0] * 1e+9;
				// Add the given nanoseconds
				time += timeStamp[1];
				return time;
			}

			return performance.now();
		}
	}, {
		key: 'getTimeSinceStart',
		value: function getTimeSinceStart() {
			return this.getTime() - this.startingTime;
		}
	}]);

	return TimeCircuits;
}();

var singletonCircuits = new TimeCircuits();
singletonCircuits.start();

exports.default = singletonCircuits;