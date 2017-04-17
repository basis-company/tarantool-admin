Ext.define('Admin.Space.Collection', {

  extend: 'Ext.grid.Panel',

  title: 'Collection',

  requires: [
    'Admin.data.proxy.PagingDispatch'
  ],

  tbar: {
    xtype: 'pagingtoolbar',
    displayInfo: true,
  },

  autoLoad: true,

  initComponent() {

    if(!this.params) {
      this.params = this.up('space-tab').params;
    }

    this.closable = this.params.index !== undefined;

    this.callParent(arguments);

    if(this.autoLoad) {
      this.on('reconfigure', () => this.store.load());
    }

    dispatch('space.info', this.params)
      .then(result => {

        var fields = [];
        result.format.forEach(p => fields.push(p.name));

        var store = Ext.create('Ext.data.ArrayStore', {
          fields: fields,
          proxy: 'pagingdispatch',
          listeners: {
            load: () => columns.forEach((c, n) => this.view.autoSizeColumn(n))
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
          this.updateSearchToolbar(result.indexes.filter(i => i.iid == this.params.index)[0], fields);
        }

        this.reconfigure(store, columns);
      });
  },


  updateSearchToolbar(index, fields) {

    this.setTitle('Index: ' + index.name.split('_').map(Ext.util.Format.capitalize).join(''));

    var items = [];

    index.parts.forEach(p => {
      items.push({
        xtype: 'label',
        text: fields[p[0]]
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
        name: fields[p[0]],
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
      menu: ['EQ', 'REQ', 'ALL', 'LT', 'LE', 'GE', 'GT', 'BITS_ALL_SET', 'BITS_ANY_SET', 'BITS_ALL_NOT_SET', 'OVERLAPS', 'NEIGHBOR'].map((text, iterator) => {
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
            if(params.length) {
              this.store.proxy.params.key = params
              this.store.load();
            }
          }
        }
      })
    });

    this.down('pagingtoolbar').insert(10, items);
  }
});