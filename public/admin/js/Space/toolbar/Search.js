Ext.define('Admin.Space.toolbar.Search', {
  extend: 'Ext.toolbar.Toolbar',
  border: false,

  initComponent() {
    var grid = this.collection;
    var index = grid.indexes.filter(i => i.id == grid.params.index)[0];

    var camelCasedName = index.name.split('_')
      .map(Ext.util.Format.capitalize)
      .join('');

    grid.setTitle('Index: ' + camelCasedName);

    var items = [ {
      xtype: 'label',
      text: 'Index params',
      style: {
        marginLeft: '5px',
        marginRight: '15px',
      },
    }, ' ' ];

    index.parts.forEach(p => {
      var partName = grid.fields[(p.field === undefined && p[0]) || p.field];
      if (p.path) {
        if (!p.path.startsWith(".")) {
          partName += ".";
        }
        partName += p.path;
      }

      items.push({
        xtype: 'label',
        text: partName,
      });

      var field = {
        xtype: 'textfield',
        searchField: true,
      };

      if ([ 'str', 'string' ].indexOf((p[1] || p.type).toLowerCase()) == -1) {
        Ext.apply(field, {
          xtype: 'numberfield',
          hideTrigger: true,
          minValue: 0,
        });
      }

      items.push(Ext.apply(field, {
        name: partName,
        width: 70,
        labelAlign: 'right',
        enableKeyEvents: true,
        listeners: {
          specialkey(field, e) {
            if (e.getKey() == e.ENTER) {
              field.up('space-collection')
                .down('[text=EQ]')
                .handler();
            }
          },
        },
      }));
    });

    items.push({
      text: 'Select',
      iconCls: 'fa fa-search',
      menu: window.Admin.Space.Indexes.iterators.map((text, iterator) => {
        return {
          text: text,
          handler: () => {
            grid.down('[text=' + text +']')
              .up('button')
              .setText(text + ' iterator');
            var params = [];

            this.items.findBy(item => {
              if (item.searchField) {
                if (item.value === '' || item.value === undefined) {
                  return true;
                }

                params.push(item.value);
              }
            });
            grid.store.proxy.params.key = [ 0 ];
            grid.store.proxy.params.iterator = iterator;

            grid.store.proxy.params.key = params;
            grid.store.load();
          },
        };
      }),
    });

    this.items = items;
    this.callParent(arguments);

    setTimeout(() => this.down('textfield').focus(), 100);
  },
});
