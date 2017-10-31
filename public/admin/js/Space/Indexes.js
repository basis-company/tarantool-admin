Ext.define('Admin.Space.Indexes', {

  extend: 'Ext.grid.Panel',

  title: 'Indexes',
  flex: 1,

  statics: {
    iterators: ['EQ', 'REQ', 'ALL', 'LT', 'LE', 'GE', 'GT', 'BITS_ALL_SET', 'BITS_ANY_SET', 'BITS_ALL_NOT_SET', 'OVERLAPS', 'NEIGHBOR'],
  },

  store: {
    fields: ['iid', 'name', 'type', 'parts', 'opts']
  },

  selModel: {
    type: 'spreadsheet',
    rowNumbererHeaderWidth: 0,
  },
  plugins: {
    ptype: 'clipboard',
  },

  listeners: {
    selectionchange(sm, sel) {
      this.down('[name=remove-button]').setDisabled(!sel.view.selection);
      this.down('[name=search-button]').setDisabled(!sel.view.selection);
    },
    itemdblclick() {
      this.down('[name=search-button]').handler();
    }
  },

  tbar: [{
    text: 'Add',
    iconCls: 'fa fa-plus-circle',
    handler() {
      var indexes = this.up('space-indexes');
      var win = Ext.create('Ext.window.Window', {
        modal: true,
        title: 'New index',
        items: [{
          xtype: 'form',
          bodyPadding: 10,
          defaults: {
            width: 300,
            fieldLabel: 80,
          },
          items: [{
            fieldLabel: 'Fields',
            xtype: 'tagfield',
            displayField: 'name',
            name: 'fields',
            valueField: 'index',
            store: {
              fields: ['index', 'name'],
              data: this.up('space-info').down('space-format').store.getRange().map((r, index) => {
                return {
                  index: index,
                  name: r.get('name')
                };
              })
            },
            listeners: {
              select() {
                var nameField = win.down('[name=name]');
                var fieldsField = win.down('[name=fields]');
                var format = indexes.up('space-info').down('space-format').store;
                if(!nameField.edited) {
                  var name = fieldsField.value.map(i => format.getAt(i).get('name')).join('_');
                  nameField.setValue(name);
                }
              }
            }
          }, {
            fieldLabel: 'Name',
            xtype: 'textfield',
            allowBlank: false,
            name: 'name'
          }, {

            fieldLabel: 'Type',
            value: 'TREE',
            name: 'type',

            xtype: 'combobox',
            editable: false,
            queryMode: 'local',
            displayField: 'type',
            valueField: 'type',
            store: {
              xtype: 'arraystore',
              fields: ['type'],
              data: ['TREE', 'HASH', 'BITSET', 'RTREE'].map(v => [v])
            }
          }, {
            xtype: 'checkboxfield',
            boxLabel: 'Unique index',
            checked: true,
            fieldLabel: '',
            name: 'unique',
          }],
          bbar: ['->', {
            formBind: true,
            text: 'Create',
            handler: () => {
              var values = win.down('form').getValues();
              var params = Ext.apply({
                name: values.name,
                fields: values.fields,
                type: values.type,
                unique: !!values.unique,
              }, this.up('space-tab').params);

              dispatch('space.createIndex', params)
                .then(() => {
                  win.close();
                  this.up('space-info').reloadInfo();
                });
            }
          }]
        }]
      })
      win.show();
      win.down('textfield').focus();
    }
  }, {
    text: 'Search',
    iconCls: 'fa fa-search',
    disabled: true,
    name: 'search-button',
    handler() {
      var params = Ext.apply({
        index: this.up('space-indexes').selModel.getCellContext().view.selection.get('iid')
      }, this.up('space-tab').params);

      var view = Ext.create('Admin.Space.Collection', {
        params: params,
        autoLoad: false
      });
      this.up('space-tab').add(view);
      this.up('space-tab').setActiveItem(view);
    }
  }, {
    text: 'Remove',
    disabled: true,
    name: 'remove-button',
    iconCls: 'fa fa-minus-circle',
    handler() {
      var params = Ext.apply({
        name: this.up('space-indexes').selModel.getCellContext().view.selection.get('name')
      }, this.up('space-tab').params);

      var store = this.up('space-indexes').store;
      var recordIndex = store.findExact('name', params.name);

      var removeIndex = () => {
        dispatch('space.removeIndex', params)
          .then(() => {
            this.up('space-info').reloadInfo();
          })
      };

      if(store.getAt(recordIndex).get('iid') > 0) {
        removeIndex();
      } else {
        Ext.MessageBox.confirm(
          'Danger!',
          'Are you sure to drop primary key ' + params.name + ' in space ' + params.space + '?<br/>All tuples will be deleted, this operation can not be undone',
          answer => {
            if(answer == 'yes') {
              removeIndex();
            }
          }
        );
      }
    }
  }],

  columns: [{
    dataIndex: 'name',
    header: 'Name',
    width: 160,
  }, {
    dataIndex: 'type',
    header: 'Type',
    align: 'center',
    width: 70
  }, {
    dataIndex: 'size',
    header: 'Size',
    align: 'right',
    width: 70,
    renderer: v => v ? Ext.util.Format.fileSize(v) : '-',
  }, {
    dataIndex: 'opts',
    header: 'Unique',
    align: 'center',
    width: 80,
    renderer: v => v.unique
  }, {
    dataIndex: 'parts',
    header: 'Parts',
    flex: 1,
    renderer(v) {
      var format = this.up('space-info').down('space-format').store;
      if(!format.getCount()) {
        return v.map(info => info[0]).join(', ');
      }
      return v.map(info => format.getAt(info[0]).get('name')).join(', ');
    }
  }]
});
