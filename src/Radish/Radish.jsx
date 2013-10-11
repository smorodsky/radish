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

// 2012-12-21

#targetengine "radish";

if (typeof radish == 'undefined') radish = {};

#include "File.jsx"
#include "FileR.jsx"
#include "Array.jsx"
#include "Date.jsx"
#include "Document.jsx"
#include "Log.jsx"
#include "Menu.jsx"
#include "Preferences.jsx"
#include "Progress.jsx"
#include "Versions.jsx"

// erase old listeners
radish.eventListeners && radish.eventListeners.forEach(function(listener) {
	listener.remove();
});
radish.eventListeners = [];

radish.errorLog = new radish.Log();

radish.appEventListener = function(event) {
	var document = event.target;
	
	if (!document || 
		document.constructor.name != 'Document' || 
		!document.saved ||
		radish.listenersDisabled ||
		'enable' != app.scriptArgs.getValue('radish') ||
		!radish.prefs.enabled) {
		
		return null;
	}
	var file = document.fullName;
	
	try {
		switch (event.eventType) {
//---------------------------------------------------------------------------
			case 'afterOpen':
				radish.prefs.useColorLabels && file.setColorLabel(7);
				document.fixRename();
				break;
//---------------------------------------------------------------------------
			case 'beforeSave':
				// write label for check renamed
				document.metadataPreferences.jobName = document.name;
				break;
//---------------------------------------------------------------------------
			case 'afterSave':
				if (2 == radish.prefs.mode) {
					document.saveVersion(
						radish.prefs.versionsOfLinkedFiles, 
						event.timeStamp);
				}
				break;
//---------------------------------------------------------------------------
			case 'afterSaveAs':
				radish.prefs.useColorLabels && file.setColorLabel(7);
				break;
//---------------------------------------------------------------------------
			case 'beforeClose':
				if (1 == radish.prefs.mode) {
					document.saveVersion(
						radish.prefs.versionsOfLinkedFiles, 
						event.timeStamp);
				}
				radish.prefs.useColorLabels && file.setColorLabel(0);
				break;
//---------------------------------------------------------------------------
		}
	} catch (e) {
		radish.errorLog.writeError(e, event);
	}
}

radish.eventListeners.push(app.addEventListener('afterOpen',   radish.appEventListener, false));
radish.eventListeners.push(app.addEventListener('beforeSave',  radish.appEventListener, false));
radish.eventListeners.push(app.addEventListener('afterSave',   radish.appEventListener, false));
radish.eventListeners.push(app.addEventListener('afterSaveAs', radish.appEventListener, false));
radish.eventListeners.push(app.addEventListener('beforeClose', radish.appEventListener, false));
radish.addMenuItems();
