sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], function (Controller, MessageToast) {
    "use strict";

    return Controller.extend("workshop.demo.controller.Participants", {
        onInit: function () {
            this._loadParticipants();
        },

        onRefresh: function () {
            this._loadParticipants();
        },

        _loadParticipants: function () {
            fetch('/odata/v4/workshop/Participants?$orderby=createdAt desc')
                .then(r => r.json())
                .then(data => {
                    this.getOwnerComponent().getModel("app").setProperty('/participants', data.value || []);
                })
                .catch(() => this.getOwnerComponent().getModel("app").setProperty('/participants', []));
        },

        onAddParticipant: function () {
            var oInput = this.getView().byId("participantName");
            var name = oInput.getValue();

            if (!name) {
                MessageToast.show("Enter your name");
                return;
            }

            // We need hostname, which is on the server... or we can fetch app info again or store it globally.
            // Simplified: Fetch info if missing, or just assume it's set in dashboard model?
            // Better: just fetch it or hardcode 'unknown' and let server handle it? 
            // The server sets it effectively if we don't? No, schema says it's a field.
            // Let's rely on reading it from the Dashboard model if loaded, or fetch it.
            // Actually, for simplicity/speed, I'll just check if I can get it from the 'dashboard' model if properly shared.
            // But models are separate by default unless set on Component. 
            // I set 'app' on Component. 'dashboard' was set on Dashboard View.
            // Let's just fetch /api/info quickly or default to 'browser-client'.

            fetch('/api/info').then(r => r.json()).then(info => {
                this._postParticipant(name, info.hostname);
            }).catch(() => this._postParticipant(name, 'unknown'));
        },

        _postParticipant: function (name, hostname) {
            fetch('/odata/v4/workshop/Participants', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name,
                    hostname: hostname || 'unknown',
                    deployed: true
                })
            })
                .then(r => {
                    if (!r.ok) throw new Error('Failed to register');
                    this.getView().byId("participantName").setValue('');
                    MessageToast.show("Welcome, " + name + "! 🎉");
                    this._loadParticipants();
                })
                .catch(err => MessageToast.show("Error: " + err.message));
        }
    });
});
