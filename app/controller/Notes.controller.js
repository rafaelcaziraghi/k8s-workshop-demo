sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("workshop.demo.controller.Notes", {

        onInit: function () {
            this._loadNotes();
        },

        onRefresh: function () {
            this._loadNotes();
        },

        _loadNotes: function () {
            fetch('/odata/v4/workshop/Notes?$orderby=createdAt desc')
                .then(r => r.json())
                .then(data => {
                    this.getOwnerComponent().getModel("app").setProperty("/notes", data.value || []);
                })
                .catch(() => this.getOwnerComponent().getModel("app").setProperty("/notes", []));
        },

        onAddNote: function () {
            var model = this.getOwnerComponent().getModel("app");
            var title = model.getProperty('/newTitle');
            var content = model.getProperty('/newContent');
            var category = model.getProperty('/newCategory');

            if (!title) {
                MessageToast.show("Title is required");
                return;
            }

            fetch('/odata/v4/workshop/Notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: title, content: content, category: category, priority: 3 })
            })
                .then(r => {
                    if (!r.ok) throw new Error('Failed to create note');
                    model.setProperty('/newTitle', '');
                    model.setProperty('/newContent', '');
                    MessageToast.show("Note created!");
                    this._loadNotes();
                })
                .catch(err => MessageToast.show("Error: " + err.message));
        },

        onNotePress: function (oEvent) {
            var oNote = oEvent.getSource().getBindingContext("app").getObject();
            var that = this;

            MessageBox.confirm("Delete this note?", {
                onClose: function (action) {
                    if (action === MessageBox.Action.OK) {
                        fetch('/odata/v4/workshop/Notes(' + oNote.ID + ')', { method: 'DELETE' })
                            .then(() => {
                                MessageToast.show("Note deleted");
                                that._loadNotes();
                            })
                            .catch(err => MessageToast.show("Error: " + err.message));
                    }
                }
            });
        }
    });
});
