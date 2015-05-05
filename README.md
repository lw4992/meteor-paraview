## Under Development
Disclaimer:  this package is currently under heavy development and undoubtedly contains many bugs.

## ParaView
[ParaView](http://www.paraview.org/) is a is an open-source, multi-platform data analysis and visualization application.  This package provides a user-friendly wrapper for the [ParaViewWeb JavaScript API](http://www.paraview.org/ParaView3/Doc/Nightly/www/js-doc/index.html#!/api).

It enables rendering and manipulation of visualizations that are in file formats supported by ParaView.  You basically:

- connect to a ParaView Server
- specify a file or files (accessible from the ParaViewServer) to load
- Add filters and display options to alter the file rendering(s)
  
Assumptions:

- You have a ParaView server running that is accessible via WebGL from your browser
- The ParaView server has file access (via relative directory paths) to any artifacts (e.g. `*.vtk`, `*.pvd`, etc) files that you want to display.
 
## QuickStart

Set the required configuration properties, initialize a session, and add a file:
 
    var configOpts = {
        serverSessionManagerUrl: 'http://localhost:9000/paraview',
        viewportCSSId: '#paraview-viewport',
        backgroundSetting: {
            value: [0.9765, 0.9765, 0.9765],  // Equivalent to RGB color #f9f9f9
            name: "Background"
        }
    };
    
    TaskQ
        .defer(PV.config, configOpts)
        .defer(PV.initSession)
        .defer(PV.addFile, currentJob._id + '/' + Meteor.settings['public']['filePaths']['lithologyMesh']) 
        .awaitAll();

 
 
## Methods API

### PV.config(opts, asyncCallback) 
- **Description**: Set initial configurations for paraview, such as viewportCssId or backgroundSetting.
- **Parameters**
    - **opts**: `Object`, configuration options
        - serverSessionManagerUrl:  the url to use
        - serverSessionUrl:  
        - viewportCssId: 
        - backgroundSetting: 
            - name: string 
            - value: array of 3 numbers, 0 to 1, representing Red, Green, and Blue values (in that order)     
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










### removeAllProxies(asyncCallback) 
- **Description**: Remove all the artifacts from the server.
- **Parameters**
    - **asyncCallback**: `requestCallback`, standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`

### removeProxy(proxyId, asyncCallback) 
- **Description**: Remove single proxy from the server
- **Parameters**
    - **proxyId**: `number`, id of proxy to be removed
    - **asyncCallback**: `requestCallback`, Remove single proxy from the server

### render(width, height, asyncCallback) 
- **Description**: Refresh the viewport with any changes to the server
- **Parameters**
    - **width**: `number`, Refresh the viewport with any changes to the server
    - **height**: `number`, Refresh the viewport with any changes to the server
    - **asyncCallback**: , Refresh the viewport with any changes to the server

### resetViewport(asyncCallback) 
- **Parameters**
    - **asyncCallback**: 

### colorProxy(displayProps, asyncCallback) 
- **Parameters**
    - **displayProps**: 
    - **asyncCallback**: 

### colorCells(layerName, asyncCallback) 
- **Parameters**
    - **layerName**: 
    - **asyncCallback**: 

### colorPoints(layerName, asyncCallback) 
- **Parameters**
    - **layerName**: 
    - **asyncCallback**: 

### setPalette(paletteName, asyncCallback) 
- **Parameters**
    - **paletteName**: 
    - **asyncCallback**: 

### setOpacity(opacity, asyncCallback) 
- **Parameters**
    - **opacity**: 
    - **asyncCallback**: 

### addFilter(filterName, settings, asyncCallback) 
- **Parameters**
    - **filterName**: 
    - **settings**: 
    - **asyncCallback**: 

### modifyFilter(filterId, filterSettings, asyncCallback) 
- **Parameters**
    - **filterId**: 
    - **filterSettings**: 
    - **asyncCallback**: 

### setProxyVisibility(proxyRepId, isVisible, asyncCallback) 
- **Parameters**
    - **proxyRepId**: 
    - **isVisible**: 
    - **asyncCallback**: 

### showProxy(proxyRepId, asyncCallback) 
- **Parameters**
    - **proxyRepId**: 
    - **asyncCallback**: 

### showProxyByFilePath(filePath, asyncCallback) 
- **Parameters**
    - **filePath**: 
    - **asyncCallback**: 

### hideProxy(proxyRepId, asyncCallback) 
- **Parameters**
    - **proxyRepId**: 
    - **asyncCallback**: 

### hideProxyByFilePath(filePath, asyncCallback) 
- **Parameters**
    - **filePath**: 
    - **asyncCallback**: 

### hide(asyncCallback) 
- **Parameters**
    - **asyncCallback**: 

### changeRepresentation(representationName, asyncCallback) 
- **Parameters**
    - **representationName**: 
    - **asyncCallback**: 

### alterVideo(vcrOptions, asyncCallback) 
- **Parameters**
    - **vcrOptions**: 
    - **asyncCallback**: 

### showFirstFrame(asyncCallback) 
- **Parameters**
    - **asyncCallback**: 

### showLastFrame(asyncCallback) 
- **Parameters**
    - **asyncCallback**: 

### playStopEnd(asyncCallback) 
- **Parameters**
    - **asyncCallback**: 

### playRepeat(asyncCallback) 
- **Parameters**
    - **asyncCallback**: 

### rescale(asyncCallback) 
- **Parameters**
    - **asyncCallback**: 

### updateCamera(opts, asyncCallback) 
- **Parameters**
    - **opts**: 
    - **asyncCallback**: 

### printServerProxies() 



## Implementation

### Async helper
To avoid callback hell, it's recommended that you use some sort of aysnchronous call helper.  `Meteor.wrapAsync` will not work on the client.  Here are several other packages readily available on atmosphere:

- [PowerQueue](https://atmospherejs.com/cfs/power-queue)
- Mike Bostock's [queue-async](https://atmospherejs.com/vsivsi/queue-async)
- [Async.js](https://atmospherejs.com/peerlibrary/async)

### Examples

    var configOpts = {
    serverSessionManagerUrl: 'http://localhost:9000/paraview',
    viewportCSSId: '#paraview-viewport',
        backgroundSetting: {
            value: [0.9765, 0.9765, 0.9765],  // Equivalent to RGB color #f9f9f9
            name: "Background"
        }
    };
    
### Templates

#### paraviewControlPanel
This template lists different files and filters added, enables you to show/hide each one or change each one's opacity.  It is implemented within a bootstrap panel that is as wide as it's containing element.

You can include the control panel in templates with this spacebars snippet:
    
    {{> paraviewControlPanel}}

It hasn't yet been created in a way that is easy to customize the style.

 
## Future Plans
- More UI components that provide out-of-the box functionality


## Contributions
Contributions are welcome!   Please fork the code and submit a pull request.