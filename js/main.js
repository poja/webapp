
/**
 * Allows getting and setting settings of tabs.
 * Updates the localStorage so that the information is kept throughout sessions.
 */
var settingsManager = (function (localStorage) {

	return {

		load: function (tabId) {
			var allSettings = JSON.parse(localStorage.getItem('tabSettings'));
			if (allSettings)
				return allSettings[tabId] || {};
			else return {};
		},

		save: function (tabId, settings) {
			var allSettings = JSON.parse(localStorage.getItem('tabSettings'));
			if (!allSettings) allSettings = {};

			if (tabId === undefined || settings === undefined)
				throw Error('Parmeters must not be undefined.');
			
			allSettings[tabId] = settings;
			localStorage.setItem('tabSettings', JSON.stringify(allSettings));
		}

	};

}(window.localStorage));


/**
 * Core module of the webapp.
 * 
 * Reponsible for all of the tab functionality, 
 * and for information pulled from server.
 */
var webapp = (function (UTILS, document, templateManager, hashService, settingsManager) {

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

		UTILS.ajax('./data/config.json', { done: function (serverData) {
			initTabs(serverData);
			updateNotification(serverData);
			initQuickActions(serverData);
			
			hashService.listen(checkTabChange);
			checkTabChange(hashService.getHash());
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

	function checkTabChange(newHash) {
		newHash = newHash.replace(/^#\//, '');
		var tabIds = tabControllers.map(function (contr) {
			return contr.tabId; 
		});
		if (!tabIds.includes(newHash)) return;

		tabControllers.forEach(function (controller) {
			if (controller.tabId === newHash)
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

		this.initEventListeners();

		this.loadSites();
	}
	TabController.prototype.initEventListeners = function () {
		var tab = this.tab;

		// Click event on the tab's navigation link
		this.link = document.querySelector('a[href="#' + this.tabId + '"]');
		if (this.link) {
			var tabId = this.tabId;
			this.link.addEventListener('click', function (e) {
				e.preventDefault();
				hashService.changeHash('/' + tabId);
			});
		}

		// Change event on the site selection
		tab.querySelector('select')
			.addEventListener('change', this.loadCurrentSite.bind(this));

		// Settings events: 

		// Click even on settings save button
		tab.querySelector('.SaveButton')
			.addEventListener('click', this.trySave.bind(this));

		// Click event on settings button
		tab.querySelector('.IconButton--settings')
			.addEventListener('click', (function (e) {
				e.preventDefault();
				this.loadSettings.call(this);
			})
			.bind(this));

		// Cancel
		tab.querySelector('.CancelButton')
			.addEventListener('click', (function () {
				this.changeMode('iframeMode');
			})
			.bind(this));

		// Key event on settings inputs, to release the given error
		UTILS.forEach(tab.querySelectorAll('input'), function (inputElement) {
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
	TabController.prototype.trySave = function () {
		if (!this.validateSettings()) return false;
		this.saveSites();
		this.loadSites();
	}
	TabController.prototype.validateSettings = function () {
		var urlRegex = /^(http:\/\/)?(https:\/\/)?([a-zA-Z0-9\-]+\.)+[a-zA-Z0-9\-]+(\/.*)?$/;

		error = false;
		function setError(element, errorDesc) {
			error = true;
			element.classList.add('hasError');
			element.querySelector('p').textContent = errorDesc;
		}

		var allRowsEmpty = true;

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
				setError(urlInputContainer, 'Please enter a valid URL.');

			if (name != '' || url != '')
				allRowsEmpty = false;
		});

		if (allRowsEmpty)
			setError(
				this.tab.querySelector('.SanitizedInput'), 
				'Please fill out one row.'
			);

		return !error;
	}
	TabController.prototype.saveSites = function () {
		var sites = [];
		var rows = this.tab.querySelectorAll('.SiteRow');
		UTILS.forEach(rows, function (row) {
			var name = row.querySelectorAll('input')[0].value,
				url = row.querySelectorAll('input')[1].value;
			if (name != '' && url != '') {
				if (!url.match(/^http(s)?:\/\//)) url = 'http://' + url;
				sites.push({
					name: name,
					url: url
				});
			}
		});
		settings = settingsManager.load(this.tabId);
		settings.sites = sites;
		settingsManager.save(this.tabId, settings);
	};
	TabController.prototype.loadSites = function () {
		var sites = settingsManager.load(this.tabId).sites;
		if (!sites || !(sites.length > 0)) return;

		var selectElement = this.tab.querySelector('select');
		selectElement.innerHTML = '';

		sites.forEach(function (site) {
			var option = document.createElement('option');
			option.value = site.url;
			option.textContent = site.name;
			selectElement.appendChild(option);
		});

		this.loadCurrentSite();
		this.changeMode('iframeMode');
	};
	TabController.prototype.loadCurrentSite = function () {
		var currentSite = this.tab.querySelector('select').value;
		var linkExternal = this.tab.querySelector('.IconButton--external'),
			iframe = this.tab.querySelector('iframe');
		
		linkExternal.href = currentSite;
		iframe.src = currentSite;
	};
	TabController.prototype.loadSettings = function () {
		if (this.getMode() === 'iframeMode') {
			var sites = settingsManager.load(this.tabId).sites;
			UTILS.forEach(this.tab.querySelectorAll('.SiteRow'), function (row, index) {
				
				var nameInput = row.querySelectorAll('input')[0],
					urlInput = row.querySelectorAll('input')[1];
				if (sites[index]) {
					nameInput.value = sites[index].name;
					urlInput.value = sites[index].url;
				}
				else {
					nameInput.value = '';
					urlInput.value = '';
				}

			});
			this.changeMode('settingsHoverMode');
		}
	};
	TabController.prototype.MODES = ['iframeMode', 'settingsMode', 'settingsHoverMode'];
	TabController.prototype.getMode = function () {
		var tab = this.tab;
		var ans = null;
		this.MODES.forEach(function (mode) {
			if (tab.classList.contains(mode))
				ans = mode;
		});
		return ans;
	};
	TabController.prototype.changeMode = function (newMode) {
		if (!this.MODES.includes(newMode)) throw Error('No such mode');

		var tab = this.tab;
		this.MODES.forEach(function (mode) {
			tab.classList.remove(mode);
		});
		tab.classList.add(newMode);
	};

	init();

}(UTILS, document, templateManager, hashService, settingsManager));