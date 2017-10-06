Ext.define('Admin.overrides.Toolbar', {
  override: 'Ext.toolbar.Toolbar',
  lookupComponent: function(c) {
    if (Ext.isObject(c)) {
      c.grow = true;
      if (c.width) {
        c.growMin = c.width;
        delete c.width;
      } else {
        c.growMin = 160;
      }
    }
    return this.callParent(arguments);
  }
});