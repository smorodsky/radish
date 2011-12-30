/* 
Radish
Version Control for Adobe InDesign & Adobe InCopy

Copyright: Konstantin Smorodsky
License:   MIT

Permission is hereby granted, free of charge, to any person obtaining a copy 
of this software and associated documentation files (the "Software"), to 
deal in the Software without restriction, including without limitation the 
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or 
sell copies of the Software, and to permit persons to whom the Software is 
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in 
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS 
IN THE SOFTWARE.
*/

// 2011-12-08

var Progress = function(caption){
	this.window = new Window('palette', caption);
	
	this.msg = this.window.add(
		'statictext', 
		[0, 0, 350, 20], 
		'');
	
	this.bar = this.window.add(
		'progressbar', 
		[0, 40, 350, 56]);
	
	this.bar.maxvalue = 100;
	
	if (File.fs == 'Macintosh') {
		this.msg2 = this.window.add(
			'statictext', 
			[0, 0, 350, 20], 
			'');
	}
}

Progress.prototype.setMessage = function(msg) {
	this.msg.text = msg;
}

Progress.prototype.setBar = function(/* optional */ value) {
	if (value === undefined) value = this.bar.value + 1;
	this.bar.value = value;
}

Progress.prototype.setMaxValue = function(mv) {
	this.bar.maxvalue = mv;
}

Progress.prototype.close = function() {
	this.window.close();
}

Progress.prototype.show = function(/* optional */ msg) {
	this.setMessage(msg ? msg : '');
	this.window.show();
}

Progress.prototype.hide = function() {
	this.window.hide();
}
