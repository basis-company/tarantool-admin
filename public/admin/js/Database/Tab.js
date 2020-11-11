Ext.define('Admin.Database.Tab', {

  extend: 'Ext.tab.Panel',
  title: 'Database',
  closable: true,
  border: false,

  iconCls: 'fa fa-database',

  requires: [
    'Admin.Database.Info',
    'Admin.Database.Query',
    'Admin.Database.Spaces',
  ],

  listeners: {
    tabchange(tabs, tab) {
      var tabIndex = tabs.items.indexOf(tab);
      if (tab.xtypesChain.indexOf('space-tab') === -1) {
        localStorage.setItem('database-default-item', tabIndex);
      }
    }
  },

  initComponent() {

    var params = this.params;

    this.title = '';

    if (params.username != 'guest') {
      this.title += params.username + ' @ ';
    }

    if (params.socket) {
      this.title += params.socket;
    } else {
      this.title += params.hostname;
      if (params.port != 3301) {
        this.title += ' : ' + params.port;
      }
    }

    this.activeTab = +localStorage.getItem('database-default-item') || 0;

    if (this.activeTab > this.items.length) {
      this.activeTab = 0;
    }

    if (this.activeTab == 1 && Admin.Database.Tab.prototype.items[1].hidden) {
      this.activeTab = 0;
    }

    this.callParent(arguments);
  },

  items: [{
    xtype: 'database-info'
  }, {
    xtype: 'database-query'
  }, {
    xtype: 'database-spaces'
  }]
});
