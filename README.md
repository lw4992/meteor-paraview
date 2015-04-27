### Overview
[ParaView](http://www.paraview.org/) is a is an open-source, multi-platform data analysis and visualization application.  This package provides a user-friendly wrapper for the (poorly documented) [ParaViewWeb JavaScript API](http://www.paraview.org/ParaView3/Doc/Nightly/www/js-doc/index.html#!/api).

It enables rendering and manipulation of visualizations that are in file formats supported by ParaView.  You basically:

- connect to a ParaView Server
- specify a file or files (accessible from the ParaViewServer) to load
- Add filters and display options to alter the file rendering(s)
  
Assumptions:

- You have a ParaView server running that is accessible via WebGL from your browser
- The ParaView server has file access (via relative directory paths) to any artifacts (e.g. `*.vtk`, `*.pvd`, etc) files that you want to display.
 
### API


### Implementation

To avoid callback hell, it's recommended that you use some sort of aysnchronous call helper.  `Meteor.wrapAsync` will not work on the client.  Here are several other packages readily available on atmosphere:

- [PowerQueue](https://atmospherejs.com/cfs/power-queue)
- Mike Bostock's [queue-async](https://atmospherejs.com/vsivsi/queue-async)
- [Async.js](https://atmospherejs.com/peerlibrary/async)


 
### Future Plans
- Customizable UI components that provide out-of-the box functionality


### Contributions
Contributions are welcome!   Please fork the code and submit a pull request.