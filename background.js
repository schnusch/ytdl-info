"use strict";
function quote_plus(x) {
	return encodeURIComponent(x).split("%20").join("+");
}
browser.browserAction.onClicked.addListener(tab => {
	browser.tabs.create({
		openerTabId: tab.id,
		url:         browser.runtime.getURL("info.xhtml") + "?u=" + quote_plus(tab.url),
	});
});
