Ext.define('Admin.Database.Sql', {

    extend: 'Ext.panel.Panel',
    title: 'SQL',
    iconCls: 'fa fa-database',
    border: false,
    referenceHolder: true,

    requires: [
        'Admin.field.SqlEditor'
    ],

    layout: {
        type: 'vbox',
        align: 'stretch',
    },

    listeners: {
        single: true,
        afterlayout() {
            var ed = this.down('database-sql-editor') || this.down('textarea');
            if (ed && ed.focus) {
                ed.focus();
            }
        },
    },

    items: [{
        tbar: {
            height: 36,
            items: [{
                xtype: 'label',
                text: 'Type your SQL below',
            }],
        },
        style: {
            marginLeft: '8px',
            marginRight: '8px',
        },
        layout: 'fit',
        items: [{
            xtype: 'database-sql-editor',
            minHeight: 80,
            maxHeight: 300,
            flex: 1,
        }],
    }, {
        bodyPadding: 10,
        flex: 1,
        layout: 'fit',
        name: 'result',

        showError(message, timing) {
            this.removeAll();
            const html = [
                '<div style="color:#b71c1c;font-weight:bold;margin-bottom:8px;">SQL error</div>',
                '<div style="white-space:pre-wrap;font-family:monospace;">' + Ext.htmlEncode(message) + '</div>'
            ].join('');

            const container = this.up('[title=SQL]');
            container
                .down('[name=execution]')
                .setText('Your query failed in ' + Ext.util.Format.number(timing || 0, '0.0') + ' ms');

            const limitedBtn = container.down('[name=limited]');
            if (limitedBtn) {
                limitedBtn.hide();
            }

            this.add({
                xtype: 'panel',
                border: true,
                bodyPadding: 10,
                scrollable: true,
                html: html,
            });
        },

        showTable(response) {
            this.removeAll();

            let columns = [];
            let fields = [];
            let data = response.data || [];

            const addRenderer = function (col) {
                col.renderer = function (v) {
                    if (Ext.isObject(v)) {
                        return Ext.htmlEncode(Ext.JSON.encode(v));
                    }
                    if (Ext.isArray(v) && v.length && (Ext.isArray(v[0]) || Ext.isObject(v[0]))) {
                        return Ext.htmlEncode(Ext.JSON.encode(v));
                    }
                    if (Ext.isString(v)) {
                        return Ext.htmlEncode(v);
                    }
                    return v;
                };
                return col;
            };

            if (Ext.isArray(response.columns) && response.columns.length) {
                // columns can be array of strings or array of objects with name
                response.columns.forEach((c, i) => {
                    const name = Ext.isObject(c) ? (c.name || ('f' + (i + 1))) : (String(c) || ('f' + (i + 1)));
                    fields.push(name);
                    columns.push(addRenderer({
                        dataIndex: name,
                        header: name,
                        width: 120,
                    }));
                });
            } else if (Ext.isArray(data) && data.length) {
                if (Ext.isArray(data[0])) {
                    // tuples without metadata
                    const maxLen = Ext.Array.max(data.map(row => row.length));
                    for (let j = 1; j <= maxLen; j++) {
                        const name = 'f' + j;
                        fields.push(name);
                        columns.push(addRenderer({
                            dataIndex: name,
                            header: j,
                            width: 120,
                        }));
                    }
                } else if (Ext.isObject(data[0])) {
                    // associative rows
                    Ext.Object.getKeys(data[0]).forEach(k => {
                        fields.push(k);
                        columns.push(addRenderer({
                            dataIndex: k,
                            header: k,
                            width: 120,
                        }));
                    });
                }
            }

            let storeCfg = {fields: fields, data: data};

            // when columns are provided as strings/objects and data is tuples, map tuples to objects by column names
            if (Ext.isArray(response.columns) && response.columns.length && Ext.isArray(data) && data.length && Ext.isArray(data[0])) {
                const names = fields.slice();
                storeCfg.data = data.map(row => {
                    let obj = {};
                    const len = Math.min(row.length, names.length);
                    for (let i = 0; i < len; i++) {
                        obj[names[i]] = row[i];
                    }
                    return obj;
                });
            }

            // ensure array-of-arrays become objects with f1..fn when no columns
            if (!response.columns && Ext.isArray(data) && data.length && Ext.isArray(data[0])) {
                storeCfg.data = data.map(row => {
                    let obj = {};
                    row.forEach((v, idx) => obj['f' + (idx + 1)] = v);
                    return obj;
                });
            }

            // Match Space.Collection: no extra row numberer column, only data columns

            const grid = Ext.create('Ext.grid.Panel', {
                columns: columns,
                store: storeCfg,
                columnLines: true,
                selModel: {
                    type: 'spreadsheet',
                    columnSelect: true,
                },
                plugins: {
                    ptype: 'clipboard',
                },
                enableTextSelection: true
            });

            const stats = 'Your query takes ' + Ext.util.Format.number(response.timing || 0, '0.0') + ' ms' + (Ext.isNumber(response.total) ? (', total: ' + response.total) : '');
            const container = this.up('[title=SQL]');
            container
                .down('[name=execution]')
                .setText(stats);

            const limitedIcon = container.down('[name=limited]');
            if (limitedIcon) {
                if (response.limited) {
                    limitedIcon.show();
                } else {
                    limitedIcon.hide();
                }
            }

            // Show optional message from backend if provided
            if (Ext.isString(response.message) && response.message.length) {
                this.add({
                    xtype: 'panel',
                    border: true,
                    bodyPadding: 10,
                    style: { marginBottom: '8px' },
                    html: '<div style="color:#1a5fb4;font-weight:bold;margin-bottom:4px;">Message</div>' +
                          '<div style="white-space:pre-wrap;font-family:monospace;">' + Ext.htmlEncode(response.message) + '</div>'
                });
            }

            // Add grid only when there is something to show
            const hasGridData = (columns && columns.length) || (Ext.isArray(storeCfg.data) && storeCfg.data.length);
            if (hasGridData) {
                this.add(grid);
            }
        },

        tbar: [{
            text: 'Execute',
            iconCls: 'fa fa-play',
            handler() {
                var panel = this.up('database-sql');
                var btn = this; // Execute
                var editorCmp = panel.down('database-sql-editor');
                var sql = (editorCmp && editorCmp.getValue)
                    ? editorCmp.getValue()
                    : (panel.down('textarea') ? panel.down('textarea').getValue() : '');

                btn.setDisabled(true);
                panel.setLoading('Executing…');

                dispatch('database.sql', Ext.apply({ query: sql }, panel.up('database-tab').params))
                    .then(response => {
                        var result = panel.lookupReference('result') || panel.down('[name=result]');

                        if (response && response.error) {
                            result.showError(response.error, response.timing);
                        } else {
                            result.showTable(response || {});
                        }
                    })
                    .catch(err => {
                        (panel.lookupReference('result') || panel.down('[name=result]'))
                            .showError(String(err && err.message || err), null);
                    })
                    .finally(() => {
                        panel.setLoading(false);
                        btn.setDisabled(false);
                    });
            },
        }, '->', {
            xtype: 'component',
            name: 'limited',
            hidden: true,
            html: '<span class="fa fa-exclamation-triangle" style="color:#e69500;"></span>',
            listeners: {
                afterrender: function (cmp) {
                    // Simple hover hint; user will replace text later
                    cmp.tip = Ext.create('Ext.tip.ToolTip', {
                        target: cmp.getEl(),
                        html: 'Response was limited. Change TARANTOOL_SQL_LIMIT in order to make selections of more records.',
                    });
                },
            },
        }, {
            xtype: 'label',
            name: 'execution',
        }],
    }],

    xtype: 'database-sql',
});
