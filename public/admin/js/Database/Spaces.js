Ext.define('Admin.Database.Spaces', {

  extend: 'Ext.grid.Panel',

  name: 'spaces',
  title: 'Spaces',
  iconCls: 'fa fa-bars',
  border: false,

  isUserSpace(record) {
    return record.get('id') >= 512;
  },

  refreshSpaces: function() {
    dispatch('database.spaces', this.up('database-tab').params)
      .then(result => {
        this.store.loadData(result.spaces);
      });
  },

  createSpace() {
    var win = Ext.create('Ext.window.Window', {
      modal: true,
      title: 'New space',
      items: [ {
        xtype: 'form',
        bodyPadding: 10,
        items: [ {
          fieldLabel: 'Name',
          xtype: 'textfield',
          allowBlank: false,
          name: 'name',
        } ],
        bbar: [ '->', {
          formBind: true,
          text: 'Create',
          handler: () => {
            var space = win.down('form').getValues().name;

            dispatch('space.create', this.spaceParams(space))
              .then(() => {
                win.close();
                this.refreshSpaces();
              });
          },
        } ],
      } ],
    });

    win.show();
    win.down('textfield').focus();
  },

  spaceParams(space) {
    return Ext.apply({
      space: space,
    }, this.up('database-tab').params);
  },

  showSpace(space) {
    var exists = false;

    this.up('database-tab').items.each(item => {
      if (item.params && item.params.space == space) {
        this.up('database-tab').setActiveItem(item);
        exists = true;
      }
    });

    if (!exists) {
      var view = Ext.create('Admin.Space.Tab', {
        params: this.spaceParams(space),
      });

      this.up('database-tab').add(view);
      this.up('database-tab').setActiveItem(view);
    }
  },

  keyEmptyCheck(key) {
    return !key || key.every(v => v == null);
  },

  keyValidCheck(key) {
    var isValid = true;

    if (this.keyEmptyCheck(key)) {
      isValid = false;
    }
    else {
      for (let i=0; i<key.length-1; i++) {
        if (key[i] == undefined && key[i+1] != undefined) {
          isValid = false;
          break;
        }
      }
    }

    return isValid;
  },

  truncateSpace(space, searchdata = undefined) {
    var params = this.spaceParams(space);

    var message =
    'Are you sure to truncate space ' + space + '?<br/>' +
    'This operation can not be undone';

    if (searchdata && searchdata.index >= 0) {
      if (!this.keyValidCheck(searchdata.key)) {
        Ext.Msg.alert('Warning!', 'Not valid key. Please, fill in all fields starting from the first.');
        return;
      }

      Ext.apply(params, searchdata);
      delete params.indexObj;
      message = 'Are you sure to delete tuples by index ' +  searchdata.indexObj.name +
                ' and key ' + searchdata.key + ' from space ' + space + '?<br/>' +
                'This operation can not be undone';
    }

    Ext.MessageBox.confirm({
      title: 'Danger!',
      icon: Ext.MessageBox.WARNING,
      message: message,
      buttons: Ext.MessageBox.YESNO,
      callback: (answer) => {
        if (answer == 'yes') {
          dispatch('space.truncate', params)
            .then(() => {
              this.refreshSpaces();
              this.up('database-tab').items.each(item => {
                if (item.params && item.params.space == space) {
                  item.items.each(item => {
                    if (item.xtype == 'space-collection') {
                      item.store.load();
                    }
                  });
                }
              });
            });
        }
      },
    });
  },

  dropSpace(space) {
    Ext.MessageBox.confirm(
      'Danger!',
      'Are you sure to drop space ' + space + '?<br/>This operation can not be undone',
      answer => {
        if (answer == 'yes') {
          dispatch('space.drop', this.spaceParams(space))
            .then(() => {
              this.refreshSpaces();
              this.up('database-tab').items.each(item => {
                if (item.params && item.params.space == space) {
                  this.up('database-tab').remove(item);
                }
              });
            });
        }
      }
    );
  },

  listeners: {
    render: function() {
      if (window.configuration.readOnly) {
        this.down('[text=Create]').hide();
        this.down('[text=Truncate]').hide();
        this.down('[text=Drop]').hide();
      }

      this.store.addFilter((record) => {
        if (this.down('[name=system-spaces]').value) {
          return true;
        }

        return this.isUserSpace(record);
      });
    },
    activate: function() {
      if (!this.store.getCount()) {
        this.refreshSpaces();
      }
    },
    itemdblclick(view, record) {
      view.up('database-spaces').showSpace(record.get('name'));
    },
    selectionchange(sm, sel) {
      this.down('[name=open-button]').setDisabled(!sel.length);
      this.down('[name=drop-button]').setDisabled(!sel.length || !this.isUserSpace(sel[0]));
      this.down('[name=truncate-button]').setDisabled(!sel.length || !this.isUserSpace(sel[0]));
    },
  },

  store: {
    fields: [ {
      id: 'id',
      type: 'integer',
    }, 'name', 'engine', 'count', {
      name: 'owner',
      type: 'integer',
    } ],
    sorters: [ { property: 'name', direction: 'ASC' } ],
  },

  tbar: [ {
    xtype: 'label',
    text: 'Spaces',
  }, {
    xtype: 'filter-field',
  }, {
    text: 'Create',
    iconCls: 'fa fa-plus',
    handler() {
      this.up('database-spaces').createSpace();
    },
  }, {
    text: 'Open',
    name: 'open-button',
    iconCls: 'fa fa-table',
    disabled: true,
    handler() {
      this.up('database-spaces').showSpace(
        this.up('grid')
          .getSelectionModel()
          .getSelection()[0]
          .get('name')
      );
    },
  }, {
    text: 'Truncate',
    name: 'truncate-button',
    iconCls: 'fa fa-trash',
    disabled: true,
    handler() {
      this.up('database-spaces').truncateSpace(
        this.up('grid')
          .getSelectionModel()
          .getSelection()[0]
          .get('name')
      );
    },
  }, {
    text: 'Drop',
    name: 'drop-button',
    iconCls: 'fa fa-ban',
    disabled: true,
    handler() {
      this.up('database-spaces').dropSpace(
        this.up('grid')
          .getSelectionModel()
          .getSelection()[0]
          .get('name')
      );
    },
  }, '->', {
    text: 'Show system',
    iconCls: 'far fa-circle',
    name: 'system-spaces',
    value: false,
    handler() {
      this.setIconCls(this.value ? 'far fa-circle' : 'far fa-check-circle');
      this.value = this.iconCls == 'far fa-check-circle';
      this.up('database-spaces').refreshSpaces();
    },
  }, {
    text: 'Refresh',
    iconCls: 'fa fa-sync',
    handler() {
      this.up('database-spaces').refreshSpaces();
    },
  } ],
  columns: [ {
    header: 'Id',
    dataIndex: 'id',
    align: 'center',
    width: 60,
  }, {
    header: 'Name',
    dataIndex: 'name',
    width: 200,
  }, {
    align: 'center',
    header: 'Engine',
    dataIndex: 'engine',
  }, {
    header: 'Count',
    align: 'right',
    dataIndex: 'count',
    renderer: v => v == null ? '-' : v,
  }, {
    header: 'Size',
    align: 'right',
    dataIndex: 'bsize',
    renderer: v => v == null ? '-' : Ext.util.Format.fileSize(v),
  } ],
});
