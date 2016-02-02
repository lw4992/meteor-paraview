/// <reference path='../../../../../../meteor-client-app/app/.typescript/custom_defs/all-custom-definitions.d.ts' />
/// <reference path='../../../../../../meteor-client-app/app/.typescript/package_defs/all-definitions.d.ts' />


Template['paraviewRendererControls'].helpers({
    currentRendererId() {
        return PV.getRenderer();
    },
    renderers() {
        return [
            {id: 'image', displayName: 'Image'},
            {id: 'vgl', displayName: 'VGL'},
            {id: 'webgl', displayName: 'WebGL'}
        ]
    }
});

Template['paraviewRendererControls'].onCreated(function () {

});

Template['paraviewRendererControls'].onRendered(function () {

});

Template['paraviewRendererControls'].onDestroyed(function () {

});

Template['paraviewRendererControls'].events({
    'click [data-renderer-option]'(event:Meteor.Event, templateInstance: Blaze.Template) {
        event.preventDefault();
        var rendererId = event.target.getAttribute('data-renderer-id');
        PV.setRenderer(rendererId);
    }
});