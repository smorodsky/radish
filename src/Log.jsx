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

// 2013-03-20

// Журнал

radish.Log = function(msg) {}

// write line to log
radish.Log.prototype.write = function(msg) {
	var url = 'http://ezip.appspot.com/';
	var user = encodeURIComponent(app.userName).substr(0, 99);
	msg = encodeURIComponent(msg).substr(0, 555);
	
	if (File.fs == 'Macintosh') {
		var scpt = 'try\n'
		scpt += 'set AppleScript\'s text item delimiters to ""\n';
		scpt += 'set s to ["';
		var a = msg.split(/(.{111})/);
		
		for (var i = 0, l = a.length; i < l; i++) {
			scpt += a[i] + '",\u00AC\n"';
		}
		scpt += '"] as Unicode text\n';
		scpt += 'do shell script "curl --data \\"user="';
		scpt += ' & "' + user + '" & "&content=" & s & "&press=ok\\" '; 
		scpt += url + '>/dev/null 2>&1 &"\n';
		scpt += '"ok"\n';
		scpt += 'end try';
		return 'ok' == app.doScript(scpt, ScriptLanguage.APPLESCRIPT_LANGUAGE);
	} else {
		var scpt = 'On Error Resume Next\r';
		scpt += 'Dim xmlHttp\r';
		scpt += 'Set xmlHttp = CreateObject("Microsoft.XmlHttp")\r';
		scpt += 'xmlHttp.Open "POST", "' + url +'", False\r';
		scpt += 'xmlHttp.send ("user=' + user + '&content=' + msg +'")\r';
		app.doScript(scpt, ScriptLanguage.visualBasic);
	}
	return true;
}

radish.Log.prototype.writeLine = function(msg) {
	this.write(msg + '\r\n');
}

// write error info
radish.Log.prototype.writeError = function(err, /* optional */ extraInfo) {
	var msg = '';
	
	for (var i in err) {
		switch (i) {
			case 'source':
			case 'description':
			case 'start':
			case 'end':
				break;
			case 'fileName':
				msg += i + ': ' + new File(err[i]).name + '\n';
				break;
			default:
				msg += i + ': ' + err[i] + '\n';
		}
	}
	if (extraInfo) {
		msg += '\n';
		
		if (extraInfo.constructor.name === 'String') {
			msg += extraInfo + '\n';
		} else {
			
			for (var i in extraInfo) {
				if (i == 'properties') continue;
				
				try	{
					switch (extraInfo[i].constructor.name) {
						case 'Date':
							var v = extraInfo[i].toIsoString(2);
							break;
						case 'String':
							var v = '' + extraInfo[i];
							break;
						case 'Number':
							var v = 0 + extraInfo[i];
							break;
						case 'Boolean':
							var v = !!extraInfo[i];
							break;
						case 'File':
						case 'Folder':
							var v = extraInfo[i].fsName;
							break;
						case 'Function':
							var v = 'function()';
							break;
						case 'Document':
							var v = '' + extraInfo[i].name;
							break;
						default:
							var v = extraInfo[i].toSource();
					}
					msg += i + ': ' + v + '\n';
				} catch (r) {}
			}
		}
	}
	this.writeLine(msg);
	//alert (msg);
}

