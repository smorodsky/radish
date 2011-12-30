﻿/* 
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

// 2011-12-28

Document.prototype.saveVersion = function(withLinks, timeStamp, forced) {
	try {
		if (!forced && this.fullName.fsName.indexOf(Folder.temp.fsName) == 0) {
			return;
		}
		// prepare Progress Dialog
		radish.progress = new Progress('Radish');
		radish.progress.setMaxValue(this.links.length + 1);
		radish.progress.setBar(0);
		// сохраним версии линков
		if (('links' in this) && radish.prefs.versionsOfLinkedFiles) {
			var excluded = radish.prefs.linksExcludedExts.toUpperCase().split(' ');
			var savedLinks = {}; // list of saved links
			for (var i = 0, l = this.links.length; i < l; ++i) {
				radish.progress.setBar();
				try {
					var link = this.links[i];
					if (!link.isValid) continue;
				} catch (e) {
					// Error 44: Object is invalid
					continue;
				}
				if (link.filePath in savedLinks) continue;
				savedLinks[link.filePath] = null;
				var file = new File(link.filePath);
				
				// пропустим потеряные линки
				if (!link.isValid || 
					link.status != LinkStatus.NORMAL || 
					!file.exists ||
					// или запрещенные линки
					excluded.indexOf(file.getExt().toUpperCase()) >= 0) {
					
					continue;
				}
				
				// для ICML сохраним информацию о количестве знаков
				var extraInfo = [];
				if (link.parent.constructor.name == 'Story') {
					extraInfo = [
						'',
						'',
						link.parent.contents.length
					];
				}
				try {
					file.saveVersion(
						timeStamp, 
						radish.prefs.useAsyncCopy, 
						extraInfo);
						
				} catch (e) {
					radish.errorLog.writeError(
						e, 
						{event:'save link version', file:file.fsName});
				}
				radish.progress.hide();
			}
		}
		
		// save document version
		radish.progress.setBar();
		var extraInfo = [
			this.pages[0].name,
			this.pages.length,
			this.getCharsCount(),
			this.allPageItems.length,
			this.allGraphics.length
		];
		this.fullName.saveVersion(
			timeStamp, 
			radish.prefs.useAsyncCopy, 
			extraInfo, 
			forced);
	} catch (e) {
		throw e;
	} finally {
		radish.progress.close();
		delete radish.progress;
	}
}

// возвращает количество знаков в документе
Document.prototype.getCharsCount = function() {
	var 
		chars = 0,
		stories = this.stories;
	
	for (var i = stories.length; i--;) {
		try {
			chars += stories[i].characters.length;
		} catch (e) {}
	}
	return chars;
}

Document.prototype.previewVersion = function(versionNumber) {
	try {
		var versionFile = this.fullName.getVersionFile(versionNumber, this);
		
		if (!versionFile.exists) {
			alert('Radish\n' + localize({
				en: 'This version is not open', 
				ru: 'Эту версию нельзя открыть'}));
			return;
		}
		// calc extention if need
		var ext = this.fullName.getExt();
		ext = ext ? '.' + ext : '';
		// file for local copy
		var file = new File(Folder.temp.absoluteURI + '/' + 
			this.fullName.getBaseName() + 
			' [version ' + versionNumber + ']' + ext);
		// do copy
		if (versionFile.copy(file)) {
			file.lock();
			var d = app.open(file);
		} else {
			throw new Error('Copy error - ' + versionFile.fsName); 
		}
	} catch (e) {
		radish.errorLog.writeError(e, {event: 'Document.prototype.previewVersion'});
	}	
}

// при переименовании подтягиваем старую папку версий
Document.prototype.fixRename = function() {
	// читаем метаинформацию
	var jobName = this.metadataPreferences.jobName;
	// если файл не был переименован - выход
	if (!jobName || this.name.toUpperCase() == jobName.toUpperCase()) {
		return;
	}
	var currentVesionsFolder = this.fullName.getVersionsFolder();
	var oldVesionsFolder = new Folder(currentVesionsFolder.parent.absoluteURI + 
		'/' + jobName);
	var oldDocumentFile = new File(this.fullName.parent.absoluteURI + 
		'/' + jobName);
	
	if (currentVesionsFolder.exists || 
		!oldVesionsFolder.exists || 
		oldDocumentFile.exists) {
		return;
	}
	
	if (!oldVesionsFolder.rename(this.name)) {
		radish.errorLog.writeError(
			new Error('Cant rename folder'), 
			{event: 'radish.appAfterOpenListener',
			msg: oldVesionsFolder.error,
			folder: oldVesionsFolder.fsName});
	}
}