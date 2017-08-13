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

  tbar: [{
    iconCls: 'fa fa-chevron-left',
  }, {
    xtype: 'label',
    name: 'paging-info',
  }, {
    iconCls: 'fa fa-chevron-right',
  }],

  listeners: {
    afterrenderer() {
      console.log('renderer');
    },
  },

  autoLoad: true,

  initComponent() {

    if(!this.params) {
      this.params = this.up('space-tab').params;
    }

    this.tbar = Ext.create('Admin.Space.toolbar.Collection', {
      params: this.params
    });

    if(this.params.index !== undefined) {
      this.closable = true;
      this.iconCls = 'fa fa-search';
    }

    this.callParent(arguments);

    if(this.autoLoad) {
      this.on('reconfigure', () => this.store.load());
    }

    this.on('itemdblclick', (record) => {
      this.down('[text=Update]').handler();
    });

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
              model: Ext.define(null, {
                extend: 'Ext.data.Model',
                fields: fields,
                idProperty: '_'
              }),
              proxy: 'pagingdispatch',
              listeners: {
                load: () => {
                  this.down('[name=export]').setDisabled(!this.store.getCount());
                  var maxSize = 0;
                  if(result.fake) {
                    this.store.getRange().forEach(r => {
                      if(Ext.Object.getSize(r.data) > maxSize) {
                        maxSize = Ext.Object.getSize(r.data);
                      }
                    });
                  }
                  columns.forEach((c, n) => {
                    if(result.fake) {
                      if(n >= maxSize-1) {
                        this.getColumns()[n+1].hide();
                      } else {
                        this.getColumns()[n+1].show();
                      }
                    }
                  });
                  columns.forEach((c, n) => {
                    this.view.autoSizeColumn(n);
                  });
                  this.down('toolbar-collection').updateState();
                }
              }
            });

            store.proxy.job = 'space.select';
            store.proxy.params = this.params;

            var columns = fields.map(f => {
              return {
                hidden: result.fake,
                dataIndex: f,
                header: f,
                width: 50,
                renderer: (v) => {
                  if(Ext.isObject(v)) {
                    return Ext.JSON.encode(v);
                  }
                  return v;
                }
              };
            });

            this.down('toolbar-collection').applyMeta();

            if(this.params.index !== undefined) {
              console.log('search toolbar added');
              this.addDocked(Ext.create('Admin.Space.toolbar.Search', {
                collection: this
              }), 0);
            }

            this.reconfigure(store, columns);
          });
      }
    });
  },

  createEntityWindow(entity) {

    var id;

    var primary = this.indexes[0].parts.map(p => this.fields[p[0]]);

    if(entity) {
      var key = primary.map(f => entity.get(f));
      id = key.length == 1 ? key[0] : "[" + key.join(', ') + "]";
    }

    var required = Ext.Array.unique(Ext.Array.flatten(this.indexes.map(index => index.parts.map(p => p[0]))));

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
            });
          }
        }]
      }]
    });
    win.show();
  },
});
