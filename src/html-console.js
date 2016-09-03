'use strict';
import { HTMLConsole } from './html-console-core';
import { setLogType, appendTime, newLineSupport } from './html-console-decorators'
import { setItem, getItem, removeItem, getIp, printDate } from './html-colnsole-commands';
//import { window } from 'window';
let consoles = Array.from(document.getElementsByTagName('console')).map(initiateConsole);

function initiateConsole(console) {
	let htmlConsole = new HTMLConsole(console, 'console-template');
	// extend HTML Console message decorators
	htmlConsole.decorators = htmlConsole.decorators.concat([setLogType, appendTime, newLineSupport]);
	// extend HTML Console commands
	htmlConsole.addCommand('set', setItem, 'Set data in LocalStorage');
	htmlConsole.addCommand('get', getItem, 'get data from LocalStorage');
	htmlConsole.addCommand('rm', removeItem, 'remove data from LocalStorage');
	htmlConsole.addCommand('date', printDate, 'print current date and time');
	htmlConsole.addCommand('ip', getIp, 'print your external IP');
	return htmlConsole;
}

// global error handling
let oldOnError = window['onerror'];
window['onerror'] = onError;

function onError(message, file, line, column, err) {
	if ('function' === typeof oldOnError) {
		oldOnError(...arguments);
	}
	if(arguments.length < 2 && message === null) {
		return;
	}
	if (message.toString().indexOf('Script error.') > -1) {
		return;
	}
	let stack = 'No stack found, old browser or CORS on script tag missing...';
	if(typeof err === 'undefined') {
		err = message;
	}
	if(err && err.stack && typeof err.stack.toString === 'function') {
		stack = err.stack.toString();
	} else if(err && err.stack) {
		stack = err.stack;
	}

	let msg = '<type:error>' + (message.toString === 'function' ? message.toString() : message);
	consoles.forEach(console => console.echo(msg, '/n'+stack));
}

// capture console log messages
['log', 'error', 'warn'].forEach(caprureLog);
function caprureLog(type) {
	let _log = window.console[type].bind(window.console);

	window.console[type] = function extendLog() {
		_log(...arguments);
		consoles.forEach(console => console.echo(`<type:${type}>`, ...arguments));
	};
}
