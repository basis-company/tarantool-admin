Ext.define('Admin.Database.Info', {

  extend: 'Ext.panel.Panel',
  title: 'Info',
  layout: {
    type: 'hbox',
  },
  border: false,
  defaults: {
    border: false,
    style: {
      marginLeft: '5px',
      marginRight: '10px',
    },
  },
  iconCls: 'fa fa-info',
  cls: 'admin-info',

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
            };
          }));
        })
        .catch(() => this.close());
    },
  },

  items: [ {
    width: 250,
    tbar: {
      height: 36,
      items: [ {
        xtype: 'label',
        text: 'Instance information',
      } ],
    },
    name: 'info',
    xtype: 'propertygrid',
    nameColumnWidth: 80,
    listeners: {
      beforeedit: function() {
        return false;
      },
    },
    source: {},
    customRenderers: {
      quota_used: Ext.util.Format.fileSize,
    },
  }, {
    tbar: {
      height: 36,
      items: [ {
        xtype: 'label',
        text: 'Query counters',
      } ],
    },
    width: 300,
    name: 'stat',
    readonly: true,
    xtype: 'grid',
    store: {
      fields: [ 'action', 'rps', 'total' ],
      sorters: [ { property: 'action', direction: 'ASC' } ],
    },
    columns: [ {
      header: 'Action',
      dataIndex: 'action',
      renderer(v) {
        return (v || '').toLowerCase();
      },
    }, {
      header: 'Rps',
      dataIndex: 'rps',
      align: 'center',
      renderer(v) {
        return v || '-';
      },
    }, {
      header: 'Total',
      align: 'right',
      dataIndex: 'total',
      renderer(v) {
        return v || '-';
      },
    } ],
  }, {
    width: 250,
    tbar: {
      height: 36,
      items: [ {
        xtype: 'label',
        text: 'Memory usage',
      } ],
    },
    name: 'slab',
    xtype: 'propertygrid',
    nameColumnWidth: 150,
    listeners: {
      beforeedit: function() {
        return false;
      },
    },
    source: {},
    customRenderers: {
      arena_size: Ext.util.Format.fileSize,
      arena_used: Ext.util.Format.fileSize,
      items_size: Ext.util.Format.fileSize,
      items_used: Ext.util.Format.fileSize,
      quota_size: Ext.util.Format.fileSize,
      quota_used: Ext.util.Format.fileSize,
    },
  } ],
});
