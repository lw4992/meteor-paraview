/// <reference path='../../../../../../../meteor-client-app/app/.typescript/custom_defs/all-custom-definitions.d.ts' />
/// <reference path='../../../../../../../meteor-client-app/app/.typescript/package_defs/all-definitions.d.ts' />
Template['paraviewSharedConsole'].helpers({
    helperName: function () {
    }
});
Template['paraviewSharedConsole'].onCreated(function () {
});
Template['paraviewSharedConsole'].onRendered(function () {
});
Template['paraviewSharedConsole'].onDestroyed(function () {
});
Template['paraviewSharedConsole'].events({
    'click .something': function (event, template) {
    }
});
Template['paraviewLogEntry'].helpers({
    formatDate: function (timestamp) {
        return moment(timestamp).format('YYYY-MM-DD hh:mm:ss');
    }
});
