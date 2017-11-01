Ext.define('Admin.Space.toolbar.Search', {
  extend: 'Ext.toolbar.Toolbar',
  border: false,

  initComponent() {
    var grid = this.collection;
    var index = grid.indexes.filter(i => i.iid == grid.params.index)[0];

    grid.setTitle('Index: ' + index.name.split('_').map(Ext.util.Format.capitalize).join(''));

    var items = [{
      xtype: 'label',
      text: 'Query'
    },' '];

    index.parts.forEach(p => {
      items.push({
        xtype: 'label',
        text: grid.fields[p[0]]
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
        });
      }

      items.push(Ext.apply(field, {
        name: grid.fields[p[0]],
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
            grid.down('[text=' + text +']').up('button').setText(text + ' iterator');
            var params = [];
            this.items.findBy(item => {
              if(item.searchField) {
                if(item.value === "" || item.value === undefined) {
                  return true;
                }
                params.push(item.value);
              }
            });
            grid.store.proxy.params.key = [0];
            grid.store.proxy.params.iterator = iterator;

            grid.store.proxy.params.key = params;
            grid.store.load();
          }
        };
      })
    });
    this.items = items;
    this.callParent(arguments);
  },
});
