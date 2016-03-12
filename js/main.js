var webapp = webapp || {};

/**
 * Core module of the webapp.
 * 
 * Reponsible for all of the tab functionality, 
 * and for information pulled from server.
 */
(function main(webapp, UTILS, document, hashLocationService) {

	var tabControllers = [];

	function init() {

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

				topicElement.querySelector('p').innerHTML = topicData.label;
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
				updateNotification(serverData);
				initQuickActions(serverData);
				
				hashLocationService.listen(tabChangeHandler);
				initCurrentTab();
			}
		});	
	}

	function updateNotification(serverData) {
		var notificationBar = document.querySelector('.NotificationBar');
		if (!serverData.notification) {
			notificationBar.textContent = '';
			notificationBar.classList.add('empty');
		}
		else {
			notificationBar.textContent = serverData.notification;
			notificationBar.classList.remove('empty');
		}
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

}(webapp, UTILS, document, hashLocationService));