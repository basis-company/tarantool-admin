Ext.define('Admin.Home.Tab', {

  extend: 'Ext.panel.Panel',  
  title: 'Home',

  requires: [
    'Admin.Home.New',
    'Admin.Home.Connections',
  ],

  listeners: {
    activate: function() {
      this.down('[name=hostname]').focus();
    },
    render: function() {
      this.refreshConnections();
      var connections = this.down('home-connections');
      if(connections.store.getCount() == 1) {

        this.showDatabase(connections.store.getAt(0).data);
      }

    }
  },

  showDatabase(params) {
    var view = Ext.create('Admin.Database.Tab', {
      params: {
        hostname: params.hostname,
        port: params.port,
        username: params.username,
        password: params.password,
      }
    });
    this.up('tabpanel').add(view)
    this.up('tabpanel').setActiveItem(view);
  },


  createConnection() {
    var form = this.down('home-new');
    if(form.isValid()) {
      var connection = form.getValues();
      connection.port = connection.port || 3301;
      connection.username = connection.username || 'guest';
      form.reset();

      if(connection.remember) {
        var connections = Ext.JSON.decode(localStorage.getItem('connections')) || [];
        connections.push([connection.hostname, connection.port, connection.username, connection.password]);
        localStorage.setItem('connections', Ext.JSON.encode(connections));
        this.refreshConnections();
      }

      this.showDatabase(connection);
    }
  },

  refreshConnections() {
    var grid = this.down('home-connections');
    grid.store.loadData([]);

    var connections = Ext.JSON.decode(localStorage.getItem('connections')) || [];
    if(!connections.length) {
      grid.hide();

    } else {
      grid.show();
      grid.store.loadData(connections.map(info => {
        return {
          hostname: info[0],
          port: info[1],
          username: info[2],
          password: info[3],
        }
      }))
    }
  },

  clearConnections() {
    localStorage.removeItem('connections');
    this.refreshConnections();
  },

  items: [{
    xtype: 'home-new',
  }, {
    xtype: 'home-connections' 
  }]

});