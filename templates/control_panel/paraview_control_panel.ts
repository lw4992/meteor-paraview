/// <reference path='../../../../../meteor-client-app/app/.typescript/package_defs/all-definitions.d.ts' />
/// <reference path='../../../../../meteor-client-app/app/.typescript/custom_defs/all-custom-definitions.d.ts' />

// [
//   { parent: {proxy}
//     children: [proxy, proxy, proxy]
//   }
// ]

var proxiesComputation: Tracker.Computation;

var createProxyGroups = function createProxyGroups(proxies) {
    //console.log('Stringified, proxies = ' + JSON.stringify(proxies, null, 4));
    var proxyGroups = [];

    proxies.forEach(function(proxy1) {
        if (proxy1.parent === '0') {
            var proxyGroup = {
                parent: proxy1,
                children: []
            };
            proxies.forEach(function(proxy2) {
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
        return PV.proxies.get();
    },
    proxyGroups: function () {
        var proxies =  PV.proxies.get();
        return createProxyGroups(proxies);
    }
});

Template['paraviewControlPanel']['events']({
    'change #orientation-axis-checkbox': function (event, tmpl) {
        //console.log('Checkbox changed');
        if (event.target.checked) PV.setOrientationAxesVisibility(true);
        else PV.setOrientationAxesVisibility(false);
    },
    'change [data-proxy-checkbox]': function (event, tmpl) {
        var proxyRepId = $(event.target).data('rep-id');
        if (event.target.checked) PV.setProxyVisibility(proxyRepId, true)
        else PV.setProxyVisibility(proxyRepId, false)
    },
    'click .pv-expander-collapser': function (event, tmpl) {
        event.preventDefault();
        var $target = $(event.target);
        var groupId = $target.closest('a').attr('href');
        $(groupId).slideToggle(500);
        $target.closest('a').toggle();
        $target.closest('a').siblings().toggle();
    },
    'slide .slider': function(event, tmpl) {
        var repId = $(event.target).closest('.slider').data('rep-id');
        var opacity = $('#slider-value-' + repId).text();
        PV.setProxyOpacity(Number(repId), Number(opacity));
    }
});

Template['paraviewControlPanel'].rendered = function () {
    var addedProxies = [];
    proxiesComputation = Tracker.autorun(function () {
        PV.proxies.get().forEach(function (proxy) {
            Meteor.setTimeout(function () {
                if (addedProxies.indexOf(proxy.rep) > -1) {
                    //console.log('returning!');
                    return;
                }
                //console.log('proxy.rep = ' + proxy.rep);

                var $slider = $('#slider-' + proxy.rep);
                if (!$slider.data('rep-id')) return;

                var opacity = PV.proxyOpacities[proxy.rep];

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

            }, 5000);

        });
    });
};

Template['paraviewControlPanel'].destroyed = function() {
    proxiesComputation && proxiesComputation.stop();
};