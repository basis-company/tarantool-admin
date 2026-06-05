Ext.define('Admin.field.QueryEditor', {
  extend: 'Admin.field.Editor',
  xtype: 'database-query-editor',

  name: 'query-editor',

  config: {
    value: 'return box.space._space:select()',
    theme: 'ace/theme/textmate',
    mode: 'ace/mode/lua',
    fontSize: 12,
    wrap: true,
    useWorker: false,
    commandName: 'execute-query',
    executePanel: 'database-query',
    logPrefix: 'Query Editor',
  },
});
