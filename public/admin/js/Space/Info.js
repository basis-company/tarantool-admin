Ext.define('Admin.Space.Info', {

  extend: 'Ext.panel.Panel',
  title: 'Info',

  requires: [
    'Admin.Space.Format',
    'Admin.Space.Indexes',
  ],

  layout: 'hbox',

  iconCls: 'fa fa-info',

  listeners: {
    activate() {
      this.reloadInfo();
    }
  },

  reloadInfo() {
    dispatch('space.info', this.up('space-tab').params)
      .then(result => {
        result.indexes.forEach(i => delete(i.id));
        this.down('space-format').store.loadData([]);
        if(!result.fake) {
          result.format.forEach((r, i) => r.index = i);
          this.down('space-format').store.loadData(result.format);
          var hasReferences = result.format.filter(f => !!f.reference).length;
          this.down('space-format').getColumns()[5].setHidden(!hasReferences);
          this.down('space-format').setWidth(hasReferences ? 380 : 300);
        }
        this.down('space-indexes').store.loadData(result.indexes);
        var indexSizeExists = result.indexes.filter(f => !!f.size).length;
        this.down('space-indexes').getColumns()[3].setHidden(!indexSizeExists);

      })
      .catch(e => this.up('space-tab').close());
  },

  items: [{
    xtype: 'space-format',
  }, {
    xtype: 'space-indexes'
  }]
});
