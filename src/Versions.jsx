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

// 2013-01-28

radish.showVersions = function() {
	// return icon for document
	var getIconByFile = function(file) {
		var ext = file.getExt().toLowerCase();
		if (ext == 'jpg' || ext == 'tiff' || ext == 'tif' || ext == 'png') {
			ext = 'jpeg';
		}
		var iconFile = new File(radish.resFolder + '/document_' + ext + '.png');
		if (!iconFile.exists) {
			iconFile = new File(radish.resFolder + '/document.png');
		}
		return iconFile;
	}
	// обновление списка версий
	var info = null;
	var redraw = function() {
		versionsList.removeAll();
		
		if (!ddFiles.selection) {
			ddFiles.selection = 0;
			return;
		}
		radish.showVersions.btnPreview && radish.showVersions.btnPreview.enabled = false;
		var file = files[ddFiles.selection.index];
		var dmt = file.fsName == document.fullName.fsName ? document : undefined;
		info = file.getVersionsInfo(dmt);
		
		if (!info) return;
		var iconFile = getIconByFile(file);
		var iconNoFile = new File(radish.resFolder + '/document_none.png');
		
		info.forEach(function(revision){
			var item = versionsList.add('item', '');
			revision.file = file.getVersionFile(revision[0], dmt);
			item.image = revision.file.exists ? iconFile : iconNoFile;
			item.subItems[0].text = revision.version;
			item.subItems[1].text = revision.user;
			item.subItems[2].text = revision.time.toHumanFriendlyString(radish.prefs.locale);
			// необязательные
			item.subItems[3].text = revision[3] || '';
			item.subItems[4].text = revision[4] || '';
			item.subItems[5].text = revision[5] || '';
		});
		//radish.showVersions.versionsList.selection = 0;
		enableButtons();
	}
	var enableButtons = function() {
		// preview only for main document
		radish.showVersions.btnPreview && 
			radish.showVersions.btnPreview.enabled = 
			ddFiles.selection.index == 0 && 
			versionsList.selection !== null;
		// restore if any version selected
		radish.showVersions.btnRestore && 
			radish.showVersions.btnRestore.enabled = 
			versionsList.selection !== null;
	}
	try {
		var document = app.activeDocument;
        if (!document.saved) throw 0;
	} catch (e) {
		var document = null;
	}
	
    if (document) {
        // ищем линки в выделенных объектах
        var link = null;
        for (var i = 0, l = document.selection.length; i < l; i++) {
            var sel = document.selection[i];
            var excluded = radish.prefs.linksExcludedExts.toUpperCase().split(' ');
            link = null;
            
            switch (sel.constructor.name) {
                case 'Character':
                case 'InsertionPoint':
                case 'Line':
                case 'Paragraph':
                case 'Text':
                case 'TextColumn':
                case 'TextFrame':
                case 'Word':
                    link = sel.parentStory.itemLink;
                    break;
                    
                case 'Group':
                case 'Oval':
                case 'Poligon':
                case 'Rectangle':
                    if (sel.allGraphics.length) {
                        link = sel.allGraphics[0].itemLink;
                    }
                    break;
                
                case 'Image':
                case 'EPS':
                case 'PDF':
                case 'WMF':
                    link = sel.itemLink;
                    break;
            }
            if (link && link.isValid) {
                // пропустим заблокированные типы
                var ext = (new File(link.filePath)).getExt().toUpperCase();
                if (excluded.indexOf(ext) >= 0) {
                    continue;
                }
                break;
            }
        }
    
        // если выделен линк открываем его страницу версий
        var activeFile = link ? new File(link.filePath).fsName :
            document.fullName.fsName;
        
        var layoutFile = document.fullName;
        var versionsFolder = layoutFile.getVersionsFolder(document);
	}
    var window = new Window('palette', localize({en:'Versions', ru:'Версии'}));
	
	window.orientation = 'row';
	window.alignChildren = 'top';
	
	var mainGroup = window.add("panel");
	mainGroup.orientation = "column";
	mainGroup.alignChildren = 'left';
	
    var files = [];
    
    if (document) {
        files = [layoutFile];
        
        // добавим линки
        for (var i = document.links.length; i--;) {
            var link = document.links[i];
            var file = new File(link.filePath);
            // skip doubles
            try {
                for (var j = files.length; j--;) {
                    if (files[j].fsName === file.fsName) {
                        throw 0;
                    }
                }
                files.push(file);
            } catch (e) {}
        }
        // список файлов текущего макета
        // filter files without versions
        files = files.map(function(file, i){
            return (0 == i || file.getDescriptionFile().exists) ? file : null;
        }).filter(function(file) {
            return file;
        });
        // sort
        var file0 = files[0];
        files = files.slice(1).sort(function(a, b) {
            return a.name.toUpperCase() > b.name.toUpperCase();
        });
        files = [file0].concat(files);
    }
    
	var ddFiles = mainGroup.add("DropDownList", 
		undefined, 
		files.map(function(file){return decodeURI(file.name);}));
	ddFiles.minimumSize.width = 200;
	ddFiles.maximumSize.width = 550;
	ddFiles.itemSize.height = 18;
	// add icons
	for (var i = ddFiles.items.length; i--;) {
		var listItem = ddFiles.items[i];
		listItem.image = getIconByFile(new File(listItem.text));
	}
	// выберем файл, по выделеному линку
	files.some(function(file, i) {
		if (file.fsName === activeFile) {
			ddFiles.selection = i;
			return true;
		}
	});
	ddFiles.addEventListener('change', function(){
		redraw();
	});
	
	var columnTitles = [
		'', 
		localize({en: 'Version',     ru: 'Версия'}), 
		localize({en: 'User',        ru: 'Пользователь'}), 
		localize({en: 'Date',        ru: 'Дата'}), 
		localize({en: 'Start Page',  ru: 'Страница'}), 
		localize({en: 'Pages Count', ru: 'Всего страниц'}), 
		localize({en: 'Chars',       ru: 'Знаков'})
	];
	// список доступных версий
	var versionsList = mainGroup.add('listbox', 
		{x:20, y:12, width:(File.fs == 'Macintosh' ? 550 : 450), height:333},//undefined, 
		undefined, 
		{numberOfColumns: columnTitles.length, 
			showHeaders: true, 
			columnTitles: columnTitles,
			columnWidths: [25]
		});
	versionsList.addEventListener('change', enableButtons);
	redraw();
	var buttonsGroup = window.add('group');
	buttonsGroup.orientation = 'column';
	buttonsGroup.alignChildren = 'fill';
	// restore button
	radish.showVersions.btnRestore = buttonsGroup.add(
		'button', 
		undefined, 
		localize({en:'Restore', ru:'Восстановить'}));
	radish.showVersions.btnRestore.enabled = false;
	radish.showVersions.btnRestore.onClick = function() {
		if (versionsList.selection !== null) {
			window.close();
			files[ddFiles.selection.index].restoreVersion(
				info[versionsList.selection.index].version,
				document);
		}
	}
	//  preview button
	radish.showVersions.btnPreview = buttonsGroup.add(
		'button', 
		undefined, 
		localize({en:'Preview', ru:'Просмотр'})
	);
	radish.showVersions.btnPreview.enabled = false;
	radish.showVersions.btnPreview.onClick = function () {
		if (versionsList.selection !== null && 0 == ddFiles.selection.index) {
			window.close();
			document.previewVersion(info[versionsList.selection.index].version);
		}
	}
    
    buttonsGroup.add('statictext', undefined, ' ');
    
    // preferences button
    radish.showVersions.btnPrefs = buttonsGroup.add(
		'button', 
		undefined, 
		localize({en:'Preferences...', ru:'Параметры...'})
	);
	radish.showVersions.btnPrefs.onClick = radish.editPreferences;
      
	// cancel button
	buttonsGroup.add(
		'button', 
		undefined, 
		localize({en:'Cancel', ru:'Отмена'})
	).onClick = function () {
		window.close();
	}
	// show dialog
	window.show();
}
