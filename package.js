Package.describe({
  name: 'fullflavedave:paraview',
  version: '0.0.1',
  summary: 'A friendly wrapper for the ParaViewWeb JavaScript API',
  git: 'https://github.com/fullflavedave/meteor-paraview.git',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.1.0.2');
  api.use('jquery', 'client');
  api.use('reactive-var', 'client');
  api.addFiles('paraview.js', 'client');
  api.export(['PV'], ['client', 'server']);
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('jquery', 'client');
  api.use('fullflavedave:paraview');
  api.addFiles('paraview-tests.js');
});
