sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "sap/ui/model/json/JSONModel"
], function (UIComponent, Device, JSONModel) {
    "use strict";

    return UIComponent.extend("workshop.demo.Component", {

        metadata: {
            manifest: "json"
        },

        init: function () {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // set the device model
            var oDeviceModel = new JSONModel(Device);
            oDeviceModel.setDefaultBindingMode("OneWay");
            this.setModel(oDeviceModel, "device");

            // set app model (local UI state)
            var oAppModel = new JSONModel({
                view: "Dashboard", // current view
                notes: [],
                newTitle: "",
                newContent: "",
                newCategory: "General",
                participants: []
            });
            this.setModel(oAppModel, "app");
        }
    });
});
