Ext.define('Admin.Home.Tab', {

  extend: 'Ext.panel.Panel',
  title: 'Home',
  iconCls: 'fa fa-home',
  border: false,
  layout: {
    type: 'hbox',
    align: 'stretch',
  },

  requires: [
    'Admin.Home.New',
    'Admin.Home.Connections',
    'Admin.Database.Tab',
  ],

  listeners: {
    activate: function() {
      if (this.down('[name=hostname]')) {
        this.down('[name=hostname]').focus();
      }
    },
    render: function() {
      this.refreshConnections()
        .then(() => {
          var connections = this.down('home-connections');
          var counter = connections.store.getCount();
          if(counter == 1) {
            var connection = connections.store.getAt(0).data;
            setTimeout(() => this.showDatabase(connection), 100);
          } else if (counter > 1) {
            this.down('filter-field').focus();
          }
        });
    }
  },

  showDatabase(params) {
    var params = {
      hostname: params.hostname,
      socket: params.socket,
      port: params.port,
      username: params.username,
      password: params.password,
    };
    var exists = false;
    this.up('tabpanel').items.each(item => {
      if(item.params && Ext.JSON.encode(item.params) == Ext.JSON.encode(params)) {
        this.up('tabpanel').setActiveItem(item);
        exists = true;
      }
    })
    if(!exists) {
      var view = Ext.create('Admin.Database.Tab', {params: params});
      this.up('tabpanel').add(view)
      this.up('tabpanel').setActiveItem(view);
    }
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
        connections.push(this.getConnectionString(connection.hostname, connection.port, connection.username, connection.password));
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
    return dispatch('admin.configuration')
      .then(result => {
        if(result.readOnly) {
          this.down('home-new').hide();
              grid.down('[name=remove-button]').hide();
              grid.down('[name=remove-all]').hide();
        }
        Ext.require('Admin.Database.Tab', function() {
          Admin.Database.Tab.prototype.items[1].hidden = !result.query;
        });
        if (Ext.isArray(result.connections) && result.connections[0].length) {
          connections = Ext.Array.unique(connections.concat(result.connections));
        }
        if(!connections.length) {
          grid.hide();

        } else {
          grid.show();
          grid.store.loadData(connections.map(string => this.parseConnectionString(string)));
        }
      });
  },

  removeConnection(connection) {

    var connections = Ext.JSON.decode(localStorage.getItem('connections')) || [];

    var connectionString = this.getConnectionString(connection.hostname, connection.port, connection.username, connection.password);
    connections
      .filter(candidate => candidate === connectionString)
      .forEach(todo => Ext.Array.remove(connections, todo));

    localStorage.setItem('connections', Ext.JSON.encode(connections));

    this.refreshConnections();
  },

  clearConnections() {
    localStorage.removeItem('connections');
    this.refreshConnections();
  },

  getConnectionString(hostname, port, username, password) {
    var connection = '';
    if (!port) {
      port = 3301;
    }
    if (username && username != 'guest') {
      connection += username;
    }
    if (password && password !== '') {
      if(!connection.length) {
        connection = 'guest';
      }
      connection += ':' + password;
    }
    connection = connection.length ? connection + '@' + hostname : hostname;
    if (port && port != 3301) {
      connection += ':' + port;
    }

    return connection;
  },

  parseConnectionString(connection) {
    var hostname = null;
    var port = 3301;
    var username = 'guest';
    var password = '';

    var hostport = connection;
    var userpass = null;

    if (connection.indexOf('unix://') === 0) {
      var socket = connection;
      if (connection.indexOf('@') !== -1) {
        socket = connection.split('@')[1];
        let auth = connection.split('@')[0].split('unix://')[1];
        [username, password] = auth.split(':');
      }
      return { socket, username, password };
    }

    if (connection.indexOf('@') !== -1) {
      [userpass, hostport] = connection.split('@');
    } else {
      hostport = connection;
    }

    if (hostport.indexOf(':') !== -1) {
      [hostname, port] = hostport.split(':');
    } else {
      hostname = hostport;
    }

    if (userpass) {
      if (userpass.indexOf(':') !== -1) {
        [username, password] = userpass.split(':');
      } else {
        username = userpass;
      }
    }

    return {hostname, port, username, password};
  },

  items: [{
    xtype: 'home-new',
  }, {
    xtype: 'home-connections'
  }]

});
