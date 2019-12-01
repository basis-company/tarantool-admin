Ext.define('Admin.Space.toolbar.Collection', {

  extend: 'Ext.toolbar.Toolbar',
  xtype: 'toolbar-collection',

  initComponent() {
    this.items = this.getDefaultItems();
    this.callParent(arguments);
    if(localStorage.getItem('admin-page-size')) {
      this.down('[name=pageSize]').setValue(localStorage.getItem('admin-page-size'));
    }
  },

  updateState() {
    var store = this.up('grid').store;
    var pageCount = Math.ceil(store.getTotalCount() / store.pageSize);
    var currentPage = store.currentPage;

    this.down('[name=row-counter]').setValue(store.getTotalCount());

    var stats = this.down('[name=paging-stats]');
    var first = this.down('[name=first-page]');
    var prev = this.down('[name=previous-page]');
    var current = this.down('[name=current-page]');
    var delimeter = this.down('[name=current-page-delimiter]');
    var total = this.down('[name=total-pages]');
    var next = this.down('[name=next-page]');
    var last = this.down('[name=last-page]');

    if(pageCount <= 1) {
      [first, prev, current, delimeter, total, next, last].forEach(b => b.hide());

    } else {
      [first, prev, current, delimeter, total, next, last].forEach(b => b.show());
      first.setDisabled(currentPage == 1);
      prev.setDisabled(currentPage == 1);
      current.setValue(currentPage);
      total.setText(pageCount);
      next.setDisabled(currentPage == pageCount);
      last.setDisabled(currentPage == pageCount);
    }
  },

  getDefaultItems() {
    return [{
      text:    'Create',
      iconCls: 'fa fa-plus-circle',
      handler() {
        this.up('grid').createEntityWindow();
      }
    }, {
      text:     'Update',
      iconCls:  'fa fa-edit',
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
      text: 'Truncate',
      iconCls: 'fa fa-trash',
      handler() {

        var space = this.up('grid').store.proxy.params.space;

        // > database tabs
        //  > collection
        //  > space tabs
        //   > {collection}

        this.up('tabpanel').up('tabpanel')
          .down('[name=spaces]')
          .truncateSpace(space);
      }
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
      fieldLabel: 'Total rows',
      labelAlign: 'right',
      labelWidth: 65,
      name:       'row-counter',
      readOnly:   true,
      value:      0,
      width:      20,
      xtype:      'numberfield',
    }, ' ',{
      xtype:    'numberfield',
      minValue:   1,
      value:      25,
      width:      20,
      labelWidth: 65,
      labelAlign: 'right',
      fieldLabel: 'Page size',
      selectOnFocus: true,
      name:        'pageSize',
      hideTrigger: true,
      keyNavEnabled: false,
      listeners: {
        buffer: 500,
        change(field, v) {
          if (!v) {
            return this.setValue(1);
          }
          var store = this.up('grid').store;
          if (store.pageSize != v) {
            this.up('grid').store.setPageSize(v);
            this.up('grid').store.loadPage(1);
          }
          localStorage.setItem('admin-page-size', v);
        }
      }
    }, ' ', {
      iconCls: 'fa fa-backward',
      name: 'first-page',
      handler() {
        this.up('grid').store.loadPage(1);
      }
    }, {
      iconCls: 'fa fa-chevron-left',
      name: 'previous-page',
      handler() {
        this.up('grid').store.previousPage();
      }
    }, {
      xtype: 'numberfield',
      name: 'current-page',
      width: 20,
      hideTrigger: true,
      keyNavEnabled: false,
      labelWidth: 40,
      labelAlign: 'right',
      fieldLabel: 'Page',
      selectOnFocus: true,
      value: 1,
      enableKeyEvents: true,
      listeners: {
        buffer: 500,
        keyup(field) {
          var store = this.up('grid').store;
          var pageCount = Math.ceil(store.getTotalCount() / store.pageSize);
          if(field.value <= pageCount && field.value >= 0) {
            this.up('grid').store.loadPage(field.value || 1);
          } else if(field.value > pageCount) {
            this.up('grid').store.loadPage(pageCount);
          } else if(field.value < 0) {
            this.up('grid').store.loadPage(1);
          }
        }
      }
    }, {
      xtype: 'label',
      name: 'current-page-delimiter',
      text: '/',
    }, {
      xtype: 'label',
      name: 'total-pages',
      text: '1',
    }, {
      iconCls: 'fa fa-chevron-right',
      name: 'next-page',
      handler() {
        this.up('grid').store.nextPage();
      }
    }, {
      iconCls: 'fa fa-forward',
      name: 'last-page',
      handler() {
        this.up('grid').store.loadPage(this.up('grid').down('[name=total-pages]').text);
      }
    }, {
      iconCls: 'fa fa-sync',
      handler() {
        this.up('grid').store.load();
      }
    }];
  },

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
