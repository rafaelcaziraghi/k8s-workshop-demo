sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
    "use strict";

    return Controller.extend("workshop.demo.controller.Dashboard", {
        onInit: function () {
            var oModel = new JSONModel();
            this.getView().setModel(oModel, "dashboard");
            this._loadAppInfo();
        },

        _loadAppInfo: function () {
            fetch('/api/info')
                .then(r => r.json())
                .then(data => {
                    // Remap flat API structure to nested model structure expected by View
                    var mappedData = {
                        app: {
                            app: data.app,
                            version: data.version,
                            environment: data.environment,
                            hostname: data.hostname,
                            uptime: data.uptime
                        },
                        database: data.database,
                        features: data.features,
                        proxy: data.proxy,
                        resultsText: ""
                    };

                    // Set full data from re-mapped object
                    var model = this.getView().getModel("dashboard");
                    model.setData(mappedData);

                    // Process derived fields
                    var pgPool = data.database && data.database.pgPool || {};
                    var capDb = data.database && data.database.cap || {};
                    var isLocalDev = data.environment === 'development';
                    var isPgConfigured = pgPool.configured;
                    var isSqlite = capDb.kind === 'sqlite';

                    // Logic: 
                    // - Local Dev: Always SQLite, show Info/Success (not warning).
                    // - K8s Step 1: Prod + SQLite (Transient) -> SHOW WARNING "Not Configured".
                    // - K8s Step 2: Prod + Postgres -> SHOW SUCCESS "Connected".

                    var showNotConfiguredWarning = !isLocalDev && !isPgConfigured;
                    var statusMessage = '✅ Connected';
                    var statusState = 'Success';

                    if (showNotConfiguredWarning) {
                        statusMessage = '⚠️ Not Configured (Expected in Step 1)';
                        statusState = 'Warning';
                    } else if (isLocalDev) {
                        statusMessage = 'ℹ️ Local Dev (SQLite In-Memory)';
                        statusState = 'Information';
                    }

                    model.setProperty("/dbStatus", {
                        notConfigured: showNotConfiguredWarning,
                        message: statusMessage,
                        state: statusState,
                        pg: pgPool.connected ? 'Connected' : 'Disconnected',
                        cap: capDb.ready ? capDb.kind : 'Not connected'
                    });

                    model.setProperty("/proxyStatus", data.proxy.configured ? 'undici ProxyAgent' : 'Not active');
                })
                .catch(err => console.error(err));
        },

        _apiCall: function (url) {
            fetch(url).then(r => r.json()).then(data => {
                this.getView().getModel("dashboard").setProperty("/resultsText", JSON.stringify(data, null, 2));
            }).catch(err => {
                this.getView().getModel("dashboard").setProperty("/resultsText", "Error: " + err.message);
            });
        },

        onTestCapDb: function () { this._apiCall('/api/db/cap'); },
        onTestRawPg: function () { this._apiCall('/api/db/test'); },
        onTestInternal: function () { this._apiCall('/api/net/internal'); },
        onTestExternal: function () { this._apiCall('/api/net/external'); },
        onTestDns: function () { this._apiCall('/api/net/dns'); }
    });
});
