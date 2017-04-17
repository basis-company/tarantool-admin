Ext.define('Admin.Database.Spaces', {

  extend: 'Ext.grid.Panel',

  name: 'spaces',
  title: 'Spaces',

  refreshSpaces: function() {
    dispatch('database.spaces', this.up('database-tab').params)
      .then(result => {
        this.store.loadData(result.spaces);
        // this.showSpace('tester');
      });
  },

  createSpace() {
    var win = Ext.create('Ext.window.Window', {
      modal: true,
      title: 'New space',
      items: [{
        xtype: 'form',
        bodyPadding: 10,
        items: [{
          fieldLabel: 'Name',
          xtype: 'textfield',
          allowBlank: false,
          name: 'name'
        }],
        bbar: ['->', {
          formBind: true,
          text: 'Create',
          handler: () => {
            var space = win.down('form').getValues().name;
            dispatch('space.create', this.spaceParams(space))
              .then(() => {
                win.close();
                this.refreshSpaces();
              })
          }
        }]
      }]
    })
    win.show();
    win.down('textfield').focus();
  },

  spaceParams(space) {
    return Ext.apply({
      space: space
    }, this.up('database-tab').params);
  },

  showSpace(space) {
    var view = Ext.create('Admin.Space.Tab', {
      params: this.spaceParams(space)
    });
    this.up('database-tab').add(view);
    this.up('database-tab').setActiveItem(view);
  },

  truncateSpace(space) {
    dispatch('space.truncate', this.spaceParams(space))
      .then(() => {
        this.refreshSpaces();
        this.up('database-tab').items.each(item => {
          if(item.params && item.params.space == space) {
            item.items.each(item => {
              if(item.xtype == 'space-collection') {
                item.store.load();
              }
            })
          }
        })
      })
  },

  dropSpace(space) {
    dispatch('space.drop', this.spaceParams(space))
      .then(() => {
        this.refreshSpaces();
        this.up('database-tab').items.each(item => {
          if(item.params && item.params.space == space) {
            this.up('database-tab').remove(item);
          }
        })
      })
  },

  listeners: {
    activate: function() {
      if(!this.store.getCount()) {
        this.refreshSpaces();
      }
    },
    itemdblclick(view, record) {
      view.up('database-spaces').showSpace(record.get('name'));
    },
    selectionchange(sm, sel) {
      this.down('[name=open-button]').setDisabled(!sel.length);
      this.down('[name=drop-button]').setDisabled(!sel.length || sel[0].get('owner'));
      this.down('[name=truncate-button]').setDisabled(!sel.length || sel[0].get('owner'));
    }
  },
  
  store: {
    fields: ['id', 'name', 'engine', 'count'],
    sorters: [{property:'name', direction: 'ASC'}]
  },
  
  tbar: [{
    text: 'Create',
    handler() {
      this.up('database-spaces').createSpace();
    }
  }, {
    text: 'Open',
    name: 'open-button',
    disabled: true,
    handler() {
      this.up('database-spaces').showSpace(this.up('grid').getSelectionModel().getSelection()[0].get('name'));
    }
  }, {
    text: 'Truncate',
    name: 'truncate-button',
    disabled: true,
    handler() {
      this.up('database-spaces').truncateSpace(this.up('grid').getSelectionModel().getSelection()[0].get('name'));
    }
  }, {
    text: 'Drop',
    name: 'drop-button',
    disabled: true,
    handler() {
      this.up('database-spaces').dropSpace(this.up('grid').getSelectionModel().getSelection()[0].get('name'));
    }
  }],
  columns:[{
    header: 'Id',
    dataIndex: 'id',
    align: 'center',
    width: 60,
  }, {
    header: 'Name',
    dataIndex: 'name',
    width: 200,
  }, {
    align: 'center',
    header: 'Engine',
    dataIndex: 'engine'
  }, {
    header: 'Count',
    align: 'right',
    dataIndex: 'count',
    renderer: v => v || '-'
  }]

});