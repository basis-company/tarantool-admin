Ext.define('Admin.Home.Connections', {

  extend: 'Ext.grid.Panel',

  title: 'Persisted Tarantool connections',
  flex: 1,

  listeners: {
    itemdblclick(view, record) {
      view.up('home-tab').showDatabase(record.data);
    },
    selectionchange(sm, sel) {
      this.down('[name=connect-button]').setDisabled(!sel.length);
      this.down('[name=remove-button]').setDisabled(!sel.length);
    }
  },

  store: {
    fields: ['hostname', 'port', 'username', 'password'],
    sorters: [
      {property: 'hostname', direction: 'ASC'},
      {property: 'port', direction: 'ASC'},
      {property: 'username', direction: 'ASC'},
    ]
  },

  tbar: [{
    xtype: 'filter-field',
  }, {
    text: 'Connect',
    name: 'connect-button',
    iconCls: 'fa fa-link',
    disabled: true,
    handler() {
      var connection = this.up('grid').getSelectionModel().getSelection()[0].data;
      this.up('home-tab').showDatabase(connection);
    }
  }, {
    text: 'Remove',
    name: 'remove-button',
    iconCls: 'fa fa-trash',
    disabled: true,
    handler() {
      Ext.MessageBox.confirm('Confirmation', 'Are you sure want to remove selected connection?<br/>This operation has no rollback!', (btn) => {
        if (btn == 'yes') {
          var connection = this.up('grid').getSelectionModel().getSelection()[0].data;
          this.up('home-tab').removeConnection(connection);
        }
      });
    }

  }, {
    text: 'Remove all',
    name: 'remove-all',
    iconCls: 'fa fa-ban',
    handler() {
      Ext.MessageBox.confirm('Confirmation', 'Are you sure want to remove all connections?<br/>This operation has no rollback!', (btn) => {
        if (btn == 'yes') {
          var connection = this.up('grid').getSelectionModel().getSelection()[0].data;
          this.up('home-tab').removeConnection(connection);
        }
      });
      this.up('home-tab').clearConnections();
    }
  }],
  columns: [{
    dataIndex: 'hostname',
    header: 'Hostname',
    align: 'center',
    width: 150,
    renderer(v, e, r) {
      return v || r.get('socket');
    }
  }, {
    header: 'Port',
    dataIndex: 'port',
    align: 'center',
    renderer(v, el) {
      if(v == 3301) {
        el.style = "color: #999";
      }
      return v;
    }
  }, {
    header: 'Username',
    dataIndex: 'username',
    align: 'center',
    renderer(v, el) {
      if(v == 'guest') {
        el.style = "color: #999";
      }
      return v;
    }
  }]

});
