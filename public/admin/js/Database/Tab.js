Ext.define('Admin.Database.Tab', {

  extend: 'Ext.tab.Panel',
  title: 'Database',
  activeTab: 0,
  closable: true,
  border: false,

  requires: [
    'Admin.Database.Info',
    'Admin.Database.Spaces',
  ],

  initComponent() {

    var params = this.params;

    this.title = '';
    if(params.username != 'guest') {
      this.title += params.username + ' @ ';
    }
    this.title += params.hostname;

    if(params.port != 3301) {
      this.title += ' : ' + params.port;
    }

    this.callParent(arguments);

  },

  items: [{
    xtype: 'database-info'
  }, {
    xtype: 'database-spaces'
  }]
});