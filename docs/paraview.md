# PV





* * *

### PV.config(opts, asyncCallback) 
- **Description**: Set initial configurations for paraview, such as viewportCssId or backgroundSetting.
- **Parameters**
    - **opts**: `Object`, configuration options
    - **asyncCallback**: `requestCallback`, standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
- **Example**:

		PV.config({
            serverSessionManagerUrl: 'http://localhost:9000/paraview',
            viewportCSSId: '#paraview-viewport',
            backgroundSetting: {
                value: [0.9765, 0.9765, 0.9765],  // Equivalent to RGB color #f9f9f9
                name: "Background"
        });

### PV.removeAllProxies(asyncCallback) 
- **Description**: Remove all the artifacts from the server.
- **Parameters**
    - **asyncCallback**: `requestCallback`, standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`

### PV.removeProxy(proxyId, asyncCallback) 
- **Description**: Remove single proxy from the server
- **Parameters**
    - **proxyId**: `number`, id of proxy to be removed
    - **asyncCallback**: `requestCallback`, standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`

### PV.initSession(asyncCallback) 
- **Description**: Creates a session with the ParaView session if one does not exist already.  Reuses existing session if one already exists.
- **Parameters**
    - **asyncCallback**: `requestCallback`, standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`

### PV.addFile(path, asyncCallback) 
- **Description**: Render a file, which should be accessible by the ParaView server.
- **Parameters**
    - **path**: , Render a file, which should be accessible by the ParaView server.
    - **asyncCallback**: `requestCallback`, standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`

### PV.render(width, height, asyncCallback) 
- **Description**: Refresh the viewport with any changes to the server
- **Parameters**
    - **width**: `number`, optional width.  Default is width of element specified by viewportCssId
    - **height**: `number`, optional height.  Default is height of element specified by viewportCssId
    - **asyncCallback**: `requestCallback`, standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`

### PV.resetViewport(asyncCallback) 
- **Description**: Recenter and rescale all visible visualizations.  Calls PV.render() to display changes.
- **Parameters**
    - **asyncCallback**: `requestCallback`, standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`

### PV.colorProxy(displayProps, asyncCallback) 
- **Description**: Color a proxy (layer).  Called by PV.colorCells() and PV.colorPoints().
- **Parameters**
    - **displayProps**: `Array`, Color a proxy (layer).  Called by PV.colorCells() and PV.colorPoints().
    - **asyncCallback**: `requestCallback`, standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`

### PV.colorCells(layerName, asyncCallback) 
- **Description**: Colors cells of a visualization.  Calls colorProxy([<activRepId>, 'ARRAY', 'CELLS', layerName])
- **Parameters**
    - **layerName**: `string`, name of layer, specified in visualization file
    - **asyncCallback**: `requestCallback`, standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`

### PV.colorPoints(layerName, asyncCallback) 
- **Description**: Colors points of a visualization.  Calls colorProxy([<activRepId>, 'ARRAY', 'POINTS', layerName, 'Magnitude', 0, true]) *
- **Parameters**
    - **layerName**: `string`, name of layer, specified in visualization file
    - **asyncCallback**: `requestCallback`, standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`

### PV.setPalette(paletteName, asyncCallback) 
- **Description**: Specify colorMap to use.
- **Parameters**
    - **paletteName**: , Specify colorMap to use.
    - **asyncCallback**: `requestCallback`, standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`

### PV.setOpacity(opacity, asyncCallback) 
- **Parameters**
    - **opacity**: 
    - **asyncCallback**: `requestCallback`, standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`

### PV.addFilter(filterName, settings, asyncCallback) 
- **Parameters**
    - **filterName**: 
    - **settings**: 
    - **asyncCallback**: `requestCallback`, standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`

### PV.modifyFilter(filterId, filterSettings, asyncCallback) 
- **Parameters**
    - **filterId**: 
    - **filterSettings**: 
    - **asyncCallback**: `requestCallback`, standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`

### PV.setProxyVisibility(proxyRepId, isVisible, asyncCallback) 
- **Parameters**
    - **proxyRepId**: 
    - **isVisible**: 
    - **asyncCallback**: `requestCallback`, standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`

### PV.showProxy(proxyRepId, asyncCallback) 
- **Parameters**
    - **proxyRepId**: 
    - **asyncCallback**: `requestCallback`, standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`

### PV.showProxyByFilePath(filePath, asyncCallback) 
- **Parameters**
    - **filePath**: 
    - **asyncCallback**: `requestCallback`, standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`

### PV.hideProxy(proxyRepId, asyncCallback) 
- **Parameters**
    - **proxyRepId**: 
    - **asyncCallback**: `requestCallback`, standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`

### PV.hideProxyByFilePath(filePath, asyncCallback) 
- **Parameters**
    - **filePath**: 
    - **asyncCallback**: `requestCallback`, standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`

### PV.hide(asyncCallback) 
- **Parameters**
    - **asyncCallback**: `requestCallback`, standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`

### PV.changeRepresentation(representationName, asyncCallback) 
- **Parameters**
    - **representationName**: 
    - **asyncCallback**: `requestCallback`, standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`

### PV.alterVideo(vcrOptions, asyncCallback) 
- **Parameters**
    - **vcrOptions**: 
    - **asyncCallback**: `requestCallback`, standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`

### PV.showFirstFrame(asyncCallback) 
- **Parameters**
    - **asyncCallback**: `requestCallback`, standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`

### PV.showLastFrame(asyncCallback) 
- **Parameters**
    - **asyncCallback**: `requestCallback`, standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`

### PV.playStopEnd(asyncCallback) 
- **Parameters**
    - **asyncCallback**: `requestCallback`, standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`

### PV.playRepeat(asyncCallback) 
- **Parameters**
    - **asyncCallback**: `requestCallback`, standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`

### PV.rescale(asyncCallback) 
- **Parameters**
    - **asyncCallback**: `requestCallback`, standard Node-style, executed upon completion, has signature `function(error: Object, success: Object)`

### PV.updateCamera(opts, asyncCallback) 
- **Parameters**
    - **opts**: 
    - **asyncCallback**: `requestCallback`, standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`

### PV.printServerProxies() 


* * *










