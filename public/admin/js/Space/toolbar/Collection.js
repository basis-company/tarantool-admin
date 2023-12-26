Ext.define('Admin.Space.toolbar.Collection', {

  extend: 'Ext.toolbar.Toolbar',
  xtype: 'toolbar-collection',

  initComponent() {
    this.items = this.getDefaultItems();
    this.callParent(arguments);
  },

  initEvents() {
    this.on({
      destroy: this.clearRefreshInterval,
      scope: this,
    });
  },

  updateState() {
    var store = this.up('grid').store;
    var pageCount = Math.ceil(store.getTotalCount() / store.pageSize) || 1;
    var currentPage = store.currentPage;

    if (store.proxy.lastResponse.total == null) {
      this.down('[name=row-counter]').setValue('-');
      this.down('[name=total-pages]').setText('-');
    }
    else {
      this.down('[name=row-counter]').setValue(store.getTotalCount());
      this.down('[name=total-pages]').setText(pageCount);
    }

    var first = this.down('[name=first-page]');
    var prev = this.down('[name=previous-page]');
    var current = this.down('[name=current-page]');
    var next = this.down('[name=next-page]');
    var last = this.down('[name=last-page]');

    first.setDisabled(currentPage == 1);
    prev.setDisabled(currentPage == 1);
    current.setValue(currentPage);
    next.setDisabled(currentPage == pageCount);
    last.setDisabled(currentPage == pageCount);

    // unknown row count
    if (store.proxy.lastResponse.total == null) {
      next.setDisabled(!store.proxy.lastResponse.next);
      last.setDisabled(true);
    }
  },

  refreshStore() {
    if (!this.up('grid').isVisible()) {
      // grid is not active
      return;
    }

    var spaceTab = this.up('grid').up('tabpanel');

    if (!spaceTab.isVisible()) {
      // space tab is not active
      return;
    }

    var databaseTab = spaceTab.up('tabpanel');

    if (!databaseTab.isVisible()) {
      // database tab is not active
      return;
    }

    this.down('[name=refresh]').blur();

    return this.up('grid').store.load();
  },

  setRefreshMode(text) {
    this.clearRefreshInterval();
    this.refreshStore();

    if (text != 'Manual') {
      this.down('[name=refresh]').setText(text);
      var seconds = 0;

      if (text.indexOf('second') !== -1) {
        seconds = 1;
      }
      else if (text.indexOf('minute') === -1) {
        throw 'invalid text ' + text;
      }
      else {
        seconds = 60;
      }

      var amount = +text.split(' ')[1];

      this.refreshInterval = setInterval(this.refreshStore.bind(this), amount * seconds * 1000);
    }
  },

  clearRefreshInterval() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }

    if (!this.destroying) {
      this.down('[name=refresh]').setText('');
    }
  },

  getDefaultItems() {
    return [ {
      text:    'Create',
      iconCls: 'fa fa-plus-circle',
      handler() {
        this.up('grid').createEntityWindow();
      },
    }, {
      text:     'Update',
      iconCls:  'fa fa-edit',
      disabled: true,
      handler() {
        var selected = this.up('grid')
          .getSelectionModel()
          .getSelected();
        var record = selected.startCell ? selected.startCell.record : selected.selectedRecords.items[0];

        this.up('grid').createEntityWindow(record);
      },
    }, {
      text:     'Delete',
      disabled: true,
      iconCls:  'fa fa-minus-circle',
      handler() {
        var grid = this.up('grid');
        var selected = grid.getSelectionModel().getSelected();
        var records = [];

        if (selected.startCell) {
          for (var i = selected.startCell.rowIdx; i <= selected.endCell.rowIdx; i++) {
            records.push(grid.store.getAt(i));
          }
        }
        else {
          records = selected.selectedRecords.items;
        }

        var msg = 'Are you sure want to delete selected row?';

        if (records.length > 1) {
          msg = 'Are you sure want to delete ' + records.length + ' selected rows?';
        }

        Ext.MessageBox.confirm('Warning', msg, (answer) => {
          if (answer == 'no') {
            return;
          }

          var params = records.map(record => {
            var id = {};

            grid.indexes[0].parts.forEach(p => {
              id[grid.fields[p[0] || p.field]] = record.get(grid.fields[p[0] || p.field]);
            });
            return Ext.apply({ id: id }, grid.params);
          });

          return dispatch.progress('entity.remove', params)
            .then(() => this.up('toolbar-collection').refreshStore());
        });
      },
    }, {
      text:     'Search',
      iconCls:  'fa fa-search',
      name:     'search',
      disabled: true,
      menu:     [],
    }, {
      text: this.params.truncateButtonText || 'Truncate',
      name: 'truncate',
      iconCls: 'fa fa-trash',
      handler() {
        var params = this.up('grid').store.proxy.params;
        var space = params.space;

        // > database tabs
        //  > collection
        //  > space tabs
        //   > {collection}

        var index = this.up('grid').indexes[params.index];
        var searchdata = {
          key: params.key,
          index: params.index,
          indexObj: index,
          iterator: params.iterator };

        this.up('tabpanel').up('tabpanel')
          .down('[name=spaces]')
          .truncateSpace(space, searchdata);

        this.up('toolbar-collection').refreshStore();
      },
    }, {
      iconCls:  'fa fa-download',
      disabled: true,
      name:     'export',
      text:     'Export',
      handler() {
        dispatch('export.csv', this.up('grid').store.proxy.params)
          .then(result => window.location = '/' + result.path);
      },
    }, '->', {
      fieldLabel: 'Total rows',
      labelAlign: 'right',
      labelWidth: 65,
      name:       'row-counter',
      readOnly:   true,
      width:      20,
      xtype:      'textfield',
    }, ' ', {
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
        change(field, v) {
          if (!v) {
            return this.setValue(1);
          }

          var store = this.up('grid').store;

          if (store.pageSize != v) {
            store.setPageSize(v);
            store.loadPage(1);
          }

          localStorage.setItem('admin-page-size', v);

          if (v == 25 || !v) {
            localStorage.removeItem('admin-page-size');
          }
        },
      },
    }, ' ', {
      iconCls: 'fa fa-backward',
      name: 'first-page',
      handler() {
        this.up('grid').store.loadPage(1);
      },
    }, {
      iconCls: 'fa fa-chevron-left',
      name: 'previous-page',
      handler() {
        this.up('grid').store.previousPage();
      },
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
          var pageCount = Math.ceil(store.getTotalCount() / store.pageSize) || 1;

          if (store.proxy.lastResponse.total == null) {
            this.up('grid').store.loadPage(field.value || 1);
          }
          else if (field.value <= pageCount && field.value >= 0) {
            this.up('grid').store.loadPage(field.value || 1);
          }
          else if (field.value > pageCount) {
            this.up('grid').store.loadPage(pageCount);
          }
          else if (field.value < 0) {
            this.up('grid').store.loadPage(1);
          }
        },
      },
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
      },
    }, {
      iconCls: 'fa fa-forward',
      name: 'last-page',
      handler() {
        this.up('grid').store.loadPage(this.up('grid').down('[name=total-pages]').text);
      },
    }, {
      xtype: 'splitbutton',
      name: 'refresh',
      iconCls: 'fa fa-sync',
      handler() {
        this.up('toolbar-collection').setRefreshMode('Manual');
        this.down('[text=Manual]').setChecked(true);
      },
      menu: {
        defaults: {
          xtype: 'menucheckitem',
          group: 'refresh-mode',
          hideOnClick: true,
          handler() {
            this.up('toolbar-collection').setRefreshMode(this.text);
          },
        },
        items: [ {
          text: 'Manual',
          checked: true,
        }, {
          text: 'Every 1 second',
        }, {
          text: 'Every 2 seconds',
        }, {
          text: 'Every 5 seconds',
        }, {
          text: 'Every 15 seconds',
        }, {
          text: 'Every 30 seconds',
        }, {
          text: 'Every 1 minute',
        }, {
          text: 'Every 2 minutes',
        }, {
          text: 'Every 5 minutes',
        }, {
          text: 'Every 15 minutes',
        }, {
          text: 'Every 30 minutes',
        } ],
      },
    } ];
  },

  applyMeta() {
    var indexMenu = this.up('grid').indexes.map(index => {
      return {
        text: index.name,
        handler: () => {
          var params = Ext.apply({ index: index.id, truncateButtonText: 'Truncate rows' }, this.up('space-tab').params);
          var view = Ext.create('Admin.Space.Collection', {
            params: params,
            autoLoad: false,
          });

          this.up('space-tab').add(view);
          this.up('space-tab').setActiveItem(view);
        },
      };
    });

    var search = this.down('[name=search]');

    if (indexMenu.length) {
      search.setMenu(indexMenu);
      search.enable();
    }
  },
});
