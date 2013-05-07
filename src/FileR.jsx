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

// 2013-05-07

File.prototype.getVersionsFolder = function() {
	return new Folder(this.parent.absoluteURI + '/.versions/' + this.name);
}

File.prototype.getDescriptionFile = function() {
	return new File(this.getVersionsFolder().absoluteURI + '/description');
}

File.prototype.getVersionFile = function(versionNumber) {
	var version = parseInt(versionNumber, 10);
	
	if (isNaN(version)) throw new Error('Broken version number');
	
	if (version <= 999) {
		version = ('000' + version).substr(-4);
	}
	var ext = this.getExt().replace(/[%:\\\/]/g, '');
	return new File(this.getVersionsFolder().fsName + 
			'/' + version + (ext ? '.' + ext : ''));
}

// save version of this file
File.prototype.saveVersion = function(/* optional */ extraInfo, forced) {
	if (!extraInfo) extraInfo = [];
	var descriptionFile = this.getDescriptionFile();
	
	// check changed
	if (!forced && 
		descriptionFile.exists && descriptionFile.modified && this.modified && 
		(descriptionFile.modified.getTime() >= this.modified.getTime())) {
		
		return;
	}

	// check test file
	radish.checkAsyncCopyStep2();
	
	// do save
	(0 == radish.prefs.useAsyncCopy) && radish.progress && radish.progress.show(
		localize({en: 'Save version of ',
		ru: 'Сохраняется версия '}) + decodeURI(this.name));
	
	var versionsInfo = this.getVersionsInfo();
	if (versionsInfo) {
		var version = versionsInfo[0].version + 1;
		var descriptionData = versionsInfo.rawData;
	} else {
		var version = 1;
		var descriptionData = '';
	}
	// create versions folder
	if (!descriptionFile.parent.exists) {
		if (!descriptionFile.parent.makePath()) {
			throw new Error('Can not make path - ' + descriptionFile.parent.fsName);
		}
		// hide ".versions" folder
		descriptionFile.parent.parent.hide();
	}
	
	// сводка о текущей версии
	var info = [version, 
		app.userName,
		(this.modified.getTime() / 1000).toString(36)
		].concat(extraInfo);
	info[9] = radish.build;
	
	// save description file
	try {
		var i = 999;
		while (!descriptionFile.open('w') && --i) $.sleep(9);
		
		if (i == 0) {
			try {
				descriptionFile.close();
			} catch (e) {}
			throw new Error(descriptionFile.error);
		}
		descriptionFile.encoding = 'UTF-8';
		if (!descriptionFile.write(info.join('\t') + '\n' + descriptionData)) {
			throw new Error('Can not save description');
		}
		descriptionFile.close();
	} catch (e) { 
		try {
			descriptionFile.close();
		} catch (e) {}
		throw new Error(localize({
			en:'Can not write versions table', 
			ru:'Ошибка при записи таблицы версий'}) + 
			'\n' + descriptionFile.error);	
	}
	// copy file
	targetFile = this.getVersionFile(version);
	
	if (radish.prefs.useAsyncCopy > 0) {
		var rc = this.asyncCopy(targetFile);
	} else {
		var rc = this.copy(targetFile);
	}
	if (!rc) {
		throw localize({
			en:'Cant write version of "', 
			ru:'Не удалось записать версию файла "'}) + 
			this.name + '"\n' + this.error;
	}
}

File.prototype.getVersionsInfo = function() {
	var descriptionFile = this.getDescriptionFile();
	
	if (!descriptionFile.exists) return null;
	
	// читаем весь файл .description
	try {
		var data = descriptionFile.readFile();
	} catch (e) {
		var msg = localize({
			en:'Unable to read table versions of file "', 
			ru:'Не удалось прочитать таблицу версий файла "'}) + 
			this.file.name + '"\n' + e.message;
		throw msg;
	}
	
	// обрабатываем прочитанное
	var infoData = data.split(/\r|\n/g).map(function(line){
		return line.split('\t');
	}).filter(function(line) {
		var ver = parseInt(line[0], 10);
		if (isNaN(ver)) {
			// вероятно, это строка-коментарий
			return false;
		}
		line[0] = ver;
		// три обязательных параметра имеют именованые ссылки
		line.version = ver;
		line.user = line[1];
		
		// long (old) or pocket date format
		var time = line[2].length > 12 ? parseInt(line[2], 10) :
			1000 * parseInt(line[2], 36);
		if (isNaN(time)) time = 0;
		line.time = new Date(time);
				
		return true;
	}).sort(function(a, b) {
		return a[0] < b[0];
	});
	infoData.rawData = data;
	return infoData;
}

// восстанавливает указанную версию файла
File.prototype.restoreVersion = function(versionNumber, document) {
	try {
		var versionFile = this.getVersionFile(versionNumber);
		
		if (!versionFile.exists) {
			alert('Radish\n' + localize({
				en: 'Can not recovery this version', 
				ru: 'Эту версию нельзя восстановить'}));
			return;
		}
		
		if (document && document.fullName.fsName == this.fsName) {
			// основаной документ (layout)
			radish.listenersDisabled = true;
			
			try {
				document.close(SaveOptions.NO);
			} catch (e) {
				alert('Radish\n' + localize({
					en: 'Failed to restore the version #', 
					ru: 'Не удалось восстановить версию '}) + 
					versionNumber + '\n' +  e.message);
				throw e;
			}
			var rc = versionFile.copy(this);
			document = app.open(this);
			radish.prefs.useColorLabels && this.setColorLabel(7);
			radish.listenersDisabled = false;
		} else {
			// линк 
			var rc = versionFile.copy(this);
			try {
				var link = document.links.itemByName(this.name)
				
				if (link.status == LinkStatus.LINK_OUT_OF_DATE) {
					link.update();
				}
			} catch (e) {}
		}
		if (rc) {
			// write commnet to description file			
			var descriptionFile = this.getDescriptionFile();
			try {
				var desriptionText = descriptionFile.readFile();
				desriptionText = '# Restored version ' + versionNumber + 
					', by user ' + app.userName + '\n' +
					desriptionText;
				descriptionFile.open('w');
				descriptionFile.write(desriptionText);
				descriptionFile.close();
			} catch (e) {}
			// show ok 
			alert('Radish\n' + localize({
				en: 'Restored version #', 
				ru: 'Восстановлена версия: '}) + 
				versionNumber + ' ' + localize({
					en:'of file "',
					ru: 'файла "'}) + 
				this.name + '"');
		} else {
			alert('Radish\n' + localize({
				en: 'Failed to restore the version #', 
				ru: 'Не удалось восстановить версию '}) + 
				versionNumber);
		}
	} catch (e) {
		radish.listenersDisabled = false;
		radish.errorLog.writeError(e, {event: 'File.prototype.restoreVersion', file: this.fsName});
	}
}
