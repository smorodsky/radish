/* 
Radish
Version Control for Adobe InDesign & Adobe InCopy

Copyright: Konstantin SmorodskyLicense:   MIT

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

//2011-11-11

Date.prototype.toHumanFriendlyString = function(/* optional */ locale) {
	
	if (!locale) locale = $.locale;
	
	var d = this.getDate(), m = this.getMonth(), y = this.getFullYear();
	// current date
	var cDate = new Date();
	var cD = cDate.getDate(), cM = cDate.getMonth(), cY = cDate.getFullYear();
	
	switch (locale.toLowerCase().substr(0, 2)) {
		case 'ru':
			var lng = {
				months: ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 
					'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
				today: 'сегодня',
				yesterday: 'вчера'
			};
			
			var date = d + ' ' + lng.months[m];
			
			if (y != cY) date += ' ' + y;
			
			break;
		
		default:
			var lng = {
				months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
					'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
				today: 'today',
				yesterday: 'yesterday'
			};
			
			var date = lng.months[m] + '-' + ('0' + d).substr(-2);
			
			if (y != cY) date = y + '-' + date;
	}
	
	// today
	if (d == cD && m == cM && y == cY) {
		var date = lng.today;
	// yesterday
	} else if ((new Date(y, m, d + 1)).getTime() ==
			(new Date(cY, cM, cD)).getTime()) {
		var date = lng.yesterday;
	}
	
	return date + ', ' + this.getHours() + ':' +	('0' + this.getMinutes()).substr(-2);
}


// withTime:
// 			0 - без отметки времени
// 			1 - HH:MM
// 			2 - HH:MM:SS
Date.prototype.toIsoString = function(/* optional */ withTime) {
	
	if (withTime === undefined) withTime = 2;
	
	var add0 = function(v) {
		return ('0' + v).substr(-2);
	}
	var time = '';
	
	if (withTime > 0) {
		time = 'T' +
		add0(this.getHours()) + ':' +
		add0(this.getMinutes());
		
		if (withTime == 2) {
			time += ':' + add0(this.getSeconds());
		}
	}
	return '' + this.getFullYear() + '-' + 
		add0(1 + this.getMonth()) + '-' +
		add0(this.getDate()) + time;	
}