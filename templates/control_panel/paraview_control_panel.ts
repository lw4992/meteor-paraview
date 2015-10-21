/// <reference path='../../../../../meteor-client-app/app/.typescript/package_defs/all-definitions.d.ts' />
/// <reference path='../../../../../meteor-client-app/app/.typescript/custom_defs/all-custom-definitions.d.ts' />

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
        if (event.target.checked) PV.updateOrientationAxesVisibility(true);
        else PV.updateOrientationAxesVisibility(false);
    },
    'change [data-proxy-checkbox]': function (event, template) {
        var proxyRepId = event.target.getAttribute('data-rep-id');
        if (event.target.checked) PV.updateElementVisibility(proxyRepId, true);
        else PV.updateElementVisibility(proxyRepId, false)
    },
    'click .pv-expander-collapser': function (event, template) {
        event.preventDefault();
        var $target = $(event.target);
        var groupId = $target.closest('a').attr('href');
        $(groupId).slideToggle(500);
        $target.closest('a').toggle();
        $target.closest('a').siblings().toggle();
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

var isTemplateDomReady = function isTemplateDomReady($slider, opacity, repId) {
    if (addedProxies.indexOf(repId) > -1) return false;
    if (!$slider.getAttribute('data-rep-id')) return false;
    if (!opacity) return false;
    return true;
};

// Not sure why doesn't work with Template().instance.find() instead of JQuery select
var isSliderElementDisplayed = function isSliderElementDisplayed() {
    return $('.slider');
};

Template['paraviewControlPanel'].onRendered(function () {
    var elements = null,
        opacity = null,
        $slider = null,
        $sliderValueDisplay = null,
        intervalId = null;

    this.autorun(() => {
        elements = PV.elements.get(); // reactive, triggers Tracker.autorun
        intervalId = Meteor.setInterval(() => {
            if (isSliderElementDisplayed())  {
                Meteor.clearInterval(intervalId);
            } else {
                return;
            }

            elements.forEach((proxy) => {
                $slider = this.find('#slider-' + proxy.rep);
                $sliderValueDisplay = this.find('#slider-value-' + proxy.rep);
                opacity = PV.elementOpacities[proxy.rep];
                if (!isTemplateDomReady($slider, opacity, proxy.rep)) return;

                if (!isSliderCreated($slider)) {
                    createSlider($slider, opacity);
                    addedProxies.push(proxy.rep);
                }

                setPageOpacityDisplays($slider, $sliderValueDisplay, opacity);
                createSliderUpdateEventHandler($slider, $sliderValueDisplay);
            });
        }, 100);
    });
});