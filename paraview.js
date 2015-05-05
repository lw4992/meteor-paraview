/// <reference path='../../../meteor-client-app/app/.typescript/package_defs/all-definitions.d.ts' />
/// <reference path='../../../meteor-client-app/app/.typescript/custom_defs/all-custom-definitions.d.ts' />
var connectionComputation;
PV = {
    session: null,
    viewport: null,
    paused: true,
    lastFrameTime: 0,
    currentFrameTime: 0,
    filterProperties: {},
    filterUI: {},
    proxies: new ReactiveVar([]),
    proxyOpacities: {},
    proxySettings: [],
    lastMTime: 0,
    activeViewId: -1,
    mainProxyId: 0,
    activeSourceId: 0,
    activeRepId: 0,
    fileProxyIdMap: {},
    filesForRemoval: [],
    viewportCssId: '#paraview-viewport',
    activeColorArrayLocation: '',
    activeColorArrayName: '',
    serverSessionManagerUrl: '',
    serverSessionUrl: '',
    backgroundSetting: {
        id: 0,
        value: [0.9765, 0.9765, 0.9765],
        name: "Background"
    },
    scalarBar: new ReactiveVar({
        display: false,
        areDiscreteValues: false,
        labelsAndColors: []
    })
};
/**
 *  @module PV
 */
/**
 *
 * @type {ReactiveVar<ScalarBarOpts>} scalarBar - A custom scalar bar that is the key for any coloring in the visualization
 */
PV.scalarBar = new ReactiveVar({
    display: false,
    areDiscreteValues: false,
    labelsAndColors: []
});
//PV.setScalarBar = function(opts, asyncCallback?: iPVCallback) {
////    console.log('** Starting setScalarBarSyncable, visibilityMap = ' + JSON.stringify(options.visibilityMap));
//    PV.session.call('pv.color.manager.scalarbar.visibility.set', [options.visibilityMap]).then(function(result) {
//        if (!options.noCallback) asyncCallback && asyncCallback(null, {success: true});  // Doesn't seem like this needs to block, but bad if a new layer became last layer before completion
//    }, asyncCallback);
//};
//
//PV.removeScalarBar = function(sourceId, asyncCallback?: iPVCallback) {
//    var scalarBarOptions = {
//        visibilityMap: {}
//    };
//    scalarBarOptions.visibilityMap[sourceId] = false;
//    PV.setScalarBar(scalarBarOptions, asyncCallback);
//};
//
//PV.removeAllScalarBars = function(asyncCallback?: iPVCallback) {
////    console.log('** Starting removeAllScalarBarsSyncable()');
//    if (!PV.proxies || PV.proxies.length === 0) return asyncCallback && asyncCallback(null, {success: true});
//    _.each(PV.proxies, function(proxy, i) {
//        var scalarBarOptions = {
//            visibilityMap: {}
//        };
//        scalarBarOptions.visibilityMap[proxy.id] = false;
//        if (i !== PV.proxies.length - 1) scalarBarOptions.noCallback = true;
//        PV.setScalarBar(scalarBarOptions, asyncCallback);
//    });
//};
/**
 * This is the standard Node-style callback that is passed into all methods listed below.
 *
 * @callback requestCallback
 * @param {Object} error -- null (or undefined) if no error, an error object if there is an error
 * @param {Object} success -- undefined if error, some success object if method completes successfully
 */
/**
 * Set initial configurations for paraview, such as viewportCssId or backgroundSetting.
 *
 * @param {Object} opts - configuration options
 * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
 * @example
 *         PV.config({
 *             serverSessionManagerUrl: 'http://localhost:9000/paraview',
 *             viewportCSSId: '#paraview-viewport',
 *             backgroundSetting: {
 *                 value: [0.9765, 0.9765, 0.9765],  // Equivalent to RGB color #f9f9f9
 *                 name: "Background"
 *         });
 */
PV.config = function config(opts, asyncCallback) {
    _.extend(PV, opts);
    asyncCallback && asyncCallback(null, { success: true });
};
/**
 * Remove all the artifacts from the server.
 *
 * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
 */
PV.removeAllProxies = function removeAllProxies(asyncCallback) {
    //    console.log('** Starting removeAllProxiesSyncable()');
    var numProxies = PV.proxies.get().length;
    if (numProxies === 0)
        asyncCallback(null, { success: true });
    var i = numProxies;
    while (i--) {
        if (i === 0) {
            PV.removeProxy(JSON.parse(JSON.stringify(PV.proxies.get()[i].id)), asyncCallback);
        }
        else {
            PV.removeProxy(JSON.parse(JSON.stringify(PV.proxies.get()[i].id)), asyncCallback);
        }
    }
};
/**
 * Remove single proxy from the server
 *
 * @param {number} proxyId - id of proxy to be removed
 * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
 */
PV.removeProxy = function removeProxy(proxyId, asyncCallback) {
    //    console.log('** Starting removeProxySyncable(), options.proxyId = ' + removalOptions.proxyId);
    PV.session.call('pv.proxy.manager.delete', [proxyId]).then(function (result) {
        asyncCallback && asyncCallback(null, { success: true });
    }, asyncCallback);
};
PV._connect = function connect() {
    Session.set('pvwConnected', false);
    var config = {
        // From client/lib/paraview/lib/core/vtkWebAll.js, which is set by Meteor.settings.public.paraview.sessionManagerURL
        sessionManagerURL: PV.serverSessionManagerUrl,
        //sessionManagerURL: Meteor.settings['public']['paraview']['sessionManagerUrl'],
        //        sessionURL: vtkWeb.properties.sessionURL,  // Don't use so that sessionManagerURL is used
        application: "pipeline"
    };
    console.log('ParaView connection config = ' + JSON.stringify(config, null, 4));
    var stop = vtkWeb.NoOp;
    var start = function (connection) {
        //console.log('Stringified, connection = ' + JSON.stringify(connection, null, 4));
        PV.session = connection.session;
        // Update stop method to use the connection
        stop = function () {
            connection.session.call('vtk:exit');
            PV.session = null;
            Session.set('pvwInitialized', false);
            PV.removeAllProxies(function (error, result) {
                if (error)
                    return PV._onError(error);
            });
        };
        Session.set('pvwConnected', true);
        //        console.log('ending start function, PV.session = ' + JSON.stringify(PV.session, null, 4));
    };
    vtkWeb.smartConnect(config, start, function (code, reason) {
        //$(".loading").hide();
        console.log(reason);
        PV.session = null;
        Session.set('pvwInitialized', false);
        PV.removeAllProxies(function (error, result) {
            if (error)
                return PV._onError(error);
        });
    });
};
PV._bindViewport = function _bindViewport(session) {
    var viewportOptions = {
        session: session || PV.session,
        view: -1,
        enableInteractions: true,
        renderer: 'image' //image or webgl
    };
    var viewport = vtkWeb.createViewport(viewportOptions);
    viewport.bind(PV.viewportCssId);
    PV.viewport = viewport;
};
/**
 * Creates a session with the ParaView session if one does not exist already.  Reuses existing session if one already exists.
 *
 * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
 */
PV.initSession = function initSession(asyncCallback) {
    //console.log('** Starting initSession(), asyncCallback = ' + asyncCallback);
    if (!PV.session) {
        Session.set('pvwConnected', false);
        console.log('Creating connection and session with ParaView Server...');
        PV._connect();
        connectionComputation = Tracker.autorun(function () {
            var isConnected = Session.get('pvwConnected');
            if (isConnected) {
                PV._bindViewport(); // I think all of this is synchronous
                //                console.log('Completed initializeSyncable(), PV.session._wsuri = ' + PV.session._wsuri + ',  PV.session._session_id = ' + PV.session._session_id + ',  PV.session._websocket_connected = ' + PV.session._websocket_connected);
                console.log('Created session with ParaView server, PV.session._id = ' + PV.session._id + ',  PV.session._socket.url = ' + PV.session._socket.url + ',  PV.session._socket.readyState = ' + PV.session._socket.readyState);
                //console.log('PV.session = ' + JSON.stringify(PV.session, null, 4));
                PV._saveServerProxyInfo(asyncCallback);
                //asyncCallback && asyncCallback(null, {success: true});
                connectionComputation.stop();
            }
        });
    }
    else {
        console.log('Already connected to ParaView Server, reusing session');
        PV._bindViewport();
        PV._saveServerProxyInfo(asyncCallback);
    }
};
PV._onError = function _onError(error) {
    console.log('Error: ' + JSON.stringify(error));
};
// Given an array of proxies, return the proxy with the given proxyId
PV._getProxy = function _getProxy(proxies, proxyId) {
    var proxy = _.find(proxies, function (proxy) {
        return proxy.id === proxyId;
    });
    return proxy;
};
PV._getRepId = function _getRepId(proxies, proxyId) {
    var proxy = PV._getProxy(proxies, proxyId);
    return proxy && proxy.rep;
};
// Proxies are returned by the paraview server in any order.  Save the proxy info in the order the proxies were created.
PV._saveServerProxyInfo = function _saveServerProxyInfo(asyncCallback) {
    //    console.log('** Starting setProxiesFromServer()');
    PV.session.call('pv.proxy.manager.list').then(function (result) {
        if (result && result.view)
            PV.activeViewId = result.view;
        //console.log('result.view = ' + result.view);
        if (result && result.sources && result.sources.length !== 0) {
            PV.activeSourceId = PV.activeSourceId || result.sources[result.sources.length - 1].id; // If calling for first time, make last proxy the active one
            PV.activeRepId = PV._getRepId(result.sources, PV.activeSourceId);
            var proxies = _.sortBy(result.sources, function (proxy) {
                return proxy.id;
            });
            PV.proxies.set(proxies);
        }
        //        console.log('PV.proxies.get() = ' + JSON.stringify(PV.proxies.get()));
        asyncCallback && asyncCallback(null, { success: true });
    }, asyncCallback);
};
/**
 * Render a file, which should be accessible by the ParaView server.
 *
 * @param path
 * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
 */
PV.addFile = function addFile(path, asyncCallback) {
    console.log('Starting addFile(), relativeFilePath = ' + path);
    PV.session.call("pv.proxy.manager.create.reader", [path]).then(function (reply) {
        console.log('pv.proxy.manager.create.reader() reply = ' + JSON.stringify(reply));
        PV.mainProxyId = reply.id;
        PV.activeSourceId = reply.id;
        PV.fileProxyIdMap[path] = reply.id;
        PV._saveServerProxyInfo(asyncCallback);
    }, asyncCallback);
};
/**
 * Refresh the viewport with any changes to the server
 *
 * @param {number} width - optional width.  Default is width of element specified by viewportCssId
 * @param {number} height - optional height.  Default is height of element specified by viewportCssId
 * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
 */
PV.render = function render(width, height, asyncCallback) {
    //console.log('** Starting render(), width = ' + width);
    var width = width || $(PV.viewportCssId).innerWidth();
    var height = height || $(PV.viewportCssId).innerHeight();
    var renderCfg = {
        "size": [width, height],
        "view": PV.activeViewId,
        "mtime": PV.lastMTime,
        "quality": 100,
        "localTime": Date.now()
    };
    //console.log('rendering with viewport size = ' + renderCfg.size);
    PV.session.call("viewport.image.render", [renderCfg]).then(function (result) {
        //console.log('viewport.image.render result = ' + JSON.stringify(result, null, 4));
        PV.lastMTime = result.mtime;
        PV.viewport.invalidateScene();
        if (asyncCallback)
            asyncCallback(null, { success: true });
    });
};
/**
 * Recenter and rescale all visible visualizations.  Calls PV.render() to display changes.
 *
 * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
 */
PV.resetViewport = function resetViewport(asyncCallback) {
    //console.log('** Starting resetViewPort(), PV.activeViewId = ' + PV.activeViewId);
    if (!PV.session) {
        asyncCallback && asyncCallback(null, { success: true });
        return;
    }
    //Session.get('graphicsViewportSize');  // sole purpose of this line is to enable this function to be reactive if wrapped in a Deps.autorun, so a viewport size change will trigger this function again.
    PV.session.call("viewport.camera.reset", [PV.activeViewId]).then(function (result) {
        //        console.log('viewport.camera.reset result = ' + JSON.stringify(result));
        PV.render(null, null, asyncCallback);
    });
};
/**
 * Color a proxy (layer).  Called by PV.colorCells() and PV.colorPoints().
 *
 * @param {Array} displayProps
 * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
 */
// API options found here:  http://www.paraview.org/ParaView3/Doc/Nightly/www/js-doc/index.html#!/api/protocols.ParaViewWebColorManager
// A complete displayProps should look like [PV.activeRepId, colorMode, arrayLocation, arrayName, vectorMode, vectorComponent, rescale];
PV.colorProxy = function colorProxy(displayProps, asyncCallback) {
    //console.log('colorProxy(), displayProps = ' + JSON.stringify(displayProps, null, 4));
    PV.session.call('pv.color.manager.color.by', displayProps).then(function () {
        asyncCallback && asyncCallback(null, { success: true }); // Doesn't seem like this needs to block, but \bad if a new layer became last layer before completion
    }, asyncCallback);
};
/**
 * Colors cells of a visualization.  Calls colorProxy([<activRepId>, 'ARRAY', 'CELLS', layerName])
 *
 * @param {string} layerName - name of layer, specified in visualization file
 * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
 */
PV.colorCells = function colorCells(layerName, asyncCallback) {
    PV.colorProxy([PV.activeRepId, 'ARRAY', 'CELLS', layerName], asyncCallback);
};
/**
 * Colors points of a visualization.  Calls colorProxy([<activRepId>, 'ARRAY', 'POINTS', layerName, 'Magnitude', 0, true]) *
 *
 * @param {string} layerName - name of layer, specified in visualization file
 * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
 */
PV.colorPoints = function (layerName, asyncCallback) {
    var displayProps = [PV.activeRepId, 'ARRAY', 'POINTS', layerName, 'Magnitude', 0, true];
    PV.colorProxy(displayProps, asyncCallback);
};
/**
 * Specify colorMap to use.
 *
 * @param {string} paletteName - name of the color map as it appears in the file
 * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
 */
PV.setPalette = function setPalette(paletteName, asyncCallback) {
    //console.log('setPalatteSyncable(), calling pv.color.manager.select.preset with param = ' + JSON.stringify(paletteOptions));
    var paletteOptions = [PV.activeRepId, paletteName];
    PV.session.call('pv.color.manager.select.preset', paletteOptions).then(function (result) {
        //console.log('color manager result = ' + JSON.stringify(result, null, 4));
        if (asyncCallback)
            asyncCallback(null, { success: true }); // Doesn't seem like this needs to block, but \bad if a new layer became last layer before completion
    }, asyncCallback);
};
/**
 * Sets opacity of a specific proxy
 *
 * @param proxyRepId
 * @param opacity
 * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
 */
PV.setProxyOpacity = function setOpacity(proxyRepId, opacity, asyncCallback) {
    //    console.log('** Starting setProxyOpacity()');
    var settings = {
        id: proxyRepId,
        name: "Opacity",
        value: opacity
    };
    PV.proxySettings.push(settings);
    PV.proxyOpacities[proxyRepId] = opacity;
    PV._updateServerProxySettings(asyncCallback);
};
/**
 * Sets opacity of last rendered proxy
 *
 * @param opacity
 * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
 */
PV.setOpacity = function setOpacity(opacity, asyncCallback) {
    //    console.log('** Starting setOpacity()');
    PV.setProxyOpacity(PV.activeRepId, opacity, asyncCallback);
    //var settings = {
    //    id: PV.activeRepId,
    //    name: "Opacity",
    //    value: opacity
    //};
    //
    //PV.proxySettings.push(settings);
    //PV._updateServerProxySettings(asyncCallback);
};
/**
 * Add a filter to last rendered proxy
 *
 * @param filterName
 * @param settings
 * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
 */
PV.addFilter = function addFilter(filterName, settings, asyncCallback) {
    //console.log('** Starting addFilter(), activeFilterName = ' + filterName + ', PV.activeSourceId = ' + PV.activeSourceId);
    PV.session.call('pv.proxy.manager.create', [filterName, PV.activeSourceId]).then(function (filterInfo) {
        //console.log('filterInfo = ' + JSON.stringify(filterInfo, null, 4));
        PV.filterProperties[filterInfo.id] = filterInfo.properties;
        PV.filterUI[filterInfo.id] = filterInfo.ui;
        PV.activeSourceId = filterInfo.id;
        PV.activeRepId = filterInfo.rep;
        PV._saveServerProxyInfo();
        PV.updateFilter(filterInfo.id, settings, asyncCallback);
    });
};
PV._getFilterProperty = function getFilterProperty(propertyName) {
    //    console.log('** Starting getFilterProperty(), propertyName = ' + propertyName);
    var filterProperty = _.find(PV.filterProperties[PV.activeSourceId], function (property) {
        return property.name === propertyName;
    });
    return filterProperty;
};
/**
 * Update the properties of a filter
 *
 * @param filterId
 * @param filterSettings
 * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
 */
// A single filter setting looks like the following:
//{
//    "id": "661",  // WarpByVector1 id
//    "value": 500000,
//    "name": "ScaleFactor"
//},
PV.updateFilter = function modifyFilter(filterId, filterSettings, asyncCallback) {
    var settings = filterSettings || {};
    //console.log('** Starting modifyFilter(), filter settings = ' + JSON.stringify(settings));
    // TODO:  change this to use a map or something more efficient
    _.each(settings, function (settingValue, settingKey) {
        // first look in filterSettings returned from server
        var proxySetting = {
            id: 0,
            name: settingKey,
            value: settingValue
        };
        var property = PV._getFilterProperty(settingKey);
        proxySetting.id = property ? property.id : PV.activeSourceId;
        if (proxySetting.name === 'GlyphSphereRadius') {
            proxySetting.id = PV.filterUI[PV.activeSourceId][0].values.Sphere;
            proxySetting.name = 'Radius';
        }
        //console.log('Filter proxySetting = ' + JSON.stringify(proxySetting, null, 4));
        PV.proxySettings.push(proxySetting);
    });
    Meteor.setTimeout(function () {
        PV._updateServerProxySettings(asyncCallback);
        //asyncCallback && asyncCallback(null, {success: true});
    }, 400);
};
PV._updateServerProxySettings = function _updateServerProxySettings(asyncCallback) {
    //console.log('** Starting updateServerProxySettings(), PV.proxySettings = ' + JSON.stringify(PV.proxySettings, null, 4));
    PV.backgroundSetting.id = PV.activeViewId;
    PV.proxySettings.push(PV.backgroundSetting);
    PV.session.call('pv.proxy.manager.update', [PV.proxySettings]).then(function (result) {
        PV.viewport.invalidateScene();
        asyncCallback && asyncCallback(null, { success: true });
    }, asyncCallback);
};
PV._findLeafProxy = function _findLeafProxy(proxyId) {
    //    console.log('findLeafProxy(), proxyId = ' + proxyId);
    var proxyInfo = _.find(PV.proxies.get(), function (proxy) {
        return proxy.parent === proxyId;
    });
    // if child found, first try to return another child if found and otherwise return the current child
    if (proxyInfo)
        return proxyInfo || PV._findLeafProxy(proxyInfo.id);
    // only reaches here for case of no children found
    proxyInfo = _.find(PV.proxies.get(), function (proxy) {
        return proxy.id === proxyId;
    });
    return proxyInfo;
};
PV._filePathToLeafProxy = function _filePathToLeafProxy(filePath) {
    var proxyId = PV.fileProxyIdMap[filePath];
    if (!proxyId) {
        console.log('Could not find filePath: ' + filePath);
        return null;
    }
    return PV._findLeafProxy(proxyId);
};
/**
 *
 * @param proxyRepId
 * @param isVisible
 * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
 */
PV.setProxyVisibility = function (proxyRepId, isVisible, asyncCallback) {
    var proxySetting = {
        id: proxyRepId || PV.activeRepId,
        name: 'Visibility',
        value: Number(isVisible)
    };
    //console.log('setProxyVisibility(), proxySetting = ' + JSON.stringify(proxySetting, null, 4));
    PV.proxySettings.push(proxySetting);
    PV._updateServerProxySettings(asyncCallback);
};
/**
 *
 * @param proxyRepId
 * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
 */
PV.showProxy = function (proxyRepId, asyncCallback) {
    //    console.log('** Starting showProxyNow()');
    PV.setProxyVisibility(proxyRepId, true, asyncCallback);
};
/**
 *
 * @param filePath
 * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
 */
PV.showProxyByFilePath = function (filePath, asyncCallback) {
    var leafProxy = PV._filePathToLeafProxy(filePath);
    //    console.log('showProxyByFilePath(), leafProxy = ' + JSON.stringify(leafProxy));
    PV.showProxy(leafProxy.rep, asyncCallback);
};
/**
 *
 * @param proxyRepId
 * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
 */
PV.hideProxy = function (proxyRepId, asyncCallback) {
    //    console.log('** Starting hideProxy()');
    PV.setProxyVisibility(proxyRepId, false, asyncCallback);
};
/**
 *
 * @param filePath
 * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
 */
PV.hideProxyByFilePath = function (filePath, asyncCallback) {
    var leafProxy = PV._filePathToLeafProxy(filePath);
    //console.log('hideProxyByFilePath(), leafProxy = ' + JSON.stringify(leafProxy));
    PV.hideProxy(leafProxy.rep, asyncCallback);
};
/**
 *
 * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
 */
PV.hide = function hide(asyncCallback) {
    //console.log('** Starting hide(), PV.activeRepId = ' + PV.activeRepId);
    PV.hideProxy(PV.activeRepId, asyncCallback);
};
/**
 *
 * @param representationName
 * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
 */
PV.changeRepresentation = function changeRepresentation(representationName, asyncCallback) {
    //    console.log('** Starting updateRepresentation');
    var settings = {
        id: PV.activeRepId,
        name: "Representation",
        value: representationName
    };
    PV.proxySettings.push(settings);
    PV._updateServerProxySettings(asyncCallback);
};
/**
 *
 * @param vcrOptions
 * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
 */
// options.vcrAction can be 'first', 'prev', 'next' or 'last'
PV.alterVideo = function alterVideo(vcrOptions, asyncCallback) {
    //    console.log('ShowFrameSyncable, calling pv.vcr.action with param = ' + JSON.stringify(vcrOptions));
    PV.session.call('pv.vcr.action', vcrOptions).then(function (timeValue) {
        //        console.log('pv.vcr.action success, set timeValue result = ' + timeValue);
        asyncCallback && asyncCallback(null, { success: true, lastFrameTime: timeValue });
    }, asyncCallback);
};
/**
 *
 * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
 */
PV.showFirstFrame = function showFirstFrame(asyncCallback) {
    //    console.log('** Starting showLastFrameSyncable');
    PV.alterVideo(['first'], asyncCallback);
};
/**
 *
 * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
 */
PV.showLastFrame = function showLastFrame(asyncCallback) {
    //    console.log('** Starting showLastFrameSyncable');
    PV.alterVideo(['last'], asyncCallback);
};
/**
 *
 * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
 */
PV.playStopEnd = function playStopEnd(asyncCallback) {
    //    console.log('** Starting playStopEndSyncable()');
    asyncCallback && asyncCallback(null, { success: true }); // Should not block
    PV.paused = false;
    PV.showLastFrame(function (error, result) {
        var lastFrameTime = result.lastFrameTime;
        console.log('lastFrameTime = ' + lastFrameTime);
        PV.showFirstFrame(function (error, result) {
            var runAnimationLoop = function () {
                PV.session.call('pv.vcr.action', ['next']).then(function (timeValue) {
                    Session.set('sim.movieProgressPercent', Math.ceil(timeValue / lastFrameTime * 100));
                    if (timeValue === lastFrameTime)
                        PV.paused = true;
                    PV.viewport.invalidateScene();
                    if (!PV.paused) {
                        setTimeout(runAnimationLoop, 25);
                    }
                });
            };
            Meteor.setTimeout(runAnimationLoop, 10);
        });
    });
};
/**
 *
 * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
 */
PV.playRepeat = function playRepeat(asyncCallback) {
    //    console.log('** Starting playSyncable()');
    asyncCallback && asyncCallback(null, { success: true }); // Should not block
    PV.paused = false;
    PV.showLastFrame(function (error, result) {
        var lastFrameTime = result.lastFrameTime;
        console.log('lastFrameTime = ' + lastFrameTime);
        PV.showFirstFrame(function (error, result) {
            var runAnimationLoop = function () {
                PV.session.call('pv.vcr.action', ['next']).then(function (timeValue) {
                    Session.set('sim.movieProgressPercent', Math.ceil(timeValue / lastFrameTime * 100));
                    PV.viewport.invalidateScene();
                    if (!PV.paused) {
                        setTimeout(runAnimationLoop, 25);
                    }
                });
            };
            Meteor.setTimeout(runAnimationLoop, 10);
        });
    });
};
/**
 *
 * @param {requestCallback} asyncCallback - standard Node-style, executed upon completion, has signature `function(error: Object, success: Object)`
 */
PV.rescale = function rescale(asyncCallback) {
    //    console.log('PVW.rescaleSyncable(), calling pv.color.manager.rescale.transfer.function with param = ' + JSON.stringify([{proxyId: PVW.activeSourceId, type:"data"}]));
    PV.session.call('pv.color.manager.rescale.transfer.function', [{ proxyId: PV.activeSourceId, type: "data" }]).then(function (result) {
        //        console.log('pv.color.manager.rescale.transfer.function success, set result = ' + JSON.stringify(result));
        asyncCallback && asyncCallback(null, { success: true });
    }, asyncCallback);
};
/**
 *
 * @param opts
 * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
 */
PV.updateCamera = function (opts, asyncCallback) {
    //console.log('updateCamera, opts = ' + JSON.stringify([Number(PVW.activeViewId), opts.focalPoint, opts.viewUp, opts.camPosition]));
    if (!PV.session) {
        asyncCallback && asyncCallback(null, { success: true });
        return;
    }
    PV.session.call('viewport.camera.update', [Number(PV.activeViewId), opts.focalPoint, opts.viewUp, opts.camPosition]).then(function (result) {
        //console.log('result = ' + JSON.stringify(result));
        PV.render(null, null, asyncCallback);
    });
};
PV.setOrientationAxesVisibility = function setOrientationAxesVisibility(isVisible, asyncCallback) {
    //console.log('setOrientationAxesVisibility()');
    var proxySetting = {
        id: PV.activeViewId,
        value: Number(isVisible),
        name: "OrientationAxesVisibility"
    };
    PV.session.call('pv.proxy.manager.update', [[proxySetting]]).then(function (result) {
        PV.viewport.invalidateScene();
    });
};
PV.getProxyFromServer = function getProxyFromServer(proxyId, asyncCallback) {
    PV.session.call('pv.proxy.manager.get', [proxyId]).then(function (result) {
        console.log('Stringified, pv.proxy.manager.get results = ' + JSON.stringify(result, null, 4));
        asyncCallback && asyncCallback(null, { success: true });
    });
};
PV.getOpacity = function getOpacity(repId, asyncCallback) {
    PV.session.call('pv.color.manager.surface.opacity.get', [repId]).then(function (result) {
        console.log('opacity repId = ' + repId);
        console.log('Stringified, pv.color.manager.surface.opacity results = ' + JSON.stringify(result, null, 4));
        asyncCallback && asyncCallback(null, { success: true });
    });
};
/**
 * Print all proxies on the server for debugging
 */
PV.printServerProxies = function printServerProxies() {
    PV.session.call('pv.proxy.manager.list').then(function (result) {
        var newResult = JSON.parse(JSON.stringify(result));
        newResult.sources = _.sortBy(result.sources, function (proxy) {
            return proxy.id;
        });
        console.log('pv.proxy.manager.list result = ' + JSON.stringify(newResult, null, 4));
    });
};
//# sourceMappingURL=paraview.js.map