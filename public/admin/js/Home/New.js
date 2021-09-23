Ext.define('Admin.Home.New', {

  extend: 'Ext.form.Panel',

  height: 200,
  border: false,
  hidden: true,
  style: {
    paddingRight: '15px',
  },

  defaults: {
    xtype: 'textfield',
    labelWidth: 80,
    width: 250,
    enableKeyEvents: true,
    style: {
      paddingLeft: '9px',
    },
    listeners: {
      specialkey(field, e) {
        if (e.getKey() == e.ENTER) {
          this.up('home-tab').createConnection();
        }
      },
    },
  },

  items: [ {
    fieldLabel: 'Hostname',
    allowBlank: false,
    name: 'hostname',
  }, {
    fieldLabel: 'Port',
    name: 'port',
    xtype: 'numberfield',
    minValue: 0,
    emptyText: 3301,
  }, {
    fieldLabel: 'Username',
    name: 'username',
    emptyText: 'guest',
  }, {
    fieldLabel: 'Password',
    name: 'password',
    inputType: 'password',
  }, {
    xtype: 'checkbox',
    boxLabel: 'remember connection',
    checked: true,
    name: 'remember',
  }, {
    xtype: 'button',
    style: {
      marginLeft: '10px',
    },
    text: 'Connect',
    name: 'connect-button',
    iconCls: 'fa fa-link',
    formBind: true,
    handler() {
      this.up('home-tab').createConnection();
    },
  } ],
  tbar: {
    height: 36,
    items: [ {
      xtype: 'label',
      text: 'New connection',
    } ],
  },
});
