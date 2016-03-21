var webapp = webapp || {};

/**
 * Core module of the webapp.
 * 
 * Reponsible for all of the tab functionality, 
 * and for information pulled from server.
 */
(function main(webapp, UTILS, document, hashLocationService, setTimeout) {

	var tabControllers = [];

	function init() {

		function initSearch() {
			var searchForm = document.querySelector('#form-search');
			searchForm.addEventListener('submit', function (event) {
				event.preventDefault();
				doSearch();
				return false;
			});
		}

		function initTabs(serverData) {
			var tabs = document.querySelectorAll('.Tab');
			UTILS.forEach(tabs, function (tab, index) {
				var isSimple = tab.classList.contains('Tab--simple');
				var options = serverData.tabsList[index].options;
				tabControllers.push(new webapp.TabController(tab, isSimple, options));
			});
		}
		
		function initQuickActions(serverData) {

			function createActionItem(label, url) {
				var actionItem = document.createElement('li');
				var link = actionItem.appendChild(document.createElement('a'));
				link.textContent = label;
				link.href = url;
				link.target = '_blank';
				return actionItem;
			}

			var navTopics = document.querySelectorAll('.Nav-topic');
			serverData.quickActions.forEach(function (topicData, index) {
				var topicElement = navTopics[index];

				topicElement.querySelector('h2').innerHTML = topicData.label;
				topicElement.style.backgroundImage = 'url(./img/icons/' + topicData.icon + '.png)';
				topicElement.querySelector('.Menu-caption p').textContent = topicData.actionsLabel;
				
				var actionList = topicElement.querySelector('.Menu-actionList');
				actionList.innerHTML = '';

				topicData.actions.forEach(function (action) {
					actionItem = createActionItem(action.label, action.url);
					actionList.appendChild(actionItem);
				});
			});
		}

		function initCurrentTab() {
			if (!tabChangeHandler(hashLocationService.getHash())) {
				var lastTab = webapp.settingsManager.getLastTabName();
				if (lastTab) hashLocationService.changeHash('/' + lastTab);
			}
		}

		UTILS.ajax('./data/config.json', { 
			type: 'json',
			done: function (serverData) {
				initTabs(serverData);
				updateNotificationToText(serverData.notification);
				initQuickActions(serverData);
				initSearch();
				
				hashLocationService.listen(tabChangeHandler);
				initCurrentTab();
			}
		});	
	}


	function updateNotificationToText(text) {
		var notificationBar = document.querySelector('.NotificationBar');
		if (!text) {
			notificationBar.textContent = '';
			notificationBar.classList.add('empty');
		}
		else {
			notificationBar.textContent = text;
			notificationBar.classList.remove('empty');
			notificationBar.classList.add('emphasize');
			setTimeout(function () {
				notificationBar.classList.remove('emphasize');
			}, 500);
		}
	}

	function updateNotificationByServer() {
		UTILS.ajax('./data/config.json', { 
			type: 'json',
			done: function (serverData) {
				updateNotificationToText(serverData.notification);
			}
		});	
	}

	/**
	 * Extracts the information from the from #form-search.
	 * Try to find a report, that matches (its name includes) the search query
	 * If found, select this report. 
	 * Otherwise, change the notification to be a "not found" error.
	 */
	function doSearch() {
		var query = document.querySelector('#form-search input').value;
		var success = false;
		tabControllers.every(function (tabCtrl) {
			var report = tabCtrl.searchForReport(query);
			if (report) {
				tabCtrl.setCurrentReport(report.name);
				hashLocationService.changeHash('/' + tabCtrl.tabId);
				success = true;
			}
			else return true;
		});
		if (success)
			updateNotificationToText('');
		else
			updateNotificationToText('Sorry, the searched report ' + query + ' was not found.');
	}

	/**
	 * Checks the given hash, if it matches any tab.
	 * If it does, switch to that tab and return true.
	 * Else return false.
	 */
	function tabChangeHandler(newHash) {
		newHash = newHash.replace(/^#\//, '');
		var tabIds = tabControllers.map(function (contr) {
			return contr.tabId; 
		});
		if (!UTILS.includes(tabIds, newHash)) return false;

		tabControllers.forEach(function (controller) {
			if (controller.tabId === newHash) {
				controller.select();
				webapp.settingsManager.setLastTabName(controller.tabId);
			}
			else
				controller.deselect();
		});
		return true;
	}

	init();

}(webapp, UTILS, document, hashLocationService, window.setTimeout));