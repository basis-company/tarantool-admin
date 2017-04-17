Ext.define('Admin.Space.Indexes', {

  extend: 'Ext.grid.Panel',

  title: 'Indexes',
  flex: 1,

  store: {
    fields: ['iid', 'name', 'type', 'parts', 'opts']
  },

  listeners: {
    selectionchange(sm, sel) {
      this.down('[name=remove-button]').setDisabled(!sel.length);
      this.down('[name=search-button]').setDisabled(!sel.length);
    },
    itemdblclick() {
      this.down('[name=search-button]').handler();
    }
  },

  tbar: [{
    text: 'Add',
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
            xtype: 'textfield',
            allowBlank: false,
            value: 'TREE',
            name: 'type',
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
    disabled: true,
    name: 'search-button',
    handler() {
      var params = Ext.apply({
        index: this.up('space-indexes').getSelectionModel().getSelection()[0].get('iid')
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
    handler() {
      var params = Ext.apply({
        name: this.up('space-indexes').getSelectionModel().getSelection()[0].get('name')
      }, this.up('space-tab').params);

      dispatch('space.removeIndex', params)
        .then(() => {
          this.up('space-info').reloadInfo();
        })
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
      return v.map(info => format.getAt(info[0]).get('name')).join(', ');
    }
  }]
});