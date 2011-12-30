// 2011-10-17

var autoupdatePath = '/project/.versions/Radish/Autoupdate/';
if (File.fs != 'Macintosh') {
	var autoupdatePath = '\\\\Tacos\\project\\.versions\\Radish\\Autoupdate\\';
}


var readVersionInfoFile = function(file) {
	file.encoding = 'UTF-8';
	
	if (!file.open('r')) {
		return null;
	}
	
	var data = file.read();
	file.close();
	
	if (data.length < 1) return null;
	
	try {
		return eval('({' + data + '})');
	} catch (e) {
		return null;
	}
}

var radish_folder = new Folder(app.activeScript.parent.parent.absoluteURI);

try {
	// check update
	var locInfo = readVersionInfoFile(new File(radish_folder.absoluteURI + '/Version.txt'));
	var auInfo = readVersionInfoFile(new File(autoupdatePath + 'Version.txt'));
	
	if (locInfo && auInfo && 
		parseFloat(locInfo.version) < parseFloat(auInfo.version)) {
		
		// do update
		var auFolder = new Folder(autoupdatePath);
		
		(function(folder, toFolder) {
			var items = folder.getFiles();
			
			for (var i = items.length; i--;) {
				var item = items[i];
				// folder
				if (item.constructor.name == 'Folder') {
					var newFolder = new Folder(toFolder.absoluteURI + '/' + item.name);
					newFolder.create();			
					arguments.callee(item, newFolder);
					continue;	
				}
				// file
				item.copy(new File(toFolder.absoluteURI + '/' + item.name));
			}
		})(auFolder, radish_folder);
		
		// run autoupadte script
		var runOnce = new File(radish_folder.absoluteURI + '/_runOnce.jsx');
		
		if (runOnce.exists) {
			try {
				app.doScript(runOnce, ScriptLanguage.JAVASCRIPT);
			} catch (e) {}
			runOnce.remove();
		}
	}
} catch (e){}

// run
var file = new File(app.activeScript.parent.parent.absoluteURI + '/Radish/Radish.jsx');

if (!file.exists) {
	file = new File(app.activeScript.parent.parent.absoluteURI + '/Radish.jsx');
}

if (file.exists) {
	app.doScript(file, ScriptLanguage.JAVASCRIPT);
} else {
	alert('Radish\rVersion Control System not worked\rFile "' + file.fsName + '" not found');
}
