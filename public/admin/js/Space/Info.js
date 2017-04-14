Ext.define('Admin.Space.Info', {

  extend: 'Ext.panel.Panel',  
  title: 'Info',

  requires: [
    'Admin.Space.Format',
    'Admin.Space.Indexes',
  ],

  layout: 'hbox',

  listeners: {
    activate() {
      this.reloadInfo();
    }
  },

  reloadInfo() {
    dispatch('space.info', this.up('space-tab').params)
      .then(result => {
        this.down('space-format').store.loadData(result.format);
        console.log(result.indexes);
        result.indexes.forEach(i => {
          delete(i.id);
        })
        this.down('space-indexes').store.loadData(result.indexes);
      })
      .catch(e => this.up('space-tab').close());
  },

  items: [{
    xtype: 'space-format',
  }, {
    xtype: 'space-indexes'
  }]
});