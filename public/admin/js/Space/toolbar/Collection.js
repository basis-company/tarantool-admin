Ext.define('Admin.space.toolbar.Collection', {

  extend: 'Ext.toolbar.Toolbar',
  xtype: 'toolbar-collection',

  initComponent() {
    this.callParent(arguments);
    if(localStorage.getItem('admin-page-size')) {
      this.down('[name=pageSize]').setValue(localStorage.getItem('admin-page-size'));
    }
  },

  updateState() {
    var store = this.up('grid').store;
    var pageCount = Math.ceil(store.getTotalCount() / store.pageSize);
    var currentPage = store.currentPage;

    var stats = this.down('[name=paging-stats]');
    var prev = this.down('[name=previous-page]');
    var next = this.down('[name=next-page]');

    if(pageCount <= 1) {
      stats.hide();
      prev.hide();
      next.hide();
      return;

    } else {
      stats.show();
      prev.show();
      next.show();
    }

    stats.setText(currentPage + ' / ' + pageCount);
    prev.setDisabled(currentPage == 1);
    next.setDisabled(currentPage == pageCount);
  },

  items: [{
    text:    'Create',
    iconCls: 'fa fa-plus-circle',
    handler() {
      this.up('grid').createEntityWindow();
    }
  }, {
    text:     'Update',
    iconCls:  'fa fa-pencil',
    disabled: true,
    handler() {
      var selected = this.up('grid').getSelectionModel().getSelected();
      var record = selected.startCell ? selected.startCell.record : selected.selectedRecords.items[0];
      this.up('grid').createEntityWindow(record);
    }
  }, {
    text:     'Delete',
    disabled: true,
    iconCls:  'fa fa-minus-circle',
    handler() {
      var grid = this.up('grid');
      var selected = grid.getSelectionModel().getSelected();
      var record = selected.startCell ? selected.startCell.record : selected.selectedRecords.items[0];
      var id = {};
      grid.indexes[0].parts.forEach(p => {
        id[grid.fields[p[0]]] = record.get(grid.fields[p[0]]);
      });

      var params = Ext.apply({id: id}, grid.params);

      dispatch('entity.remove', params)
        .then(() => grid.store.load());
    }
  }, {
    text:     'Search',
    iconCls:  'fa fa-search',
    name:     'search',
    disabled: true,
    menu:     []
  }, {
    iconCls:  'fa fa-download',
    disabled: true,
    name:     'export',
    text:     'Export',
    handler() {
      dispatch('export.csv', this.up('grid').store.proxy.params)
        .then(result => window.location = "/"+result.path);
    }
  }, '->', {
    xtype:    'numberfield',
    minValue:   0,
    value:      25,
    width:      140,
    labelWidth: 65,
    fieldLabel: 'Page size',
    name:        'pageSize',
    listeners: {
      buffer: 500,
      change(field, v) {
        this.up('grid').store.setPageSize(v);
        this.up('grid').store.load();
        localStorage.setItem('admin-page-size', v);
      }
    }
  }, {
    iconCls: 'fa fa-chevron-left',
    name: 'previous-page',
    handler() {
      this.up('grid').store.previousPage();
    }
  }, {
    xtype: 'label',
    name: 'paging-stats',
    padding: 1,
  }, {
    iconCls: 'fa fa-chevron-right',
    name: 'next-page',
    handler() {
      this.up('grid').store.nextPage();
    }
  }],

  applyMeta() {

    var indexMenu = this.up('grid').indexes.map(index => {
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
      };
    });

    var search = this.down('[name=search]');
    if(indexMenu.length) {
      search.setMenu(indexMenu);
      search.enable();
    }
  },
});
