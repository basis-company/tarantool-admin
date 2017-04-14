Ext.define('Admin.Space.Tab', {

  extend: 'Ext.tab.Panel',  
  title: 'Space',

  closable: true,

  requires: [
    'Admin.Space.Info',
  ],

  initComponent() {
    this.title = this.params.space.split('_').map(Ext.util.Format.capitalize).join('');
    this.callParent(arguments);
  },

  items:[{
    xtype: 'space-info',
  }]
});