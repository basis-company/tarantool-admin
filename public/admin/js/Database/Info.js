Ext.define('Admin.Database.Info', {

  extend: 'Ext.panel.Panel',
  title: 'Info',
  layout: {
    type: 'hbox',
    align: 'stretch',
  },
  border: false,
  iconCls: 'fa fa-info',

  listeners: {
    activate() {
      dispatch('database.info', this.up('database-tab').params)
        .then(result => {
          this.down('[name=info]').setSource(result.info);
          this.down('[name=slab]').setSource(result.slab);
          this.down('[name=stat]').store.loadData(Ext.Object.getKeys(result.stat).map(k => {
            return {
              action: k,
              rps: result.stat[k].rps,
              total: result.stat[k].total,
            }
          }));
        })
        .catch(e => this.close())
    },
  },


  items: [{
    width: 200,
    title: 'Info',
    name: 'info',
    xtype: 'propertygrid',
    nameColumnWidth: 80,
    listeners: {
      beforeedit: function (e) { return false; }
    },
    source: {},
    customRenderers: {
      quota_used: Ext.util.Format.fileSize,
    }
  }, {
    width: 250,
    title: 'Slab',
    name: 'slab',
    xtype: 'propertygrid',
    border: false,
    nameColumnWidth: 150,
    listeners: {
      beforeedit: function (e) { return false; }
    },
    source: {},
    customRenderers: {
      arena_size: Ext.util.Format.fileSize,
      arena_used: Ext.util.Format.fileSize,
      items_size: Ext.util.Format.fileSize,
      items_used: Ext.util.Format.fileSize,
      quota_size: Ext.util.Format.fileSize,
      quota_used: Ext.util.Format.fileSize,
    }
  }, {
    title: 'Stat',
    flex: 1,
    name: 'stat',
    readonly: true,
    xtype: 'grid',
    store: {
      fields: ['action', 'rps', 'total']
    },
    columns: [{
      header: 'Action',
      dataIndex: 'action'
    }, {
      header: 'Rps',
      dataIndex: 'rps',
    }, {
      header: 'Total',
      dataIndex: 'total',
    }]
  }]
});
