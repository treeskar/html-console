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

		this.decorators = [];
		this.history = [];
		this._commands = {};
		// default commands
		this.addCommand('clear', this.clear, 'clear screen');
		this.addCommand('echo', this.echo, 'print message in console');
		this.addCommand('help', this.help, 'print list of all supported commands');

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
			name: name,
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
		pre.textContent = msgObj.text;
		return pre;
	}
	clear() {
		this.list.innerHTML = '';
	}
	help() {
		return [
			'<type:info>------- Commands list -------',
			...Object.keys(this._commands).map(name => `* ${name}: ${this._commands[name].help}`)
		].join('\n');
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
		let self = this,
			pattern = /^(\w+ ?)(.*)/;
		let stdIn = this.input.value.match(pattern);
		if(!stdIn) {
			this.echo('');
			return false;
		}
		this.echo('> ' + this.input.value);
		let name = stdIn[1].toLowerCase().trim();
		if ('object' === typeof this._commands[name]) {
			_runCommand(this._commands[name], stdIn[2]);
		} else {
			_onCommandComplete(`<type:error> command "${name}" not found`);
		}

		function _runCommand(cmdObj, args) {
			if ('-h' === args.trim()) {
				_onCommandComplete('<type:info>' + cmdObj.help);
				return;
			}
			if ('echo' === cmdObj.name) {
				_onCommandComplete(args);
				return;
			}
			let res = cmdObj.cmd(...args.split(' '));
			if (!(res instanceof Promise)) {
				_onCommandComplete(res);
				return;
			}

			let _value = self.input.value;
			self.input.value = '';
			self.input.setAttribute('disabled', 'disabled');
			self.updateCaretPosition();
			res.then(onEnd);

			function onEnd(msg) {
				self.input.removeAttribute('disabled', 'disabled');
				self.input.value = _value;
				self.updateCaretPosition();
				_onCommandComplete(msg);
			}
		}

		function _onCommandComplete(msg) {
			self.echo(msg);
			delete self.input.dataset.index;
			self.pushToHistory(self.input.value);
			self.input.value = '';
			self.updateCaretPosition();
			self.input.focus();
		}

		return false;
	}
}

export { HTMLConsole }
