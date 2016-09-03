'use strict';

class Channel {
	constructor(name) {
		this.name = name;
		this.listeners = [];
	}
	addListener(cb, ctx={type: this.name}) {
		this.listeners.push({cb, ctx});
		return this.listeners.length;
	}
	removeListener(cb=null) {
		if (!cb) {
			this.listeners = [];
		} else if ('function' === typeof cb) {
			let index = this.listeners.findIndex(listener => listener.cb === cb);
			if (index > -1) {
				this.listeners = [...this.listeners.splice(0, index), ...this.listeners.splice(1)];
			}
		}
		return this.listeners.length;
	}
	emit(arg) {
		this.listeners.forEach(listeners => {
			listeners.cb.call(listeners.ctx, ...arg);
		});
	}
}

class PubSub {
	constructor() {
		this.channels = {};
	}
	on(channelName, cb, ctx) {
		if (Array.isArray(channelName)) {
			return channelName.map(name => this.on(name, cb, ctx), this);
		}
		if ('string' !== typeof channelName || 'function' !== typeof cb) {
			return null;
		}
		if ('undefined' === typeof this.channels[channelName]) {
			// create new Channel
			this.channels[channelName] = new Channel(channelName);
		}
		this.channels[channelName].addListener(cb, ctx);
		return this.off.bind(this, channelName, cb);
	}
	off(channelName, cb) {
		if (Array.isArray(channelName)) {
			let res = channelName.map(name => this.off(name, cb), this);
			return res.find(obj => obj === null)? null : this;
		}
		if ('string' !== typeof channelName || 'undefined' === typeof this.channels[channelName]) {
			return null;
		}
		if (0 === this.channels[channelName].removeListener(cb)) {
			delete this.channels[channelName];
		}
		return this;
	}
	trigger(channelName, ...args) {
		if (Array.isArray(channelName)) {
			let res = channelName.map(name => this.trigger(name, ...args), this);
			return res.find(obj => obj === null)? null : this;
		}
		if ('string' !== typeof channelName || 'undefined' === typeof this.channels[channelName]) {
			return null;
		}
		this.channels[channelName].emit(args);
		return this;
	}
}

export { PubSub, Channel };
