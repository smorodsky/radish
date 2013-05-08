/* 
Radish
Version Control for a Adobe InDesign & InCopy

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

// 2013-05-08

radish.checkAsyncCopyFile = new File(Folder.temp + '/RadishUseAsyncCopy');

// создает тестовый файл для поверки возможности фонового корпирования
radish.checkAsyncCopyStep1 = function() {
	radish.prefs.useAsyncCopy = 1;
	var file = new File(radish.resFolder + '/version.txt');
	
	try {
		if (!file.asyncCopy(radish.checkAsyncCopyFile)) throw 0;
	} catch (e) {
		radish.prefs.useAsyncCopy = 0;
	}
}

// проверяет наличие тестового файла
radish.checkAsyncCopyStep2 = function() {
	if (radish.prefs.useAsyncCopy != 1) return;

	radish.prefs.useAsyncCopy = radish.checkAsyncCopyFile.exists ? 2 : 0;
	radish.checkAsyncCopyFile.remove();
}

// читаем настройки из radish.prefs
;(function() {
	try {
		radish.prefs = {};
		
		// path to resources files
		radish.resFolder = app.activeScript.parent.fsName;
		
		// программа
		radish.isInDesign = app.name.indexOf('InDesign') >= 0;
		radish.isInCopy = app.name.indexOf('InCopy') >= 0;
		
		// build number
		try {
			var buildInfo = (new File(radish.resFolder + '/Version.txt')).readFile();
			buildInfo = eval('({' + buildInfo + '})');
			radish.build = buildInfo.version;
		} catch (e) {
			radish.build = '?';
		}
		
		// priority settings file located in the script folder
		radish.prefsFile = new File(app.activeScript.parent.absoluteURI + '/' + 
			app.activeScript.getBaseName() + '.prefs');
		
		// default settings file located in the user folder
		if (!radish.prefsFile.exists){
			radish.prefsFile = new File(Folder.userData.absoluteURI + '/' + 
			app.activeScript.getBaseName() + '.prefs');
		}
	
		try {
			var data = radish.prefsFile.readFile();
			try {
				radish.prefs = eval('({' + data + '})');
			} catch (e) {
				alert('Radish\nBroken settings file');
			}
		} catch (e) {}
		
		// check settings
		if (radish.prefs.enabled !== undefined && !radish.prefs.enabled) {
			exit();
		}
		if ('Unknown User Name' == app.userName) {
			var user = $.getenv(File.fs == 'Macintosh' ? 'USER' : 'USERNAME');
			if (user.length) app.userName = user;
		}
		// enable 
		radish.prefs.enabled = radish.prefs.enabled === undefined ?
			true : !!radish.prefs.enabled;
		// other scripts sync
		app.scriptArgs.setValue('radish', 'enable');
		
		// automaticaly write versions:
		// 0 - manualy
		// 1 - with document close
		// 2 - with every save
		if (typeof radish.prefs.mode == 'undefined') radish.prefs.mode = 1;
		radish.prefs.mode = parseInt(radish.prefs.mode, 10);
		
		if (isNaN(radish.prefs.mode) || radish.prefs.mode < 0 || radish.prefs.mode > 2) {
			radish.prefs.mode = 1;
		}
		// enable asynchronous file copy
		if (typeof radish.prefs.useAsyncCopy == 'undefined' || radish.prefs.useAsyncCopy) {
			radish.prefs.useAsyncCopy = 1;
		}
		radish.prefs.useAsyncCopy = Number(radish.prefs.useAsyncCopy); // for compatible
		
		// test async copy
		if (radish.prefs.useAsyncCopy > 0) radish.checkAsyncCopyStep1();
		
		// change file color label for opened files
		radish.prefs.useColorLabels = radish.prefs.useColorLabels === undefined ? 
			true : !!radish.prefs.useColorLabels;
		
		if (File.fs != 'Macintosh') radish.prefs.useColorLabels = false;
		// write version of linked files
		radish.prefs.versionsOfLinkedFiles = radish.prefs.versionsOfLinkedFiles === undefined ? 
			true : !!radish.prefs.versionsOfLinkedFiles;
		// exclude links by name extention
		radish.prefs.linksExcludedExts = radish.prefs.linksExcludedExts === undefined ? 
			'ai eps jpg jpeg pdf png psd tif tiff' : radish.prefs.linksExcludedExts;
		
	} catch (e) {
		alert('Radish\n' + localize({
			en: 'Error reading the configuration file. Versions of files are not be stored',
			ru: 'Ошибка чтения файла настроек. Версии файлов не сохраняются'}));
		radish.errorLog.writeError(e, {event: 'Read Prefs'});
		exit();
	}
})();

// show prefs dialog
radish.editPreferences = function() {
	// window
	var w = new Window('dialog', 'Radish - Preferences');
	w.orientation = "row";
	w.alignChildren = 'top';
	// controls
	var grpMain = w.add('group');
	grpMain.orientation = "column";
	grpMain.alignChildren = 'left';
	// mode
	var grpMode = grpMain.add('panel', undefined, localize({
		en: 'Write new version on:',
		ru: 'Записывать новую версию:'}));
	
	grpMode.orientation = "column";
	grpMode.alignChildren = 'left';
	grpMode.minimumSize = [500, 20];
	
    // в инкопи эта опция неприменима
	if (!radish.isInCopy) {
		var versionOnSave = grpMode.add('radioButton', undefined, localize({
			en: 'Every save',
			ru: 'при каждом сохранении'}));
		versionOnSave.value = 2 == radish.prefs.mode;
	}
	var versionOnClose = grpMode.add('radioButton', undefined, localize({
		en: 'Document closed',
		ru: 'при закрытии документа'}));
	versionOnClose.value = 1 == radish.prefs.mode;
	var versionOnMan = grpMode.add('radioButton', undefined, localize({
		en: 'Manual',
		ru: 'вручную'}));
	
	versionOnMan.value = 0 == radish.prefs.mode;
	var grpMisc = grpMain.add('panel');
	grpMisc.orientation = "column";
	grpMisc.alignChildren = 'left';
	grpMisc.minimumSize = [500, 20];
	// save link versions
	var versionsOfLinkedFiles = grpMisc.add('checkbox', undefined, localize({
		en: 'Write version of links,',
		ru: 'Сохранять версии линков,'}));
	
	versionsOfLinkedFiles.value = radish.prefs.versionsOfLinkedFiles;
	versionsOfLinkedFiles.addEventListener('click', function() {
		excludeLinksCaption.enabled = !versionsOfLinkedFiles.value;
		excludeLinksText.enabled = !versionsOfLinkedFiles.value;
	});
	// список типов-исключений
	var grpExcluded = grpMisc.add('group');
	var excludeLinksCaption = grpExcluded.add(
		'statictext', 
		undefined, 
		localize({
			en: '      and exclude link types:',
			ru: '      исключить файлы типов:'}));
	
	excludeLinksCaption.graphics.font = ScriptUI.newFont (
		excludeLinksCaption.graphics.font.family, 
		excludeLinksCaption.graphics.font.style,
		excludeLinksCaption.graphics.font.size - 2);
		
	var excludeLinksText = grpExcluded.add(
		'edittext', 
		[0, 0, 250, 20], 
		radish.prefs.linksExcludedExts);
	
	excludeLinksText.graphics.font = ScriptUI.newFont (
		excludeLinksText.graphics.font.family, 
		excludeLinksText.graphics.font.style,
		excludeLinksText.graphics.font.size - 2);
	
	excludeLinksCaption.enabled = versionsOfLinkedFiles.value;
	excludeLinksText.enabled = versionsOfLinkedFiles.value;
	
	// color labels
	if (File.fs == 'Macintosh') {
		var useColorLabels = grpMisc.add(
			'checkbox', 
			undefined, 
			localize({
				en: 'Change color label for opened documents',
				ru: 'Менять цветовую метку при открытии документа'}));
		useColorLabels.value = radish.prefs.useColorLabels;
	}
	// async copy
	var useAsyncCopy = grpMisc.add(
		'checkbox', 
		undefined, 
		localize({
			en: 'Copy files in the background',
			ru: 'Фоновое копирование файлов'}));
	useAsyncCopy.value = radish.prefs.useAsyncCopy > 0;
	
	/*
	var useAsyncCopyTip = grpMisc.add(
		'statictext', 
		undefined, 
		localize({
			en: '      Disable this option if you receive an error message in the process of saving versions.',
			ru: '      Отключите эту опцию если у вас появляются сообщения об ошибках копирования.'}));
	useAsyncCopyTip.graphics.font = ScriptUI.newFont (
		useAsyncCopyTip.graphics.font.family, 
		useAsyncCopyTip.graphics.font.style,
		useAsyncCopyTip.graphics.font.size - 3);
	*/
	
	var infoLine = grpMain.add('statictext', 
		undefined, 
		'Radish. Version control for files of Adobe InDesign and InCopy. Build ' + radish.build);
	infoLine.graphics.font = ScriptUI.newFont (
		infoLine.graphics.font.family, 
		infoLine.graphics.font.style,
		infoLine.graphics.font.size - 3);
	
	// buttons
	var grpButtons = w.add('group');
	grpButtons.orientation = "column";
	grpButtons.alignChildren = 'top';
	
	var btnOk = grpButtons.add('button', undefined, 'OK');
	btnOk.addEventListener ('click', function(event) {
		w.close(1);
	});
	var btnCancel = grpButtons.add('button', undefined, 'Cancel');
	btnCancel.addEventListener('click', function() {
		w.close(0);
	});
	
	// show dialog
	if (0 == w.show()) return;
	try {
		// update prefs
		radish.prefs.mode = (!radish.isInCopy && versionOnSave.value) ? 2 : 
			(versionOnMan.value ? 0 : 1);
		radish.prefs.versionsOfLinkedFiles = versionsOfLinkedFiles.value;
		radish.prefs.linksExcludedExts = 
			// уберем ненужные знаки и лишние пробелы
			excludeLinksText.text.replace(/[^a-z0-9]+/gi, ' ').split(' ').filter(function(i){
				return i.length;
			}).join(' ');
		
		if (File.fs == 'Macintosh') {
			radish.prefs.useColorLabels = useColorLabels.value;
		}
		
		if (useAsyncCopy.value) {
			radish.checkAsyncCopyStep1();
		} else {
			radish.prefs.useAsyncCopy = 0;
		}
		
		if ('makeVersionWithEverySave' in radish.prefs) {
			delete radish.prefs.makeVersionWithEverySave;
		}
		// write prefs
		radish.savePefs();
	} catch (e) {
		radish.errorLog.writeError(e, {event: 'write prefs'});
	}
}

// записывает текущие настройки
radish.savePefs = function(){
	var wdata = ''; 
	
	for (var i in radish.prefs) {
		s = '';
		switch (radish.prefs[i].constructor.name) {
			case 'Function':
				break;
			case 'File':
			case 'Folder':
				s = radish.prefs[i].fsName;
				break;
			case 'String':
				s = '"' + radish.prefs[i].replace('\\', '\\\\').replace('"', '\\"') + '"';
				break;
			case 'Boolean':
				s = radish.prefs[i] ? '1' : '0';
				break;
			case 'Number':
				s = '' + (0 + radish.prefs[i]);
			 	break;
			 default:
				s = radish.prefs[i].toSource();
		}
		if (s.length) wdata += i + ':' + s + ',\r\n';
	}
	if (!radish.prefsFile.open('w')) {
		throw new Error('Cant open file ' + radish.prefsFile.name);
	}
	radish.prefsFile.encoding = 'UTF-8';
	if (!radish.prefsFile.write(wdata)){
		radish.prefsFile.close();
		throw new Error('Cant write file ' + radish.prefsFile.name);
	}
	radish.prefsFile.close();
}
		