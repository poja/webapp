var webapp = webapp || {};

/**
 * Allows getting and setting settings of tabs.
 * Updates the localStorage so that the information is kept throughout sessions.
 */
webapp.settingsManager = (function (localStorage) {

	return {

		loadTab: function (tabId) {
			var allSettings = JSON.parse(localStorage.getItem('settings'));
			if (allSettings && allSettings.tabs)
				return allSettings.tabs[tabId] || {};
			else return {};
		},

		saveTab: function (tabId, settings) {
			var allSettings = JSON.parse(localStorage.getItem('settings'));
			if (!allSettings) allSettings = { tabs: {} };

			if (tabId === undefined || settings === undefined)
				throw Error('Parmeters must not be undefined.');
			
			allSettings.tabs[tabId] = settings;
			localStorage.setItem('settings', JSON.stringify(allSettings));
		},

		getLastTabName: function () {
			var allSettings = JSON.parse(localStorage.getItem('settings'));
			if (!allSettings) return null;
			return allSettings.lastTab;
		},

		setLastTabName: function (name) {
			var allSettings = JSON.parse(localStorage.getItem('settings'));
			if (!allSettings) allSettings = { tabs: {} };
			allSettings.lastTab = name;
			localStorage.setItem('settings', JSON.stringify(allSettings));
		}

	};

}(window.localStorage));
