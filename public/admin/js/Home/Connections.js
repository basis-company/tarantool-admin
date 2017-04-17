Ext.define('Admin.Home.Connections', {

  extend: 'Ext.grid.Panel',

  title: 'Local Storage connections',

  listeners: {
    itemdblclick(view, record) {
      view.up('home-tab').showDatabase(record.data);
    },
    selectionchange(sm, sel) {
      this.down('[name=connect-button]').setDisabled(!sel.length);
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
    text: 'Connect',
    name: 'connect-button',
    iconCls: 'fa fa-link',
    disabled: true,
    handler() {
      var connection = this.up('grid').getSelectionModel().getSelection()[0].data;
      this.up('home-tab').showDatabase(connection);
    }
  }, {
    text: 'Remove all',
    iconCls: 'fa fa-ban',
    handler() {
      this.up('home-tab').clearConnections();
    }
  }],
  columns: [{
    dataIndex: 'hostname',
    header: 'Hostname',
    align: 'center',
    width: 150,
  }, {
    header: 'Port',
    dataIndex: 'port'
  }, {
    header: 'Username',
    dataIndex: 'username'
  }]

});