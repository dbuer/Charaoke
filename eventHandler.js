// notifies other scripts when the tab icon is clicked
chrome.browserAction.onClicked.addListener(function(tab) {
	chrome.tabs.sendMessage(tab.id, {task: 'toggle', page: 0});
});