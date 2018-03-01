Ext.define('Admin.Viewport', {

  extend: 'Ext.Viewport',

  requires: [
    'Admin.Home.Tab',
    'Admin.field.Filter',
    'Admin.overrides.Toolbar',
  ],

  initComponent() {
    window.dispatch = this.dispatch.bind(this);
    this.callParent(arguments);
  },

  layout: 'border',
  items: [{
    region: 'center',
    xtype: 'tabpanel',
    border: false,
    layout: 'fit',
    items: [{
      xtype: 'home-tab'
    }]
  }],

  dispatch(job, params) {
    params = params || {};
    var el = (Ext.WindowManager.getActive() || this).el;
    el.mask('Please, wait');
    return new Promise(function(resolve, reject) {
      Ext.Ajax.request({
          method: 'post',
          url: '/admin/api',
          params: {
            rpc: Ext.JSON.encode({
              job: job,
              params: params
            }),
          },
          success: response => {
            try {
              var result = Ext.JSON.decode(response.responseText);
            } catch(e) {
              result = {
                success: false,
                message: e
              }
            }
            el.unmask();
            if(!result.success) {
              Ext.MessageBox.alert('Error', result.message);
              reject(result.message);

            } else {
              resolve(result.data || {});
            }
          }
      })
    })
  }
});
