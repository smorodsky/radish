// 2012-12-21

var file = new File(app.activeScript.parent.parent.absoluteURI + '/Radish/Radish.jsx');


if (!file.exists) {
	file = new File(app.activeScript.parent.parent.absoluteURI + '/Radish.jsx');
}

if (file.exists) {
	app.doScript(file, ScriptLanguage.JAVASCRIPT);
} else {
	alert('Radish\rVersion control does not work.\rFile "' + file.fsName + '" not found.');
}
