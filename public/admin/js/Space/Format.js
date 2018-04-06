Ext.define('Admin.Space.Format', {

  extend: 'Ext.grid.Panel',

  title: 'Format',
  flex: 1,

  store: {
    fields: ['index', 'name', 'type', 'is_nullable'],
  },

  listeners: {
    selectionchange(sm, sel) {
      this.down('[name=remove-button]').setDisabled(!sel.view.selection);
    }
  },

  tbar: [{
    text: 'Add',
    iconCls: 'fa fa-plus-circle',
    handler() {
      var win = Ext.create('Ext.window.Window', {
        modal: true,
        title: 'New property',
        items: [{
          xtype: 'form',
          bodyPadding: 10,
          items: [{
            selectOnFocus: true,
            fieldLabel: 'Name',
            allowBlank: false,
            xtype: 'textfield',
            name: 'name'
          }, {
            fieldLabel: 'Type',
            allowBlank: false,
            name: 'type',
            value: 'unsigned',

            xtype: 'combobox',
            editable: false,
            queryMode: 'local',
            displayField: 'type',
            valueField: 'type',
            store: {
              xtype: 'arraystore',
              fields: ['type'],
              data: ['unsigned', 'str', 'boolean', '*'].map(v => [v])
            }
          }, {
            xtype: 'checkboxfield',
            fieldLabel: 'Is nullable',
            checked: false,
            name: 'is_nullable',
          }],
          bbar: ['->', {
            formBind: true,
            text: 'Create',
            handler: () => {
              var values = win.down('form').getValues();
              var params = Ext.apply({
                name: values.name,
                type: values.type,
                is_nullable: !!values.is_nullable,
              }, this.up('space-tab').params);

              dispatch('space.addProperty', params)
                .then(() => {
                  win.close();
                  this.up('space-info').reloadInfo();
                });
            }
          }]
        }]
      });
      win.show();
      win.down('textfield').focus();
    }
  }, {
    disabled: true,
    name: 'remove-button',
    iconCls: 'fa fa-minus-circle',
    text: 'Remove',
    handler() {
      var params = Ext.apply({
        name: this.up('grid').selModel.getCellContext().view.selection.get('name'),
      }, this.up('space-tab').params);

      dispatch('space.removeProperty', params)
        .then(() => {
          this.up('space-info').reloadInfo();
        });
    }
  }],

  selModel: {
    type: 'spreadsheet',
    rowNumbererHeaderWidth: 0,
  },
  plugins: {
    ptype: 'clipboard',
  },

  columns: [{
    header: '#',
    width: 35,
    align: 'center',
    dataIndex: 'index',
    renderer: v => v + 1,
  },{
    header: 'Name',
    dataIndex: 'name',
    flex: 1,
  }, {
    header: 'Type',
    dataIndex: 'type',
    width: 80,
  }, {
    header: 'Nullable',
    dataIndex: 'is_nullable',
    width: 80,
    align: 'center',
    renderer(v, e, r) {
      return v ? '<span class="fa fa-check" style="font-size:14px;"></span>' : '-';
    }
  }, {
    header: 'Reference',
    dataIndex: 'reference',
    hidden: true,
    flex: 1
  }]
});
