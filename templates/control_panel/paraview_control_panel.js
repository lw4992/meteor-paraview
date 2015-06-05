/// <reference path='../../../../../meteor-client-app/app/.typescript/package_defs/all-definitions.d.ts' />
/// <reference path='../../../../../meteor-client-app/app/.typescript/custom_defs/all-custom-definitions.d.ts' />
// [
//   { parent: {proxy}
//     children: [proxy, proxy, proxy]
//   }
// ]
var proxiesComputation;
var addedProxies = []; // page-scoped so it doesn't try to render old proxies between pages
var createProxyGroups = function createProxyGroups(proxies) {
    //console.log('Stringified, elements = ' + JSON.stringify(elements, null, 4));
    var proxyGroups = [];
    proxies.forEach(function (proxy1) {
        if (proxy1.parent === '0') {
            var proxyGroup = {
                parent: proxy1,
                children: []
            };
            proxies.forEach(function (proxy2) {
                if (proxy2.parent === proxy1.id) {
                    proxyGroup.children.push(proxy2);
                }
            });
            proxyGroups.push(proxyGroup);
        }
    });
    //console.log('Stringified, proxyGroups = ' + JSON.stringify(proxyGroups, null, 4));
    return proxyGroups;
};
Template['paraviewControlPanel'].helpers({
    proxies: function () {
        return PV.elements.get();
    },
    proxyGroups: function () {
        var proxies = PV.elements.get();
        return createProxyGroups(proxies);
    }
});
Template['paraviewControlPanel']['events']({
    'change #orientation-axis-checkbox': function (event, tmpl) {
        //console.log('Checkbox changed');
        if (event.target.checked)
            PV.updateOrientationAxesVisibility(true);
        else
            PV.updateOrientationAxesVisibility(false);
    },
    'change [data-proxy-checkbox]': function (event, tmpl) {
        var proxyRepId = $(event.target).data('rep-id');
        if (event.target.checked)
            PV.updateElementVisibility(proxyRepId, true);
        else
            PV.updateElementVisibility(proxyRepId, false);
    },
    'click .pv-expander-collapser': function (event, tmpl) {
        event.preventDefault();
        var $target = $(event.target);
        var groupId = $target.closest('a').attr('href');
        $(groupId).slideToggle(500);
        $target.closest('a').toggle();
        $target.closest('a').siblings().toggle();
    },
    'slide .slider': function (event, tmpl) {
        var repId = $(event.target).closest('.slider').data('rep-id');
        var opacity = $('#slider-value-' + repId).text();
        PV.updateElementOpacity(Number(repId), Number(opacity));
    }
});
Template['paraviewControlPanel'].rendered = function () {
    proxiesComputation = Tracker.autorun(function () {
        Meteor.setTimeout(function () {
            var elements = PV.elements.get(); // reactive, triggers Tracker.autorun
            elements.forEach(function (proxy) {
                if (addedProxies.indexOf(proxy.rep) > -1) {
                    //console.log('returning!');
                    return;
                }
                //console.log('proxy.rep = ' + proxy.rep);
                var $slider = $('#slider-' + proxy.rep);
                if (!$slider.data('rep-id'))
                    return;
                var opacity = PV.elementOpacities[proxy.rep];
                $('#slider-' + proxy.rep).noUiSlider({
                    start: [opacity || 1],
                    step: .1,
                    connect: 'lower',
                    range: {
                        'min': [0],
                        'max': [1]
                    }
                });
                $('#slider-' + proxy.rep).Link('lower').to($('#slider-value-' + proxy.rep));
                addedProxies.push(proxy.rep);
            });
        }, 5000);
    });
};
Template['paraviewControlPanel'].destroyed = function () {
    proxiesComputation && proxiesComputation.stop();
};
//# sourceMappingURL=paraview_control_panel.js.map