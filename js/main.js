var webapp = (function (UTILS, document, templateManager) {

	var tabControllers = [];

	function init() {

		function initTabs(serverData) {
			var tabs = document.querySelectorAll('.Tab');
			UTILS.forEach(tabs, function (tab, index) {
				var isSimple = tab.classList.contains('.Tab--simple');
				var options = serverData.tabsList[index].options;
				tabControllers.push(new TabController(tab, isSimple, options));
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
				topicElement.style.backgroundImage = 'url(../img/icons/' + topicData.icon + '.png)';
				topicElement.querySelector('.Menu-caption p').textContent = topicData.actionsLabel;
				
				var actionList = topicElement.querySelector('.Menu-actionList');
				actionList.innerHTML = '';

				topicData.actions.forEach(function (action) {
					actionItem = createActionItem(action.label, action.url);
					actionList.appendChild(actionItem);
				});
			});
		}

		UTILS.ajax('../data/config.json', { done: function (response) {
			serverData = JSON.parse(response);
			initTabs(serverData);
			updateNotification(serverData);
			initQuickActions(serverData);
		}});	
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

	function selectTabHandler(clickedTabCont, event) {
		event.preventDefault();
		tabControllers.forEach(function (controller) {
			if (controller.tabId == clickedTabCont.tabId)
				controller.select();
			else
				controller.deselect();
		});
	}


	function TabController(tab, isSimple, serverOptions) {
		this.tabId = tab.getAttribute('id');
		this.tab = tab;

		serverOptions.url = serverOptions.url || '';
		serverOptions.id = this.tabId;
		var tabContent = templateManager.createElement('tab-content', serverOptions);
		tab.appendChild(tabContent);

		this.link = document.querySelector('a[href="#' + this.tabId + '"]');
		if (this.link)
			this.link.addEventListener('click', selectTabHandler.bind(this.link, this));
	}
	TabController.prototype.select = function () {
		this.tab.classList.add('selected');
		this.link.parentElement.classList.add('selected');
	}
	TabController.prototype.deselect = function () {
		this.tab.classList.remove('selected');
		this.link.parentElement.classList.remove('selected');
	}
	TabController.prototype.refresh = function () {

	};

	init();

}(UTILS, document, templateManager));