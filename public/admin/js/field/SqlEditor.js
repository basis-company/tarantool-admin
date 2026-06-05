Ext.define('Admin.field.SqlEditor', {
    extend: 'Admin.field.Editor',
    xtype: 'database-sql-editor',

    // Used by the SQL panel for lookup
    name: 'sql-editor',

    config: {
        value: '-- Remember that Tarantool converts all identifiers to uppercase by default. ' +
            'When referring to identifiers, enclose them in quotation marks. Example: \n' +
            'SELECT "s"."id" FROM "space" AS "s";',
        theme: 'ace/theme/textmate',
        mode: 'ace/mode/sql',
        fontSize: 12,
        wrap: true,
        commandName: 'execute-sql',
        executePanel: 'database-sql',
        logPrefix: 'SQL Editor',
    },
});
