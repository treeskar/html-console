(function () {
	'use strict';

	// HTML Console
	class HTMLConsole {
		constructor(host=document.body, tplId='console-template') {
			let template = document.getElementById(tplId);
			if (!template) {
				throw new Error('HTMLConsole: template by id "%s" not found', tplId);
			}
			if (!(host instanceof Node)) {
				throw new Error('HTMLConsole: container has to be Node element');
			}
			this.container = host.createShadowRoot();
			this.container.appendChild(document.importNode(template.content, true));

			this.input = this.validateNode('input');
			this.caret = this.validateNode('.console-caret');
			this.list = this.validateNode('.log-list');
			this.canvasCtx = document.createElement('canvas').getContext('2d');
			this.canvasCtx.font = '14px monospace';
			this._commands = {
				clear: {
					cmd: this.clear.bind(this),
					help: 'clear screen'
				},
				echo: {
					cmd: this.echo.bind(this),
					help: 'print message in console'
				},
				help: {
					cmd: this.help.bind(this),
					help: 'print list of all supported commands'
				}
			};
			this.decorators = [];
			this.history = [];
			this.updateCaretPosition = this.updateCaretPosition.bind(this);

			this.validateNode('form').addEventListener('submit', this.onEval.bind(this));
			this.input.addEventListener('keydown', this.onKeyDown.bind(this));
			this.input.addEventListener('keyup', this.updateCaretPosition);
			window.addEventListener('resize', this.updateCaretPosition);
			setTimeout(this.updateCaretPosition, 0);
		}
		addCommand(name, cmd, description='', f=false) {
			if ('string' !== typeof name || 'function' !== typeof cmd) {
				throw new Error('HTMLConsole: has to accept command name as string and command function as function');
			}
			if ('undefined' !== typeof this._commands[name] && !f) {
				return console.warn('Command "%s" already exit use force=true to overwrite it', name);
			}
			this._commands[name] = {
				cmd: cmd.bind(this),
				help: description
			};
			return this;
		}
		validateNode(selector) {
			let elm = this.container.querySelector(selector);
			if (!elm) {
				throw new Error('HTMLConsole: Template does\'t contain %s', selector);
			}
			return elm;
		}
		echo(...msg) {
			let log = document.createElement('li')
				.appendChild(this.decorator(msg.join(' ')));
			this.list.appendChild(log);
			this.list.scrollTop = this.list.scrollHeight;
		}
		decorator(msg) {
			let msgObj = {
					className: '',
					text: msg
				},
				pre = document.createElement('pre');
			this.decorators.forEach(decorator => {
				msgObj = decorator(msgObj);
			});
			pre.className = msgObj.className;
			pre.innerText = msgObj.text;
			return pre;
		}
		clear() {
			this.list.innerHTML = '';
		}
		help() {
			this.echo('<type:info>------- Commands list -------');
			Object.keys(this._commands).forEach(name => {
				this.echo(`<type:info>${name}: ${this._commands[name].help}`);
			});
		}
		pushToHistory(msg) {
			const maxLength = 100;
			this.history.unshift(msg);
			if (this.history.length > maxLength) {
				this.history = this.history.splice(0, maxLength);
			}
		}
		getHistory(incr=1) {
			let index = parseInt(this.input.dataset.index, 10);
			index = isNaN(index) ? -1 : index;
			index += incr;
			if(index >= this.history.length) {
				index = 0;
			} else if (index < 0) {
				index = this.history.length-1;
			}
			this.input.dataset.index = index;
			return this.history[index];
		}
		updateCaretPosition() {
			let text = this.input.value.substr(0, this.input.selectionEnd);
			let textWidth = this.canvasCtx.measureText(text).width;
			this.caret.style.left = (this.input.offsetLeft + textWidth) + 'px';
		}
		updateInputValue(value) {
			if ('string' !== typeof value) {
				return;
			}
			let start = this.input.selectionStart,
				end = this.input.selectionEnd;
			this.input.value = value;
			this.input.setSelectionRange(start, end);
		}
		onKeyDown(e) {
			if (!(e instanceof Event)) {
				return;
			}
			switch (e.keyCode) {
				case 38:
					e.preventDefault();
					this.updateInputValue(this.getHistory(1));
					break;
				case 40:
					e.preventDefault();
					this.updateInputValue(this.getHistory(-1));
					break;
				case 27:
					this.input.value = '';
					break;
			}
		}
		onEval(e) {
			e.stopPropagation();
			e.preventDefault();
			let pattern = /^(\w+ ?)(.*)/;
			let stdIn = this.input.value.match(pattern);
			if(!stdIn) {
				return false;
			}
			let name = stdIn[1].toLowerCase().trim();
			if ('object' === typeof this._commands[name]) {
				this._commands[name].cmd(...stdIn[2].split(' '));
			} else {
				this.echo(`<type:error> command "${name}" not found`);
			}
			delete this.input.dataset.index;
			this.pushToHistory(this.input.value);
			this.input.value = '';
			return false;
		}
	}

	Array.from(document.getElementsByTagName('console')).forEach(initiateConsole);

	function initiateConsole(console) {
		let htmlConsole = new HTMLConsole(console, 'console-template');
		// extend HTML Console message decorators
		htmlConsole.decorators = htmlConsole.decorators.concat([setLogType, appendTime]);
		// extend HTML Console commands
		htmlConsole.addCommand('set', setItem, 'Set data in LocalStorage');
		htmlConsole.addCommand('get', getItem, 'get data from LocalStorage');

		// capture console log messages
		let _log = window.console.log.bind(window.console);
		window.console.log = function extendLog() {
			_log(...arguments);
			htmlConsole.echo(...arguments);
		};

		htmlConsole.addCommand('date', printDate, 'print current date and time');
		htmlConsole.addCommand('ip', getIp, 'print your external IP');
		return htmlConsole;
	}

	function appendTime(msgObj) {
		let time = new Date().toString().match(/ (\d{2}:\d{2}:\d{2}) /)[1];
		msgObj.text = `[${time}] ${msgObj.text}`;
		return msgObj;
	}
	function setLogType(msgObj) {
		let typePattern = /<type:(\w+)>/;
		let logClass = msgObj.text.match(typePattern);
		if (!logClass) {
			return msgObj;
		}
		msgObj.text = msgObj.text.replace(typePattern, '');
		msgObj.className += ' '+logClass[1];
		return msgObj;
	}

	function setItem(key, ...value) {
		let _value = value.join(' ');
		if ('string' !== typeof key || 0 === _value.length) {
			this.echo(`<type:error> command "set" to accept two params key and value`);
			return;
		}
		localStorage.setItem(key, value);
		this.echo(`Ok`);
	}
	function getItem(key) {
		if ('string' !== typeof key) {
			this.echo(`<type:error> command "get" has to accept key param in string type`);
			return;
		}
		let value = localStorage.getItem(key);
		if (value) {
			this.echo(`${key}: ${value}`);
		} else {
			this.echo(`${key} not found in DB`);
		}
	}
	function printDate() {
		this.echo(new Date().toString());
	}
	function getIp() {
		let xhr = new XMLHttpRequest(),
			self = this;
		xhr.open('GET', 'https://api.ipify.org');
		xhr.addEventListener('load', onGetIp);
		xhr.send();
		function onGetIp(e) {
			if (200 === this.status) {
				self.echo(this.responseText);
			} else {
				self.echo(`<type:error> ${this.status}: ${this.responseText}`);
			}
			xhr.removeEventListener('load', onGetIp);
		}
} ());
