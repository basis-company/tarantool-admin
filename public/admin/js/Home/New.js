Ext.define('Admin.Home.New', {

  extend: 'Ext.form.Panel',

  title: 'New connection',
  bodyPadding: 10,
  border: false,

  defaults: {
    xtype: 'textfield',
    labelWidth: 80,
    width: 250,
    enableKeyEvents: true,
    listeners: {
      specialkey(field, e) {
        if(e.getKey() == e.ENTER) {
          this.up('home-tab').createConnection();
        }
      }
    },
  },

  items: [{
    fieldLabel: 'Hostname',
    allowBlank: false,
    name: 'hostname',
  }, {
    fieldLabel: 'Port',
    name: 'port',
    xtype: 'numberfield',
    minValue: 0,
    emptyText: 3301
  }, {
    fieldLabel: 'Username',
    name: 'username',
    emptyText: 'guest'
  }, {
    fieldLabel: 'Password',
    name: 'password',
    inputType: "password",
  }, {
    xtype: 'checkbox',
    boxLabel: 'remember connection',
    checked: true,
    name: 'remember'
  }],
  tbar: [{
    text: 'Connect',
    name: 'connect-button',
    iconCls: 'fa fa-link',
    formBind: true,
    handler() {
      this.up('home-tab').createConnection();
    }
  }]
});
