'use strict';

function appendTime(msgObj) {
	let time = new Date().toString().match(/ (\d{2}:\d{2}:\d{2}) /)[1];
	msgObj.text = `[${time}] ${msgObj.text}`;
	return msgObj;
}
function newLineSupport(msgObj) {
	msgObj.text = msgObj.text.replace(/\\n/g, String.fromCharCode(10));
	return msgObj;
}
function setLogType(msgObj) {
	let typePattern = /<type:(\w+)> ?/;
	let logClass = msgObj.text.match(typePattern);
	if (!logClass) {
		return msgObj;
	}
	msgObj.text = msgObj.text.replace(typePattern, '');
	msgObj.className += ' '+logClass[1];
	return msgObj;
}

export {appendTime, setLogType, newLineSupport};
