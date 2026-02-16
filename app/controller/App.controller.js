sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], function (Controller, MessageToast) {
    "use strict";

    return Controller.extend("workshop.demo.controller.App", {
        onInit: function () {
            // Data loading is handled by individual controllers or bindings
        },

        onBotPress: function () {
            window.location.href = '/bot.html';
        },

        onODataPress: function () {
            window.open('/odata/v4/workshop/', '_blank');
        },

        onTabSelect: function (oEvent) {
            // Optional: lazy load or refresh logic here if needed
        }
    });
});
