/// <reference path='../../../../../../meteor-client-app/app/.typescript/custom_defs/all-custom-definitions.d.ts' />
/// <reference path='../../../../../../meteor-client-app/app/.typescript/package_defs/all-definitions.d.ts' />
Template['paraviewRendererControls'].helpers({
    currentRendererId: function () {
        return PV.getRenderer();
    },
    renderers: function () {
        return [
            { id: 'image', displayName: 'Image' },
            { id: 'vgl', displayName: 'VGL' },
            { id: 'webgl', displayName: 'WebGL' }
        ];
    }
});
Template['paraviewRendererControls'].onCreated(function () {
});
Template['paraviewRendererControls'].onRendered(function () {
});
Template['paraviewRendererControls'].onDestroyed(function () {
});
Template['paraviewRendererControls'].events({
    'click [data-renderer-option]': function (event, templateInstance) {
        event.preventDefault();
        var rendererId = event.target.getAttribute('data-renderer-id');
        PV.setRenderer(rendererId);
    }
});
//# sourceMappingURL=paraview_renderer_controls.js.map