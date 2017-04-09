require('raf').polyfill();

const root = typeof window === 'undefined' ? global : window;

export const secondsToMilli = (milli) => milli * (1e+3);
export const milliToNano = (milli) => milli * (1e+6);
export const nanoToMilli = (nano) => nano / (1e+6);

export class TimeCircuits {
	constructor(options) {
		this.options = { ...options };
		this.node = this.getTimeMode();
		this.startingTime = null;
		this.handlers = [];
	}

	getTimeMode() {
		this.node = false;

		if (typeof performance === 'undefined') {
			if(typeof process === 'undefined') {
				const env = this.node ? 'environment' : 'browser';
				throw new Error(`time-circuits: ${env} not supported!`);
			} else {
				this.node = true;
			}
		}

		return this.node;
	}

	start() {
		this.startingTime = this.getTime();
		this.timeLoop();
		return this;
	}

	reset() {
		this.startingTime = this.getTime();
		return this;
	}

	set(func, time, id) {
		this.handlers.push({
			time: milliToNano(time),
			func,
			id,
		});
		return this;
	}

	unset(targetId) {
		this.handlers = this.handlers.filter(({ id }) => id === targetId);
		return this;
	}

	timeLoop() {
		const thisTime = this.getTimeSinceStart();
		const sinceLast = thisTime - (this.sinceLastTick || 0);
		const hadAverageTick = !!this.averageTick;
		this.averageTick = ((this.averageTick || 0) + sinceLast) * (hadAverageTick ? 0.5 : 1);

		this.handlers = this.handlers.map((handler) => {
			const nanosecBottomLimit = handler.time - (this.averageTick || 2e+6); // tolerance - 2ms OR the average frame tick
			const nanosecTopLimit = handler.time;

			const hasHitThisFrame = thisTime >= nanosecBottomLimit
				&& thisTime <= nanosecTopLimit;

			const hasMissedTopLimit = nanosecTopLimit <= thisTime;

			// determine if the next frame will be past the time frame
			const futureTime = thisTime + (this.averageTick);
			const willMissNextFrame = futureTime >= nanosecTopLimit;

			const { ignoreMissed } = this.options;

			if (hasHitThisFrame || hasMissedTopLimit || willMissNextFrame) {
				handler.func();
				return null;
			} else if (hasMissedTopLimit) {
				return null;
			}

			return handler;
		}).filter(x => x);

		this.sinceLastTick = this.getTimeSinceStart();

		requestAnimationFrame(::this.timeLoop);
	}

	getTime() {
		if (this.node) {
			const timeStamp = process.hrtime();
			// Seconds to nanoseconds
			let time = milliToNano(secondsToMilli(timeStamp[0]));
				// Add the given nanoseconds
			time += timeStamp[1];
			return time;
		}

		return performance.now();
	}

	getTimeSinceStart() {
		return this.getTime() - this.startingTime;
	}

}

const singletonCircuits = new TimeCircuits();
singletonCircuits.start();

export default singletonCircuits;
