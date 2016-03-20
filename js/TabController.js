var webapp = webapp || {};
webapp.TabController = (function (webapp, UTILS, document, templateManager, hashLocationService) {


	function TabController(tab, isSimple, serverOptions) {
		this.tabId = tab.getAttribute('id');
		this.tab = tab;

		serverOptions.id = this.tabId;
		var tabContent = templateManager.createElement('tab-content', serverOptions);
		tab.appendChild(tabContent);

		this.initEventListeners();

		this.loadSites();

		if (isSimple && serverOptions.url)
			this.tab.querySelector('iframe').src = serverOptions.url;
	}
	TabController.prototype.initEventListeners = function () {
		var tab = this.tab,
			that = this;

		// Click event on the tab's navigation link
		this.link = document.querySelector('a[href="#' + this.tabId + '"]');
		if (this.link) {
			var tabId = this.tabId;
			this.link.addEventListener('click', function (e) {
				e.preventDefault();
				hashLocationService.changeHash('/' + tabId);
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
			inputElement.addEventListener('keyup', function (e) {
				var ENTER_KEY = 13, 
					ESCAPE_KEY = 27;
				inputElement.parentElement.classList.remove('hasError');
				if (e.keyCode === ENTER_KEY)
					that.trySave();
				else if (e.keyCode === ESCAPE_KEY && that.getMode() === 'settingsHoverMode') 
					that.changeMode('iframeMode');
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

		// Clean Start
		UTILS.forEach(this.tab.querySelectorAll('.SanitizedInput'), function (input) {
			input.classList.remove('hasError');
		});
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
		settings = webapp.settingsManager.loadTab(this.tabId);
		settings.sites = sites;
		webapp.settingsManager.saveTab(this.tabId, settings);
	};
	TabController.prototype.loadSites = function () {
		var sites = webapp.settingsManager.loadTab(this.tabId).sites;
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
	TabController.prototype.setCurrentReport = function (reportNamePart) {
		var report = this.searchForReport(reportNamePart);
		var siteSelect = this.tab.querySelector('select');

		if (!report) return false;
		siteSelect.value = report.url;
		this.loadCurrentSite();
	};
	/**
	 * Find a report, in the format { name: , url: },
	 * That is in this tab and its name contains the queryString
	 * Return null if none such exist
	 */
	TabController.prototype.searchForReport = function(queryString) {
		var settings = webapp.settingsManager.loadTab(this.tabId);
		if (!settings) return null;
		var sites = settings.sites;
		if (!sites) return null;

		var answer = null;
		sites.every(function (site) {
			if (site.name.search(queryString) >= 0)
				answer = site;
			else return true;
		});
		return answer;
	};
	TabController.prototype.loadSettings = function () {
		if (this.getMode() === 'iframeMode') {
			var sites = webapp.settingsManager.loadTab(this.tabId).sites;
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
		if (!UTILS.includes(this.MODES, newMode)) throw Error('No such mode');

		var tab = this.tab;
		this.MODES.forEach(function (mode) {
			tab.classList.remove(mode);
		});
		tab.classList.add(newMode);
	};

	return TabController;


})(webapp, UTILS, document, templateManager, hashLocationService);
