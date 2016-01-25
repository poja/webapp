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
		// TODO change URL hash
		event.preventDefault();
		tabControllers.forEach(function (controller) {
			if (controller.tabId === clickedTabCont.tabId)
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

		this.setEventListeners();
		this.loadSites();
	}
	TabController.prototype.setEventListeners = function () {
		this.link = document.querySelector('a[href="#' + this.tabId + '"]');
		if (this.link)
			this.link.addEventListener('click', selectTabHandler.bind(this.link, this));

		this.tab.querySelector('.SaveButton')
			.addEventListener('click', this.validateSettings.bind(this)); // TODO

		UTILS.forEach(this.tab.querySelectorAll('input'), function (inputElement) {
			inputElement.addEventListener('keyup', function () {
				inputElement.parentElement.classList.remove('hasError');
			});
		});
	}
	TabController.prototype.select = function () {
		this.tab.classList.add('selected');
		this.link.parentElement.classList.add('selected');
	}
	TabController.prototype.deselect = function () {
		this.tab.classList.remove('selected');
		this.link.parentElement.classList.remove('selected');
	}
	TabController.prototype.saveSettings = function () {
		if (!this.validateSettings()) return false;
		this.saveSites();
		this.loadSites();
	}
	TabController.prototype.validateSettings = function () {
		var urlRegex = /^(http:\/\/)?(https:\/\/)?([a-zA-Z0-9]+\.)+[a-zA-Z0-9]+(\/.*)?$/;

		function setError(element, errorDesc) {
			element.classList.add('hasError');
			element.querySelector('p').textContent = errorDesc;
		}

		var rows = this.tab.querySelectorAll('.SiteRow');
		UTILS.forEach(rows, function (row) {
			var nameInputContainer = row.querySelectorAll('.SanitizedInput')[0],
				name = nameInputContainer.querySelector('input').value,
				urlInputContainer = row.querySelectorAll('.SanitizedInput')[1];
				url = urlInputContainer.querySelector('input').value;
			if (name === '' && url !== '')
				setError(nameInputContainer, 'Please fill out this field.');
			if (name !== '' && url === '')
				setError(urlInputContainer, 'Please fill out this field.');
			if (url != '' && !url.match(urlRegex))
				setError(urlInputContainer, 'Invalid URL.');
		});
	}
	TabController.prototype.saveSites = function () {
		// TODO
	};
	TabController.prototype.loadSites = function () {
		// TODO
	};

	init();

}(UTILS, document, templateManager));