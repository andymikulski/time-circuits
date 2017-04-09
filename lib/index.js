'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

require('raf').polyfill();

var root = typeof window === 'undefined' ? global : window;

var secondsToMilli = exports.secondsToMilli = function secondsToMilli(milli) {
	return milli * 1e+3;
};
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

			var thisTime = this.getTimeSinceStart();
			var sinceLast = thisTime - (this.sinceLastTick || 0);
			var hadAverageTick = !!this.averageTick;
			this.averageTick = ((this.averageTick || 0) + sinceLast) * (hadAverageTick ? 0.5 : 1);

			this.handlers = this.handlers.map(function (handler) {
				var nanosecBottomLimit = handler.time - (_this.averageTick || 2e+6); // tolerance - 2ms OR the average frame tick
				var nanosecTopLimit = handler.time;

				var hasHitThisFrame = thisTime >= nanosecBottomLimit && thisTime <= nanosecTopLimit;

				var hasMissedTopLimit = nanosecTopLimit <= thisTime;

				// determine if the next frame will be past the time frame
				var futureTime = thisTime + _this.averageTick;
				var willMissNextFrame = futureTime >= nanosecTopLimit;

				var ignoreMissed = _this.options.ignoreMissed;


				if (hasHitThisFrame || hasMissedTopLimit || willMissNextFrame) {
					handler.func();
					return null;
				} else if (hasMissedTopLimit) {
					return null;
				}

				return handler;
			}).filter(function (x) {
				return x;
			});

			this.sinceLastTick = this.getTimeSinceStart();

			requestAnimationFrame(this.timeLoop.bind(this));
		}
	}, {
		key: 'getTime',
		value: function getTime() {
			if (this.node) {
				var timeStamp = process.hrtime();
				// Seconds to nanoseconds
				var time = milliToNano(secondsToMilli(timeStamp[0]));
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