Ext.onReady(() => {

  Ext.Loader.setConfig({
    enabled:true,
    disableCaching:true,
    paths:{
      Admin:'/admin/js',
    }
  });

  Ext.define('Basis.override.Ext', {
    override: 'Ext',
    define(className, data, createdFn) {
      if(!data.xtype && className) {
        data.xtype = Ext.Array.splice(className.split('.'), 1).join('-').toLowerCase();
      }
      var Manager = Ext.ClassManager;
      Ext.classSystemMonitor && Ext.classSystemMonitor(className, 'ClassManager#define', arguments);
      if (data.override) {
        Manager.classState[className] = 20;
        return Manager.createOverride.apply(Manager, arguments);
      }
      Manager.classState[className] = 10;
      return Manager.create.apply(Manager, arguments);
    }
  });

  Ext.create('Admin.Viewport');

})