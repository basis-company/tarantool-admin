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
    render: function() {
      this.refreshConnections()
        .then(() => {
          var connections = this.down('home-connections');
          var counter = connections.store.getCount();

          if (counter == 1) {
            var connection = connections.store.getAt(0).data;

            setTimeout(() => this.showDatabase(connection), 100);
          }
          else if (counter > 1) {
            this.down('filter-field').focus();
          }
        });
    },
  },

  showDatabase(connection) {
    // single hosts and clusters are dispatched uniformly as host lists
    var params = {
      hosts: this.getHosts(connection),
      username: connection.username || 'guest',
      password: connection.password || '',
    };

    var exists = false;

    var title = connection.name;

    if (!title) {
      title = params.hosts[0].replace(/:3301$/, '');

      if (params.username != 'guest') {
        title = params.username + ' @ ' + title;
      }
    }

    this.up('tabpanel').items.each(item => {
      if (item.params && Ext.JSON.encode(item.params) == Ext.JSON.encode(params)) {
        this.up('tabpanel').setActiveItem(item);
        exists = true;
      }
    });

    if (!exists) {
      var view = Ext.create('Admin.Database.Tab', { params: params, title: title });

      this.up('tabpanel').add(view);
      this.up('tabpanel').setActiveItem(view);
    }
  },

  getHosts(connection) {
    if (Ext.isArray(connection.hosts)) {
      return connection.hosts;
    }

    if (connection.socket) {
      return [connection.socket];
    }

    return [connection.hostname + ':' + (connection.port || 3301)];
  },

  /**
   * Stored connections are either legacy `login@host:port` strings
   * or cluster objects. Grid rows are normalized: `hosts` array plus
   * an optional cluster `name`.
   */
  normalizeConnection(connection) {
    if (Ext.isString(connection)) {
      connection = this.parseConnectionString(connection);
    }

    if (Ext.isArray(connection.hosts)) {
      return connection;
    }

    return {
      name: connection.name || null,
      cluster: !!connection.name,
      hosts: this.getHosts(connection),
      hostname: connection.hostname,
      port: connection.port,
      socket: connection.socket,
      username: connection.username || 'guest',
      password: connection.password || '',
    };
  },

  connectionKey(connection) {
    connection = this.normalizeConnection(connection);

    return connection.name
      ? 'cluster:' + connection.name
      : connection.username + '@' + connection.hosts[0];
  },

  createConnection() {
    var form = this.down('home-new');

    if (!form.isValid()) {
      return;
    }

    var values = form.getValues();

    var hosts = (values.hosts || '').split(/[\n,;]+/)
      .map(host => host.trim())
      .filter(host => host.length);

    var connection;

    if (hosts.length) {
      if (!values.name) {
        Ext.MessageBox.alert('Warning!', 'Cluster connections require a name');

        return;
      }

      connection = {
        name: values.name,
        hosts: hosts,
        username: values.username || 'guest',
        password: values.password || '',
      };
    }
    else {
      if (!values.hostname) {
        Ext.MessageBox.alert('Warning!', 'Hostname or cluster hosts are required');

        return;
      }

      connection = {
        hostname: values.hostname,
        port: values.port || 3301,
        username: values.username || 'guest',
        password: values.password || '',
      };
    }

    form.reset();

    if (values.remember) {
      var connections = Ext.JSON.decode(localStorage.getItem('connections')) || [];

      var stored = connection.name
        ? connection
        : this.getConnectionString(connection.hostname, connection.port, connection.username, connection.password);

      if (!connections.some(entry => this.connectionKey(entry) == this.connectionKey(connection))) {
        connections.push(stored);
        localStorage.setItem('connections', Ext.JSON.encode(connections));
        this.refreshConnections();
      }
    }

    this.showDatabase(connection);
  },

  refreshConnections() {
    var grid = this.down('home-connections');

    grid.store.loadData([]);

    var connections = Ext.JSON.decode(localStorage.getItem('connections')) || [];

    return dispatch('admin.configuration')
      .then(result => {
        window.configuration = result;

        if (result.version && result.version.tag) {
          let version = Ext.ComponentQuery.query('[name=version]')[0];
          var legacy = result.latest && result.latest != result.version.tag;

          version.setText('version ' + result.version.tag);

          if (legacy) {
            version.addCls('version-upgrade');
            version.setIconCls('fas fa-bell');

            Ext.create('Ext.tip.ToolTip', {
              target: version,
              autoShow: true,
              autoHide: true,
              html: [
                'new version available!',
              ],
            });
          }
        }

        this.down('home-new').setHidden(result.connectionsReadOnly);
        this.down('home-connections').show();
        grid.down('[name=remove-button]').setHidden(result.connectionsReadOnly);
        grid.down('[name=remove-all]').setHidden(result.connectionsReadOnly);

        Ext.require('Admin.Database.Tab', function() {
          window.Admin.Database.Tab.prototype.items[1].hidden = !result.query;
          window.Admin.Database.Tab.prototype.items[2].hidden = !result.sql;
        });

        var map = {};

        var addConnection = entry => {
          var connection = this.normalizeConnection(entry);

          map[this.connectionKey(connection)] = connection;
        };

        connections.forEach(addConnection);

        if (Ext.isArray(result.connections) && result.connections[0].length) {
          result.connections.forEach(addConnection);
        }

        connections = Ext.Object.getValues(map);

        if (connections.length) {
          grid.show();
          grid.store.loadData(connections);
        }
        else {
          grid.hide();
        }
      });
  },

  removeConnection(connection) {
    var connections = Ext.JSON.decode(localStorage.getItem('connections')) || [];
    var key = this.connectionKey(connection);

    connections = connections.filter(candidate => this.connectionKey(candidate) != key);

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
      if (!connection.length) {
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

        [ username, password ] = auth.split(':');
      }

      return { socket, username, password };
    }

    if (connection.indexOf('@') === -1) {
      hostport = connection;
    }
    else {
      [ userpass, hostport ] = connection.split('@');
    }

    if (hostport.indexOf(':') === -1) {
      hostname = hostport;
    }
    else {
      [ hostname, port ] = hostport.split(':');
    }

    if (userpass) {
      if (userpass.indexOf(':') === -1) {
        username = userpass;
      }
      else {
        [ username, password ] = userpass.split(':');
      }
    }

    return { hostname, port, username, password };
  },

  items: [ {
    xtype: 'home-new',
  }, {
    xtype: 'home-connections',
  } ],
});
