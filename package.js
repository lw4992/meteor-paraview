Package.describe({
    name: 'fullflavedave:paraview',
    version: '0.0.4',
    summary: 'A user-friendly wrapper for the ParaViewWeb JavaScript API',
    git: 'https://github.com/fullflavedave/meteor-paraview.git',
    documentation: 'README.md'
});

Package.onUse(function (api) {
    api.versionsFrom('1.1.0.2');
    api.use('jquery', 'client');
    api.use('reactive-var', 'client');

    api.addFiles('paraview.js', 'client');
    api.export(['PV'], 'client');

    api.addFiles('lib/gl-matrix-min.js', 'client');
    api.addFiles('lib/hammer.min.js', 'client');
    api.addFiles('lib/jquery.hammer.min.js', 'client');
    api.addFiles('lib/autobahn.min.js', 'client');
    api.addFiles('lib/vtkweb-all.js', 'client');
    api.export(['vtkWeb'], 'client');
});

Package.onTest(function (api) {
    api.use('tinytest');
    api.use('fullflavedave:paraview');
    api.addFiles('paraview-tests.js', 'client');
});
