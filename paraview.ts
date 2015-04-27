/// <reference path='../../../meteor-client-app/app/.typescript/package_defs/all-definitions.d.ts' />
/// <reference path='../../../meteor-client-app/app/.typescript/custom_defs/all-custom-definitions.d.ts' />

var connectionComputation:Tracker.Computation;

PV = {
    session: null,
    viewport: null,
    paused: true,
    lastFrameTime: 0,
    currentFrameTime: 0,
    filterProperties: <{[id: string]: iPVFilterProperty[]}> {},
    filterUI: {},
    proxies: [],
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
    backgroundSetting: {
        id: 0,
        value: [0.9765, 0.9765, 0.9765],  // Equivalent to RGB color #f9f9f9
        name: "Background"
    },
    scalarBar: new ReactiveVar({
        display: false,
        areDiscreteValues: false,
        labelsAndColors: []
    })
};

/**
 * Set initial configurations for paraview, such as viewportCssId or backgroundSetting
 *
 * @param {Object} opts - configuration options
 * @param {requestCallback} callback -- callback to be executed upon completion, with signature function(error: Object, success: Object) { ... }
 */
PV.config = function config(opts:iPVInitOpts, callback?:iPVCallback) {
    _.extend(PV, opts);
    callback && callback(null, {success: true});
};

/**
 *
 * @param {Object} opts - configuration options
 * @param {requestCallback} callback -- callback to be executed upon completion, with signature function(error: Object, success: Object) { ... }
 */
PV.init = function init(opts?:iPVInitOpts, callback?:iPVCallback) {
    PV.config(opts, callback);
};

PV.removeAllProxies = function removeAllProxies(callback?: iPVCallback) {
//    console.log('** Starting removeAllProxiesSyncable()');
    var numProxies = PV.proxies.length;
    if (numProxies === 0) callback(null, {success: true});

    var i = numProxies;
    while (i--) {
        if (i === 0) {
            PV.removeProxy(JSON.parse(JSON.stringify(PV.proxies[i].id)), callback);
        } else {
            PV.removeProxy(JSON.parse(JSON.stringify(PV.proxies[i].id)), callback);
        }
    }
};

PV.removeProxy = function removeProxy(proxyId, callback?: iPVCallback) {
//    console.log('** Starting removeProxySyncable(), options.proxyId = ' + removalOptions.proxyId);
    PV.session.call('pv.proxy.manager.delete', [proxyId]).then(function (result) {
        callback && callback(null, {success: true});
    }, callback);
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
                if (error) return PV._onError(error);
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
            if (error) return PV._onError(error);
        });
    });
};

PV._bindViewport = function _bindViewport(session?: iPVSession) {
    var viewportOptions = {
        session: session || PV.session,
        view: -1,
        enableInteractions: true,
        renderer: 'image'  //image or webgl
    };

    var viewport = <iPVViewport> vtkWeb.createViewport(viewportOptions);
    viewport.bind(PV.viewportCssId);
    PV.viewport = viewport;
};

PV.initSession = function initSession(callback?: iPVCallback) {
    //console.log('** Starting initSession(), callback = ' + callback);
    if (!PV.session) {
        Session.set('pvwConnected', false);
        console.log('Creating connection and session with ParaView Server...');
        PV._connect();
        connectionComputation = Tracker.autorun(function () {
            var isConnected = Session.get('pvwConnected');
            if (isConnected) {
                PV._bindViewport();  // I think all of this is synchronous
//                console.log('Completed initializeSyncable(), PV.session._wsuri = ' + PV.session._wsuri + ',  PV.session._session_id = ' + PV.session._session_id + ',  PV.session._websocket_connected = ' + PV.session._websocket_connected);
                console.log('Created session with ParaView server, PV.session._id = ' + PV.session._id +
                    ',  PV.session._socket.url = ' + PV.session._socket.url +
                    ',  PV.session._socket.readyState = ' + PV.session._socket.readyState);
                //console.log('PV.session = ' + JSON.stringify(PV.session, null, 4));
                PV._saveServerProxyInfo(callback);
                //callback && callback(null, {success: true});
                connectionComputation.stop();
            }
        });
    } else {
        console.log('Already connected to ParaView Server, reusing session');
        PV._bindViewport();
        PV._saveServerProxyInfo(callback);
        //callback && callback(null, {success: true});
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
PV._saveServerProxyInfo = function _saveServerProxyInfo(callback?:iPVCallback) {
//    console.log('** Starting setProxiesFromServer()');
    PV.session.call('pv.proxy.manager.list').then(function (result) {
        if (result && result.view) PV.activeViewId = result.view;
        //console.log('result.view = ' + result.view);
        if (result && result.sources && result.sources.length !== 0) {
            PV.activeSourceId = PV.activeSourceId || result.sources[result.sources.length - 1].id;  // If calling for first time, make last proxy the active one
            PV.activeRepId = PV._getRepId(result.sources, PV.activeSourceId);
            PV.proxies = <iPVProxy[]> _.sortBy(result.sources, function (proxy:any) {
                return proxy.id;
            });
        }
//        console.log('PV.proxies = ' + JSON.stringify(PV.proxies));
        callback && callback(null, {success: true});
    }, callback);
};

PV.addFile = function addFile(path, callback) {
    console.log('Starting addFile(), relativeFilePath = ' + path);

    PV.session.call("pv.proxy.manager.create.reader", [path]).then(function (reply) {
        //console.log('pv.proxy.manager.create.reader() reply = ' + JSON.stringify(reply));
        PV.mainProxyId = reply.id;
        PV.activeSourceId = reply.id;
//        PV.nextFileIndex++;
//        PV.nextFilterIndex = 0;
        PV.fileProxyIdMap[path] = reply.id;
        PV._saveServerProxyInfo(callback);
        //callback && callback(null, {success: true});
    }, callback);
};

PV.render = function render(width:number, height:number, callback?:iPVCallback) {
    //console.log('** Starting render(), width = ' + width);
    var width:number = width || $(PV.viewportCssId).innerWidth();
    var height:number = height || $(PV.viewportCssId).innerHeight();
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
        if (callback) callback(null, {success: true});
    });
};

PV.resetViewport = function resetViewport(callback?:iPVCallback) {
    //console.log('** Starting resetViewPort(), PV.activeViewId = ' + PV.activeViewId);
    if (!PV.session) {
        callback && callback(null, {success: true});
        return;
    }
    //Session.get('graphicsViewportSize');  // sole purpose of this line is to enable this function to be reactive if wrapped in a Deps.autorun, so a viewport size change will trigger this function again.
    PV.session.call("viewport.camera.reset", [PV.activeViewId]).then(function (result) {
//        console.log('viewport.camera.reset result = ' + JSON.stringify(result));
        PV.render(null, null, callback);
    });
};

// API options found here:  http://www.paraview.org/ParaView3/Doc/Nightly/www/js-doc/index.html#!/api/protocols.ParaViewWebColorManager
// A complete displayProps should look like [PV.activeRepId, colorMode, arrayLocation, arrayName, vectorMode, vectorComponent, rescale];
PV.colorProxy = function colorProxy(displayProps, callback?:iPVCallback) {
    //console.log('colorProxy(), displayProps = ' + JSON.stringify(displayProps, null, 4));
    PV.session.call('pv.color.manager.color.by', displayProps).then(function () {
        callback && callback(null, {success: true});  // Doesn't seem like this needs to block, but \bad if a new layer became last layer before completion
    }, callback);
};

PV.colorCells = function colorCells(layerName:string, callback?:iPVCallback) {
    PV.colorProxy([PV.activeRepId, 'ARRAY', 'CELLS', layerName], callback);
};

PV.colorPoints = function(layerName: string, callback?: iPVCallback) {
    var displayProps = [PV.activeRepId, 'ARRAY', 'POINTS', layerName, 'Magnitude', 0, true];
    PV.colorProxy(displayProps, callback);
};

PV.setPalette = function setPalette(paletteName:string, callback?:iPVCallback) {
    //console.log('setPalatteSyncable(), calling pv.color.manager.select.preset with param = ' + JSON.stringify(paletteOptions));
    var paletteOptions = [PV.activeRepId, paletteName];
    PV.session.call('pv.color.manager.select.preset', paletteOptions).then(function (result) {
        //console.log('color manager result = ' + JSON.stringify(result, null, 4));
        if (callback) callback(null, {success: true});  // Doesn't seem like this needs to block, but \bad if a new layer became last layer before completion
    }, callback);
};


PV.setOpacity = function setOpacity(opacity:number, callback?:iPVCallback) {
//    console.log('** Starting setOpacity()');
    var settings = {
        id: PV.activeRepId,
        name: "Opacity",
        value: opacity
    };

    PV.proxySettings.push(settings);
    PV._updateServerProxySettings(callback);
    //callback && callback(null, {success: true});
};

PV.addFilter = function addFilter(filterName:string, settings?:iPVFilterSettings, callback?:iPVCallback) {
    //console.log('** Starting addFilter(), activeFilterName = ' + filterName + ', PV.activeSourceId = ' + PV.activeSourceId);

    PV.session.call('pv.proxy.manager.create', [filterName, PV.activeSourceId]).then(function (filterInfo) {
        //console.log('filterInfo = ' + JSON.stringify(filterInfo, null, 4));
        PV.filterProperties[filterInfo.id] = filterInfo.properties;
        PV.filterUI[filterInfo.id] = filterInfo.ui;
        PV.activeSourceId = filterInfo.id;
        PV.activeRepId = filterInfo.rep;
        //PV.nextFilterIndex++;
        //PV._updateServerProxySettings(callback);
        PV._saveServerProxyInfo();
        PV.modifyFilter(filterInfo.id, settings, callback);
        //callback && callback(null, {success: true});
    });
};

PV._getFilterProperty = function getFilterProperty(propertyName: string): iPVFilterProperty {
//    console.log('** Starting getFilterProperty(), propertyName = ' + propertyName);
    var filterProperty = <iPVFilterProperty> _.find(PV.filterProperties[PV.activeSourceId], function(property: iPVFilterProperty) {
        return property.name === propertyName;
    });
    return filterProperty;
};

// A single filter setting looks like the following:
//{
//    "id": "661",  // WarpByVector1 id
//    "value": 500000,
//    "name": "ScaleFactor"
//},
PV.modifyFilter = function modifyFilter(filterId:number, filterSettings:{[filterName: string]: string | number | any[]}, callback?:iPVCallback) {
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
        PV._updateServerProxySettings(callback);
        //callback && callback(null, {success: true});
    }, 400);
};

PV._updateServerProxySettings = function _updateServerProxySettings(callback:iPVCallback) {
    //console.log('** Starting updateServerProxySettings(), PV.proxySettings = ' + JSON.stringify(PV.proxySettings, null, 4));
    PV.backgroundSetting.id = PV.activeViewId;
    PV.proxySettings.push(PV.backgroundSetting);

    PV.session.call('pv.proxy.manager.update', [PV.proxySettings]).then(function (result) {
        callback && callback(null, {success: true});
    }, callback);
};

PV._findLeafProxy = function _findLeafProxy(proxyId): iPVProxy {
//    console.log('findLeafProxy(), proxyId = ' + proxyId);
    var proxyInfo = _.find(PV.proxies, function(proxy) {
        return proxy.parent === proxyId;
    });

    // if child found, first try to return another child if found and otherwise return the current child
    if (proxyInfo) return proxyInfo || PV._findLeafProxy(proxyInfo.id);

    // only reaches here for case of no children found
    proxyInfo = _.find(PV.proxies, function(proxy) {  // for case of
        return proxy.id === proxyId;
    });
    return proxyInfo;
};

PV._filePathToLeafProxy = function _filePathToLeafProxy(filePath: string): iPVProxy {
    var proxyId = PV.fileProxyIdMap[filePath];
    if (!proxyId) {
        console.log('Could not find filePath: ' + filePath);
        return null;
    }

    return PV._findLeafProxy(proxyId);
};

PV.setProxyVisibility = function(proxyRepId: number, isVisible: boolean, callback?: iPVCallback) {
    var proxySetting = {
        id: proxyRepId || PV.activeRepId,
        name: 'Visibility',
        value: Number(isVisible)
    };
    //console.log('setProxyVisibility, proxySetting = ' + JSON.stringify(proxySetting, null, 4));
    PV.proxySettings.push(proxySetting);
    PV._updateServerProxySettings(callback);
};

PV.showProxy = function(proxyRepId: number, callback?: iPVCallback) {
//    console.log('** Starting showProxyNow()');
    PV.setProxyVisibility(proxyRepId, true, callback);
};

PV.showProxyByFilePath = function(filePath: string, callback?: iPVCallback) {
    var leafProxy = PV._filePathToLeafProxy(filePath);
//    console.log('showProxyByFilePath(), leafProxy = ' + JSON.stringify(leafProxy));
    PV.showProxy(leafProxy.rep, callback);
};

PV.hideProxy = function(proxyRepId: number, callback?: iPVCallback) {
//    console.log('** Starting hideProxy()');
    PV.setProxyVisibility(proxyRepId, false, callback);
};

PV.hideProxyByFilePath = function(filePath: string, callback?: iPVCallback) {
    var leafProxy = PV._filePathToLeafProxy(filePath);
    //console.log('hideProxyByFilePath(), leafProxy = ' + JSON.stringify(leafProxy));
    PV.hideProxy(leafProxy.rep, callback);
};

PV.hide = function(callback?: iPVCallback) {
    //console.log('** Starting hide(), PV.activeRepId = ' + PV.activeRepId);
    PV.hideProxy(PV.activeRepId, callback);
};

PV.changeRepresentation = function changeRepresentation(representationName: string, callback: iPVCallback) {
//    console.log('** Starting updateRepresentation');
    var settings = {
        id: PV.activeRepId,
        name: "Representation",
        value: representationName
    };

    PV.proxySettings.push(settings);
    PV._updateServerProxySettings(callback);
};

PV.scalarBar = new ReactiveVar<iPVScalarBarOpts>({
    display: false,
    areDiscreteValues: false,
    labelsAndColors: []
});

//PV.setScalarBar = function(opts, callback?: iPVCallback) {
////    console.log('** Starting setScalarBarSyncable, visibilityMap = ' + JSON.stringify(options.visibilityMap));
//    PV.session.call('pv.color.manager.scalarbar.visibility.set', [options.visibilityMap]).then(function(result) {
//        if (!options.noCallback) callback && callback(null, {success: true});  // Doesn't seem like this needs to block, but bad if a new layer became last layer before completion
//    }, callback);
//};
//
//PV.removeScalarBar = function(sourceId, callback?: iPVCallback) {
//    var scalarBarOptions = {
//        visibilityMap: {}
//    };
//    scalarBarOptions.visibilityMap[sourceId] = false;
//    PV.setScalarBar(scalarBarOptions, callback);
//};
//
//PV.removeAllScalarBars = function(callback?: iPVCallback) {
////    console.log('** Starting removeAllScalarBarsSyncable()');
//    if (!PV.proxies || PV.proxies.length === 0) return callback && callback(null, {success: true});
//    _.each(PV.proxies, function(proxy, i) {
//        var scalarBarOptions = {
//            visibilityMap: {}
//        };
//        scalarBarOptions.visibilityMap[proxy.id] = false;
//        if (i !== PV.proxies.length - 1) scalarBarOptions.noCallback = true;
//        PV.setScalarBar(scalarBarOptions, callback);
//    });
//};

// options.vcrAction can be 'first', 'prev', 'next' or 'last'
PV.alterVideo = function alterVideo(vcrOptions, callback) {
//    console.log('ShowFrameSyncable, calling pv.vcr.action with param = ' + JSON.stringify(vcrOptions));
    PV.session.call('pv.vcr.action', vcrOptions).then(function(timeValue){
//        console.log('pv.vcr.action success, set timeValue result = ' + timeValue);
        callback && callback(null, {success: true, lastFrameTime: timeValue});
    }, callback);
};

PV.showFirstFrame = function showFirstFrame(callback?: iPVCallback) {
//    console.log('** Starting showLastFrameSyncable');
    PV.alterVideo(['first'], callback);
};

PV.showLastFrame = function showLastFrame(callback?: iPVCallback) {
//    console.log('** Starting showLastFrameSyncable');
    PV.alterVideo(['last'], callback);
};

PV.playStopEnd = function playStopEnd(callback?: iPVCallback) {
//    console.log('** Starting playStopEndSyncable()');
    callback && callback(null, {success: true});  // Should not block
    PV.paused = false;

    PV.showLastFrame(function(error, result: any) {
        var lastFrameTime = result.lastFrameTime;
        console.log('lastFrameTime = ' + lastFrameTime);
        PV.showFirstFrame(function(error, result) {
            var runAnimationLoop = function() {
                PV.session.call('pv.vcr.action', ['next']).then(function(timeValue){
                    Session.set('sim.movieProgressPercent', Math.ceil(timeValue/lastFrameTime * 100));
                    if (timeValue === lastFrameTime) PV.paused = true;
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

PV.playRepeat = function playRepeat(callback?: iPVCallback) {
//    console.log('** Starting playSyncable()');
    callback && callback(null, {success: true});  // Should not block
    PV.paused = false;

    PV.showLastFrame(function(error, result: any) {
        var lastFrameTime = result.lastFrameTime;
        console.log('lastFrameTime = ' + lastFrameTime);
        PV.showFirstFrame(function(error, result) {
            var runAnimationLoop = function() {
                PV.session.call('pv.vcr.action', ['next']).then(function(timeValue){
                    Session.set('sim.movieProgressPercent', Math.ceil(timeValue/lastFrameTime * 100));
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

PV.rescale = function rescale(callback: iPVCallback) {
//    console.log('PVW.rescaleSyncable(), calling pv.color.manager.rescale.transfer.function with param = ' + JSON.stringify([{proxyId: PVW.activeSourceId, type:"data"}]));
    PV.session.call('pv.color.manager.rescale.transfer.function', [{proxyId: PV.activeSourceId, type:"data"}]).then(function(result) {
//        console.log('pv.color.manager.rescale.transfer.function success, set result = ' + JSON.stringify(result));
        callback && callback(null, {success: true});
    }, callback);
};

PV.updateCamera = function(opts: iPVCameraOpts, callback?: iPVCallback) {
    //console.log('updateCamera, opts = ' + JSON.stringify([Number(PVW.activeViewId), opts.focalPoint, opts.viewUp, opts.camPosition]));
    if (!PV.session) {
        callback && callback(null, {success: true});
        return;
    }
    PV.session.call('viewport.camera.update', [Number(PV.activeViewId), opts.focalPoint, opts.viewUp, opts.camPosition]).then(function(result) {
        //console.log('result = ' + JSON.stringify(result));
        PV.render(null, null, callback);
    });
};

PV.printServerProxies = function printServerProxies() {
    PV.session.call('pv.proxy.manager.list').then(function (result) {
        var newResult = JSON.parse(JSON.stringify(result));
        newResult.sources = _.sortBy(result.sources, function (proxy:iPVProxy) {
            return proxy.id;
        });
        console.log('pv.proxy.manager.list result = ' + JSON.stringify(newResult, null, 4));
    });
};


