Ext.define('Admin.Space.Collection', {

  extend: 'Ext.grid.Panel',

  title: 'Collection',

  requires: [
    'Admin.data.proxy.PagingDispatch'
  ],

  autoLoad: true,

  initComponent() {

    this.callParent(arguments);

    if(this.autoLoad) {
      this.on('reconfigure', () => this.store.load());
    }

    dispatch('space.info', this.up('space-tab').params)
      .then(result => {
        console.log(result);

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
        store.proxy.params = this.up('space-tab').params;

        var columns = fields.map(f => {
          return {
            dataIndex: f,
            header: f,
            width: 50,
          }
        });

        this.reconfigure(store, columns);
        console.log([store, columns]);
      });
  }
});