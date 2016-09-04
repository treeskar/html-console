"use strict";

function setItem(key, ...value) {
	let _value = value.join(' ');
	if ('string' !== typeof key || 0 === _value.length) {
		return `<type:error> command "set" to accept two params key and value`;
	}
	localStorage.setItem(key, _value);
	return 'Ok';
}
function getItem(key) {
	if ('string' !== typeof key) {
		return `<type:error> command "get" has to accept key param in string type`;
	}
	let value = localStorage.getItem(key);
	if (value) {
		return `${key}: ${value}`;
	} else {
		return `<type:warn>"${key}" not found in DB`;
	}
}
function removeItem(key) {
	if ('string' !== typeof key) {
		return `<type:error> command "rm" has to accept key param in string type`;
	}
	if (!localStorage.hasOwnProperty(key)) {
		return `<type:warn>"${key}" not found`;

	} else {
		localStorage.removeItem(key);
		return 'OK';
	}
}
function printDate() {
	return new Date().toString();
}
function getIp() {
	return new Promise(_getIp);

	function _getIp(resolve, reject) {
		let xhr = new XMLHttpRequest();
		xhr.open('GET', 'https://api.ipify.org');
		xhr.addEventListener('load', onGetIp);
		xhr.addEventListener('error', onError);
		xhr.send();

		function onGetIp(e) {
			if (200 === this.status) {
				resolve(this.responseText);
			} else {
				reject(`${this.status}: ${this.responseText}`);
			}
			xhr.removeEventListener('load', onGetIp);
			xhr.removeEventListener('error', onError);
		}
		function onError(error) {
			reject(error);
			xhr.removeEventListener('load', onGetIp);
			xhr.removeEventListener('error', onError);
		}
	}
}

export { getIp, printDate, getItem, setItem, removeItem };
