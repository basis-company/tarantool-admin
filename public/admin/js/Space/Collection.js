Ext.define('Admin.Space.Collection', {

  extend: 'Ext.grid.Panel',

  title: 'Data',

  iconCls: 'fa fa-table',

  requires: [
    'Admin.data.proxy.PagingDispatch',
    'Admin.Space.Indexes',
  ],

  selModel: {
     type: 'spreadsheet',
     columnSelect: true,
     listeners: {
      selectionchange(grid, sel) {
        if(this.view.grid.down('[text=Update]')) {
          this.view.grid.down('[text=Update]').setDisabled(!sel.length);
          this.view.grid.down('[text=Delete]').setDisabled(!sel.length);
        }
      }
     }
  },

  plugins: {
      ptype: 'clipboard',
  },

  tbar: {
    xtype: 'pagingtoolbar',
    displayInfo: true,
    items: ['-', {
      iconCls: 'fa fa-download',
      disabled: true,
      name: 'export',
      text: 'Export',
      handler() {
        dispatch('export.csv', this.up('grid').store.proxy.params)
          .then(result => window.location = "/"+result.path)
      }
    }]
  },

  autoLoad: true,

  initComponent() {

    if(!this.params) {
      this.params = this.up('space-tab').params;
    }

    if(this.params.index !== undefined) {
      this.closable = true;
      this.iconCls = 'fa fa-search';
    }

    this.callParent(arguments);

    if(this.autoLoad) {
      this.on('reconfigure', () => this.store.load());
    }

    this.on({
      single: true,
      activate: () => {
        dispatch('space.info', this.params)
          .then(result => {

            var fields = [];
            result.format.forEach(p => fields.push(p.name));

            this.fields = fields;
            this.format = result.format;
            this.indexes = result.indexes;

            var store = Ext.create('Ext.data.ArrayStore', {
              fields: fields,
              proxy: 'pagingdispatch',
              listeners: {
                load: () => {
                  columns.forEach((c, n) => this.view.autoSizeColumn(n))
                  this.down('[name=export]').setDisabled(!this.store.getCount());
                }
              }
            });

            store.proxy.job = 'space.select';
            store.proxy.params = this.params;

            var columns = fields.map(f => {
              return {
                dataIndex: f,
                header: f,
                width: 50,
              }
            });

            if(this.params.index !== undefined) {
              this.createSearchToolbar();
            } else {
              this.createCrudToolbar();
            }

            this.reconfigure(store, columns);
          });
      }
    })
  },

  createEntityWindow(entity) {

    var id;

    var primary = this.indexes[0].parts.map(p => this.fields[p[0]])

    if(entity) {
      var key = primary.map(f => entity.get(f));
      id = key.length == 1 ? key[0] : "[" + key.join(', ') + "]";
    }

    var required = Ext.Array.unique(Ext.Array.flatten(this.indexes.map(index => index.parts.map(p => p[0]))))

    var win = Ext.create('Ext.window.Window', {
      title: !entity ? 'New row' : 'Update ' + id,
      modal: true,
      items: [{
        xtype: 'form',
        bodyPadding: 10,
        items: this.format.map((field, id) => {
          var item = {
            name: field.name,
            xtype: 'textfield',
            labelAlign: 'right',
            fieldLabel: field.name,
            allowBlank: !Ext.Array.contains(required, id)
          };
          if(field.type != 'str') {
            Ext.apply(item, {
              xtype: 'numberfield',
              showSpinner: false,
              minValue: 0,
            });
          }
          if(entity) {
            item.value = entity.get(field.name);
            if(primary.indexOf(field.name) !== -1) {
              item.readOnly = true;
            }
          }
          return item;
        }),
        bbar: ['-', {
          text: !entity ? 'Create' : 'Update',
          formBind: true,
          handler: () => {

            var job = entity ? 'entity.update' : 'entity.create';
            var params = Ext.apply({
              values: win.down('form').getValues()
            }, this.params);

            dispatch(job, params).then(() => {
              win.close();
              this.store.load();
            })
          }
        }]
      }]
    });

    win.show();
  },

  createCrudToolbar() {

    var items = ['-', {
      text: 'Create',
      iconCls: 'fa fa-plus-circle',
      handler: () => this.createEntityWindow()
    }, {
      text: 'Update',
      iconCls: 'fa fa-pencil',
      disabled: true,
      handler: () => {
        var selected = this.getSelectionModel().getSelected();
        var record = selected.startCell ? selected.startCell.record : selected.selectedRecords.items[0];
        this.createEntityWindow(record)
      }
    }, {
      text: 'Delete',
      disabled: true,
      iconCls: 'fa fa-minus-circle',
      handler: () => {
        var selected = this.getSelectionModel().getSelected();
        var record = selected.startCell ? selected.startCell.record : selected.selectedRecords.items[0];
        var id = {};
        this.indexes[0].parts.forEach(p => {
          id[this.fields[p[0]]] = record.get(this.fields[p[0]]);
        })

        var params = Ext.apply({id: id}, this.params);

        dispatch('entity.remove', params)
          .then(() => this.store.load())
      }
    }, '-', {
      text: 'Search',
      iconCls: 'fa fa-search',
      menu: this.indexes.map(index => {
        return {
          text: index.name,
          handler: () => {
            var params = Ext.apply({index:index.iid}, this.up('space-tab').params);
            var view = Ext.create('Admin.Space.Collection', {
              params: params,
              autoLoad: false
            });
            this.up('space-tab').add(view);
            this.up('space-tab').setActiveItem(view);
          }
        }
      })
    }];

    this.down('pagingtoolbar').insert(11, items);

    this.on('itemdblclick', (record) => {
      this.down('[text=Update]').handler();
    })
  },

  createSearchToolbar() {

    var index = this.indexes.filter(i => i.iid == this.params.index)[0];

    this.setTitle('Index: ' + index.name.split('_').map(Ext.util.Format.capitalize).join(''));

    var items = ['-'];

    index.parts.forEach(p => {
      items.push({
        xtype: 'label',
        text: this.fields[p[0]]
      });

      var field = {
        xtype: 'textfield',
        searchField: true,
      };

      if(['str', 'string'].indexOf(p[1].toLowerCase()) == -1) {
        Ext.apply(field, {
          xtype: 'numberfield',
          showSpinner: false,
          minValue: 0,
        })
      }

      items.push(Ext.apply(field, {
        name: this.fields[p[0]],
        width: 70,
        labelAlign: 'right',
        enableKeyEvents: true,
        listeners: {
          specialkey(field, e) {
            if(e.getKey() == e.ENTER) {
              field.up('space-collection').down('[text=EQ]').handler();
            }
          }
        }
      }));
    });

    items.push({
      text: 'Select',
      iconCls: 'fa fa-search',
      menu: Admin.Space.Indexes.iterators.map((text, iterator) => {
        return {
          text: text,
          handler: () => {
            this.down('[text=' + text +']').up('button').setText(text + ' iterator');
            var params = [];
            this.down('pagingtoolbar').items.findBy(item => {
              if(item.searchField) {
                if(item.value === "" || item.value == undefined) {
                  return true;
                }
                params.push(item.value);
              }
            })
            this.store.proxy.params.key = [0];
            this.store.proxy.params.iterator = iterator

            this.store.proxy.params.key = params
            this.store.load();
          }
        }
      })
    });

    this.down('pagingtoolbar').remove(10);
    this.down('pagingtoolbar').insert(10, items);

    this.down('textfield').focus();
  }
});
