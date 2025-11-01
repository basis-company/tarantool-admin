Ext.define('Admin.field.SqlEditor', {
    extend: 'Ext.Component',
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
    },

    // Size is controlled by the container (fixed height in the SQL panel)
    style: {
        border: '1px solid #d0d0d0',
        borderRadius: '2px',
        backgroundColor: '#fff',
    },

    editor: null,
    fallbackTextarea: null,

    renderTpl: [
        '<div class="ace-sql-editor-el" style="position: relative; width:100%; height:100%;">',
            '<div class="ace-sql-editor" style="position:absolute; top:0; left:0; right:0; bottom:0;"></div>',
        '</div>'
    ],

    childEls: ['aceEl'],

    initComponent: function () {
        this.callParent(arguments);
        this.on('afterrender', this.initAce, this, { single: true });
        this.on('resize', this.refreshSize, this);
    },

    refreshSize: function () {
        if (this.editor && this.editor.resize) {
            this.editor.resize();
        }
    },

    initAce: function () {
        var me = this;
        // Find inner div for Ace
        var el = me.el.down('.ace-sql-editor');
        if (window.ace && el) {
            try {
                me.editor = ace.edit(el.dom);
                me.editor.session.setMode(me.getMode());
                me.editor.setTheme(me.getTheme());
                me.editor.setShowPrintMargin(false);
                me.editor.setOptions({
                    fontSize: me.getFontSize(),
                    wrap: !!me.getWrap(),
                    highlightActiveLine: true,
                });
                if (me.getValue()) {
                    me.editor.session.setValue(me.getValue());
                }
                // Hotkey: Ctrl/Cmd + Enter → Execute
                me.editor.commands.addCommand({
                    name: 'execute-sql',
                    bindKey: { win: 'Ctrl-Enter', mac: 'Command-Enter' },
                    exec: function () {
                        var panel = me.up('database-sql');
                        if (!panel) return;
                        var btn = panel.down('[text=Execute]');
                        if (btn && btn.handler) {
                            btn.handler.call(btn);
                        }
                    }
                });
            } catch (e) {
                // Fallback
                me.initFallback(e);
            }
        } else {
            // Fallback if Ace is not available
            me.initFallback('ace-not-available');
        }
    },

    initFallback: function (reason) {
        var me = this;
        // Log a warning once when falling back to textarea
        if (!me._fallbackLogged) {
            try {
                var details = '';
                if (reason) {
                    if (typeof reason === 'string') {
                        details = reason;
                    } else if (reason && reason.message) {
                        details = reason.message;
                    }
                }
                if (typeof console !== 'undefined' && console && console.warn) {
                    console.warn('[SQL Editor] Ace failed to initialize; using fallback textarea.', details);
                }
            } catch (_) {
                // ignore logging errors
            }
            me._fallbackLogged = true;
        }

        var wrapper = me.el.down('.ace-sql-editor');
        if (!wrapper) return;
        var ta = document.createElement('textarea');
        ta.style.width = '100%';
        ta.style.height = '100%';
        ta.style.border = 'none';
        ta.style.outline = 'none';
        ta.style.resize = 'none';
        ta.className = 'query-textarea';
        ta.value = me.getValue() || '';
        ta.addEventListener('keydown', function (e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                var panel = me.up('database-sql');
                if (!panel) return;
                var btn = panel.down('[text=Execute]');
                if (btn && btn.handler) {
                    e.preventDefault();
                    btn.handler.call(btn);
                }
            }
        });
        wrapper.dom.innerHTML = '';
        wrapper.dom.appendChild(ta);
        me.fallbackTextarea = ta;
    },

    getValue: function () {
        return this.config && typeof this.config.value !== 'undefined' ? this.config.value : '';
    },

    setValue: function (v) {
        if (this.editor) {
            this.editor.session.setValue(v || '');
        } else if (this.fallbackTextarea) {
            this.fallbackTextarea.value = v || '';
        } else {
            this.config.value = v || '';
        }
    },

    focus: function () {
        if (this.editor) {
            this.editor.focus();
            // place cursor at the end
            var session = this.editor.session;
            var row = session.getLength() - 1;
            var col = session.getLine(row).length;
            this.editor.moveCursorTo(row, col);
        } else if (this.fallbackTextarea) {
            this.fallbackTextarea.focus();
        }
    },

    destroy: function () {
        if (this.editor && this.editor.destroy) {
            try { this.editor.destroy(); } catch (e) {}
        }
        this.editor = null;
        this.fallbackTextarea = null;
        this.callParent(arguments);
    },
});
