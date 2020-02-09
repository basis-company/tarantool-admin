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
    }],
    tabBar: {
      items: [{
        xtype: 'tbfill'
      }, { 
        xtype: 'label',
        name: 'version',
        style: {
          paddingTop: '4px',
          paddingRight: '8px',
          color: '#aaa',
        },
      }]
    }
  }],

  dispatch(job, params) {
    params = params || {};
    var el = (Ext.WindowManager.getActive() || this).el;
    var timeout = setTimeout(function() { el.mask('Please, wait'); }, 100);
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
            clearTimeout(timeout);
            try {
              var result = Ext.JSON.decode(response.responseText);
            } catch(e) {
              result = {
                success: false,
                message: e
              }
            }
            if (el.isMasked()) {
              setTimeout(function() {el.unmask();}, 250);
            }
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
