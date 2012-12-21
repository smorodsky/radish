/* 
Radish
Version Control for a Adobe InDesign & InCopy

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

// 2011-12-28

// menu installer
radish.addMenuItems = function() {
	try {
		
		if (radish.menuItem) return;
		
		// Create the script menu action
		var mnuAction = app.scriptMenuActions.add(localize({en: "Versions...", ru: "Версии..."}));
		
		// Attach the event listener
		mnuAction.eventListeners.add('beforeDisplay', function(event) {
	    	try {
	    		event.target.enabled = false;
	    		if (!radish.prefs.enabled || !app.documents.length) return;
		    	try {
		    		var document = app.activeDocument;
		    	} catch (e) {
		    		return;
		    	}
		    	event.target.enabled = document.saved;
	    	} catch (e) {
	    		radish.errorLog.writeError(e, event);
	    	}
	    });
	 
	     mnuAction.eventListeners.add('onInvoke', function(event) {
	    	try {
		    	radish.showVersions();
	    	} catch (e) {
	    		radish.errorLog.writeError(e, event);
	    	}
	    });
		 
		// Create the menu item
		for (var i = app.menus.item(0).submenus.length; i--;) {
			var fileMenu = app.menus.item(0).submenus[i];
			var name = fileMenu.name;
			if (name.indexOf('File') >=0 || name.indexOf('Файл') >=0) {
				break;
			}
		}
		
		for (var i = fileMenu.menuItems.length; i--;){
			var refItem = fileMenu.menuItems[i];
			var name = refItem.name;
			if (name.indexOf('Revert') >= 0 || name.indexOf('Вернуть') >= 0) {
				break;
			}
		}
		radish.menuItem = fileMenu.menuItems.add(mnuAction, LocationOptions.after, refItem);
		
		// menu Save Version
		if (!radish.prefs.makeVersionWithEverySave) {
			var mnuSaveVersion = app.scriptMenuActions.add(localize({
					en: "Save Version", ru: "Сохранить версию"}));
			
			mnuSaveVersion.eventListeners.add('beforeDisplay', function(event) {
		    	try {
		    		event.target.enabled = false;
		    		if (!radish.prefs.enabled || !app.documents.length) return;
		    		try {
			    		// document may be without window
			    		var document = app.activeDocument;
		    		} catch (e) {
		    			return;
		    		}
			    	event.target.enabled = document.saved;
		    	} catch (e) {
		    		radish.errorLog.writeError(e, event);
		    	}
		    });
		    
		     mnuSaveVersion.eventListeners.add('onInvoke', function(event) {
		    	try {
		    		if (!radish.prefs.enabled || !app.documents.length) return;
		    		try {
			    		// document may be without window
			    		var document = app.activeDocument;
		    		} catch (e) {
		    			return;
		    		}
		    		// first save document
			    	try { 
			    		document.save();
			    	} catch (e) {
			    		alert('Radish\n' + e.message);
			    		radish.errorLog.writeError(e, event);
			    		return;
			    	}
			    	document.saveVersion(radish.prefs.versionsOfLinkedFiles, undefined, true);
		    	} catch (e) {
		    		radish.errorLog.writeError(e, event);
		    	}
		    });
			radish.menuSaveVersion = fileMenu.menuItems.add(mnuSaveVersion, LocationOptions.after, refItem);
		}
		// menu Rddish - Preferences
		var mnuPrefs = app.scriptMenuActions.add(localize({
			en: "Radish Preferences...", ru: "Настройки Radish..."}));
		//mnuPrefs.eventListeners.add('beforeDisplay', function(event) {
		//    event.target.enabled = true;
		//});
		mnuPrefs.eventListeners.add('onInvoke', function(event) {
	    	try {
	    		radish.editPreferences();
	    	} catch (e) {
	    		radish.errorLog.writeError(e, event);
	    	}
	    });
		radish.menuPreferences = fileMenu.menuItems.add(mnuPrefs, LocationOptions.after, refItem);
	} catch (e) {
		radish.errorLog.writeError(e, {command: 'radish.addMenuItem'});	
	}
}
