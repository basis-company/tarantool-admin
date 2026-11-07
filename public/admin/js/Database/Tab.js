Ext.define('Admin.Database.Tab', {

  extend: 'Ext.tab.Panel',
  title: 'Database',
  closable: true,
  border: false,

  iconCls: 'fa fa-database',

  requires: [
    'Admin.Database.Info',
    'Admin.Database.Query',
    'Admin.Database.Sql',
    'Admin.Database.Spaces',
  ],

  listeners: {
    tabchange(tabs, tab) {
      var tabIndex = tabs.items.indexOf(tab);

      if (tab.xtypesChain.indexOf('space-tab') === -1) {
        localStorage.setItem('database-default-item', tabIndex);
      }
    },
  },

  initComponent() {
    var params = this.params;

    if (!this.title || this.title == 'Database') {
      this.title = (params.hosts || []).join(', ');
    }

    this.activeTab = +localStorage.getItem('database-default-item') || 0;

    if (this.activeTab > this.items.length) {
      this.activeTab = 0;
    }

    if (this.activeTab == 1 && window.Admin.Database.Tab.prototype.items[1].hidden) {
      this.activeTab = 0;
    }

    if (this.activeTab == 2 && window.Admin.Database.Tab.prototype.items[2].hidden) {
      this.activeTab = 0;
    }

    this.callParent(arguments);
  },

  items: [ {
    xtype: 'database-info',
  }, {
    xtype: 'database-query',
  }, {
    xtype: 'database-sql',
  }, {
    xtype: 'database-spaces',
  } ],
});
