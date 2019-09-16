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
    columnresize(table, column, width) {
      if(width != 50) {
        var config = table.grid.getWidthConfig();
        config[column.fullColumnIndex] = width;
        localStorage.setItem(table.grid.params.space+'_width', Ext.JSON.encode(config));
      }
    },
  },

  getWidthConfig() {
    var config = localStorage.getItem(this.params.space+'_width');
    if(config) {
      config = Ext.JSON.decode(config);
    }
    if(!config) {
      config = [];
    }
    return config;
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

            var config = this.getWidthConfig();

            var store = Ext.create('Ext.data.ArrayStore', {
              model: Ext.define(null, {
                extend: 'Ext.data.Model',
                fields: ['_'].concat(fields),
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
                  if(Ext.Object.getSize(config) === 0) {
                    columns.forEach((c, n) => {
                      this.view.autoSizeColumn(n);
                    });
                  }
                  this.down('toolbar-collection').updateState();
                }
              }
            });

            store.proxy.job = 'space.select';
            store.proxy.params = this.params;

            var columns = fields.map((f, i) => {
              return {
                hidden: result.fake,
                dataIndex: f,
                header: f,
                width: +config[i+1] || 50,
                renderer: (v) => {
                  if (Ext.isObject(v) || (Ext.isArray(v) && v[0])) {
                    v = Ext.JSON.encode(v);
                  }
                  if (Ext.isString(v) && v.indexOf('<') !== -1) {
                    v = Ext.String.htmlEncode(v);
                  }
                  return v;
                }
              };
            });

            this.down('toolbar-collection').applyMeta();

            if(this.params.index !== undefined) {
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
    var complexTypes = [];

    var items = this.format.map((field, id) => {
      var item = {
        name: field.name,
        xtype: 'textfield',
        labelAlign: 'right',
        fieldLabel: field.name,
        allowBlank: !Ext.Array.contains(required, id),
        flex: 1,
      };
      if(field.type == '*') {
        complexTypes.push(field.name);
      }
      if (['unsigned', 'UNSIGNED', 'num', 'NUM'].indexOf(field.type) != -1) {
        Ext.apply(item, {
          xtype: 'numberfield',
          showSpinner: false,
        });
      }
      if (['boolean', 'BOOLEAN'].indexOf(field.type) != -1) {
        Ext.apply(item, {
          xtype: 'checkbox',
        });
      }
      if(entity) {
        item.value = entity.get(field.name);
        if(Ext.isObject(item.value) || Ext.isArray(item.value)) {
          if (complexTypes.indexOf(field.name) == -1) {
            complexTypes.push(field.name);
          }
          item.value = Ext.JSON.encode(item.value);
        }
        if(primary.indexOf(field.name) !== -1) {
          item.readOnly = true;
        }
        if (item.xtype == 'numberfield' && item.value >= Math.pow(2, 32)) {
          item.xtype = 'textfield';
        }
      }
      return item;
    });

    var columnsCount = 1;
    var itemsPerColumn = items.length;
    while(itemsPerColumn >= 16) {
      itemsPerColumn /= 2;
      columnsCount++;
    }

    itemsPerColumn = Math.ceil(itemsPerColumn);

    var columns = [];
    if(columnsCount > 1) {
      var i;
      for(i = 0; i < columnsCount; i++) {
        columns.push({
          border: false,
          flex: 1,
          columnWidth: .5,
          layout: {
            type: 'vbox',
            align: 'stretch'
          },
          items: Ext.Array.slice(items, i*itemsPerColumn, (i+1) * itemsPerColumn)
        });
      }
    }

    var win = Ext.create('Ext.window.Window', {
      title: !entity ? 'New ' + this.params.space : 'Update ' + this.params.space + ' ' + id,
      modal: true,
      layout: 'fit',
      items: [{
        xtype: 'form',
        layout: columns.length > 1 ? 'column' : {
          type: 'vbox',
          align: 'stretch'
        },
        bodyPadding: 10,
        items: columns.length > 1 ? columns : items,
        bbar: ['->', {
          text: !entity ? 'Create' : 'Update',
          formBind: true,
          handler: () => {

            var job = entity ? 'entity.update' : 'entity.create';
            var currentValues = win.down('form').getValues();
            var values = {};
            items.forEach(item => {
              if (item.xtype == 'checkbox') {
                if (!currentValues[item.fieldLabel]) {
                  currentValues[item.fieldLabel] = false;
                }
              }
            });
            complexTypes.forEach(name => {
              try {
                currentValues[name] = Ext.JSON.decode(currentValues[name]);
              } catch (e) {
                currentValues[name] = null;
              }
            });

            Ext.Object.each(initialValues, (k, v) => {
              if(v != currentValues[k]) {
                values[k] = v;
              }
            });
            Ext.Object.each(currentValues, (k, v) => {
              if(v != initialValues[k]) {
                values[k] = v;
              }
            });

            Ext.ComponentQuery.query('checkbox', win.down('form')).forEach((checkbox) => {
              if (Ext.isDefined(values[checkbox.name])) {
                values[checkbox.name] = checkbox.getValue();
              }
            });

            if(!Ext.Object.getSize(values)) {
              return win.close();
            }

            if(entity) {
              primary.forEach(f =>  values[f] = entity.get(f));
            }

            var params = Ext.apply({
              values: values
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

    var initialValues = win.down('form').getValues();
  },
});
