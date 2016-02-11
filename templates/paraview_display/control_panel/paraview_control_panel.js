/// <reference path='../../../../../../meteor-client-app/app/.typescript/package_defs/all-definitions.d.ts' />
/// <reference path='../../../../../../meteor-client-app/app/.typescript/custom_defs/all-custom-definitions.d.ts' />
// addedProxies will have this structure
// [
//   { parent: {proxy}
//     children: [proxy, proxy, proxy]
//   }
// ]
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
Template['paraviewControlPanel'].events({
    'change #orientation-axis-checkbox': function (event, template) {
        if (event.target.checked)
            PV.updateOrientationAxesVisibility(true);
        else
            PV.updateOrientationAxesVisibility(false);
    },
    'change [data-proxy-checkbox]': function (event, template) {
        var proxyRepId = event.target.getAttribute('data-rep-id');
        if (event.target.checked)
            PV.updateElementVisibility(proxyRepId, true);
        else
            PV.updateElementVisibility(proxyRepId, false);
    },
    'click .panel-heading.collapsed': function (event, template) {
        event.preventDefault();
        var $target = $(event.target);
        var groupId = $target.closest('div').data('target');
        $(groupId).show(500);
        var $heading = $target.closest('.panel-heading');
        $heading.hide();
        $heading.siblings().show();
    },
    'click .panel-heading.expanded': function (event, template) {
        event.preventDefault();
        var $target = $(event.target);
        var groupId = $target.closest('div').data('target');
        $(groupId).slideToggle(500);
        $target.closest('.panel-heading').hide();
        $target.closest('.panel-heading').siblings().show();
    },
    'click .pv-expander-collapser': function (event, template) {
        event.preventDefault();
        var $target = $(event.target);
        var groupId = $target.closest('a').attr('href');
        console.log('groupId = ', groupId);
        $(groupId).slideToggle(500);
        $target.closest('.panel-heading').toggle();
        $target.closest('.panel-heading').siblings().toggle();
    },
    'click .slider': function (event, template) {
        var repId = event.target.closest('.slider').getAttribute('data-rep-id');
        var opacity = template.find('#slider-value-' + repId).innerHTML;
        PV.updateElementOpacity(Number(repId), Number(opacity));
    }
});
var createSliderUpdateEventHandler = function createSliderUpdateEventHandler($slider, $sliderValueDisplay) {
    $slider.noUiSlider.on('update', function (values, handle) {
        $sliderValueDisplay.innerHTML = values[handle];
    });
};
// Set slidern control display and number display
var setPageOpacityDisplays = function setPageOpacityDisplays($slider, $sliderValueDisplay, opacity) {
    $slider.noUiSlider.set(opacity);
    $sliderValueDisplay.innerHTML = opacity;
};
var createSlider = function createSlider($slider, opacity) {
    noUiSlider.create($slider, {
        start: [opacity],
        step: .1,
        connect: 'lower',
        range: {
            'min': 0,
            'max': 1
        }
    });
};
var isSliderCreated = function isSliderCreated(slider) {
    return slider.className.indexOf('noUi-target') > -1;
};
var sliderHasBeenAdded = function isTemplateDomReady(repId) {
    return addedProxies.indexOf(repId) > -1;
};
Template['paraviewControlPanel'].onRendered(function () {
    var _this = this;
    var elements = null, opacity = null, $slider = null, $sliderValueDisplay = null, intervalId = null;
    this.autorun(function () {
        elements = PV.elements.get(); // reactive, triggers Tracker.autorun
        if (!elements)
            return; // guard
        loda.waitForHTMLElement('.slider', function () {
            elements.forEach(function (proxy) {
                $slider = _this.find('#slider-' + proxy.rep);
                $sliderValueDisplay = _this.find('#slider-value-' + proxy.rep);
                opacity = PV.elementOpacities[proxy.rep] || 1; // won't find the element if it was never altered from default of 1, TODO: not the best strategy
                if (sliderHasBeenAdded(proxy.rep))
                    return;
                //waitForEquals(() => !$slider || !$slider.getAttribute('data-rep-id'), () => {});  // not necessary?
                if (!isSliderCreated($slider)) {
                    createSlider($slider, opacity);
                    addedProxies.push(proxy.rep);
                }
                setPageOpacityDisplays($slider, $sliderValueDisplay, opacity);
                createSliderUpdateEventHandler($slider, $sliderValueDisplay);
            });
        });
    });
});
//# sourceMappingURL=paraview_control_panel.js.map