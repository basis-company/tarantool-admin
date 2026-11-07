Ext.define('Admin.Home.Connections', {

  extend: 'Ext.grid.Panel',

  flex: 1,
  hidden: true,

  listeners: {
    itemdblclick(view, record) {
      view.up('home-tab').showDatabase(record.data);
    },
    selectionchange(sm, sel) {
      this.down('[name=connect-button]').setDisabled(!sel.length);
      this.down('[name=remove-button]').setDisabled(!sel.length);
    },
  },

  store: {
    fields: [ 'name', 'hosts', 'hostname', 'port', 'socket', 'username', 'password', 'cluster' ],
    sorters: [
      { property: 'name', direction: 'ASC' },
      { property: 'hostname', direction: 'ASC' },
      { property: 'port', direction: 'ASC' },
      { property: 'username', direction: 'ASC' },
    ],
  },

  tbar: [ {
    xtype: 'label',
    text: 'Connection list',
  }, {
    xtype: 'filter-field',
  }, {
    text: 'Connect',
    name: 'connect-button',
    iconCls: 'fa fa-link',
    disabled: true,
    handler() {
      var connection = this.up('grid')
        .getSelectionModel()
        .getSelection()[0]
        .data;

      this.up('home-tab').showDatabase(connection);
    },
  }, {
    text: 'Remove',
    name: 'remove-button',
    iconCls: 'fa fa-trash',
    disabled: true,
    hidden: true,
    handler() {
      Ext.MessageBox.confirm('Confirmation', 'Are you sure want to remove selected connection?<br/>This operation has no rollback!', (btn) => {
        if (btn == 'yes') {
          var connection = this.up('grid')
            .getSelectionModel()
            .getSelection()[0]
            .data;

          this.up('home-tab').removeConnection(connection);
        }
      });
    },
  }, {
    text: 'Remove all',
    name: 'remove-all',
    iconCls: 'fa fa-ban',
    hidden: true,
    handler() {
      Ext.MessageBox.confirm('Confirmation', 'Are you sure want to remove all connections?<br/>This operation has no rollback!', (btn) => {
        if (btn == 'yes') {
          this.up('home-tab').clearConnections();
        }
      });
    },
  } ],
  columns: [ {
    dataIndex: 'name',
    header: 'Name',
    align: 'center',
    width: 120,
    renderer(v, e, r) {
      return v || '<span style="color: #999">-</span>';
    },
  }, {
    dataIndex: 'hosts',
    header: 'Host(s)',
    align: 'center',
    width: 220,
    renderer(v, e, r) {
      if (v) {
        return Ext.isArray(v) ? v.join(', ') : v;
      }

      return r.get('socket') || r.get('hostname');
    },
  }, {
    header: 'Username',
    dataIndex: 'username',
    align: 'center',
    width: 100,
    renderer(v, el) {
      if (v == 'guest') {
        el.style = 'color: #999';
      }

      return v;
    },
  }, {
    header: 'Cluster',
    dataIndex: 'cluster',
    align: 'center',
    width: 70,
    renderer(v) {
      return v ? '<span class="fa fa-sitemap"></span>' : '';
    },
  } ],
});
