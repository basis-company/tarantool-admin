Ext.define('Admin.field.Filter', {

  extend: 'Ext.form.field.Text',
  xtype: 'filter-field',
  emptyText: 'filter',
  enableKeyEvents: true,

  listeners: {
    buffer: 100,
    keyup() {
      var store = this.up('grid').store;

      store.applyFilters(store.filters.items);
    },
    render() {
      this.focus();
      this.up('grid').store.addFilter((record) => {
        if (!this.value) {
          return true;
        }

        return window.Admin.field.Filter.recordContainsText(record, this.value);
      });
    },
  },

  statics: {
    charMap: {
      ru: {
        'q': 'й', 'w': 'ц', 'e': 'у', 'r': 'к', 't': 'е', 'y': 'н', 'u': 'г', 'i': 'ш', 'o': 'щ', 'p': 'з', '[': 'х',
        ']': 'ъ', 'a': 'ф', 's': 'ы', 'd': 'в', 'f': 'а', 'g': 'п', 'h': 'р', 'j': 'о', 'k': 'л', 'l': 'д', ';': 'ж',
        '\'': 'э', 'z': 'я', 'x': 'ч', 'c': 'с', 'v': 'м', 'b': 'и', 'n': 'т', 'm': 'ь', ',': 'б', '.': 'ю', '/': '.',
      },
    },
    recordContainsText(record, text) {
      if (!window.Admin.field.Filter.charMap.en) {
        window.Admin.field.Filter.charMap.en = {};
        Ext.Object.each(window.Admin.field.Filter.charMap.ru, (k, v) => window.Admin.field.Filter.charMap.en[v] = k);
      }

      var result = false;
      var lowercase = Ext.util.Format.lowercase;
      var textInv = window.Admin.field.Filter.translate(text, 'ru', 'en');
      var textRu = window.Admin.field.Filter.translate(text, 'ru');
      var textEn = window.Admin.field.Filter.translate(text, 'en');

      if (!text) {
        return true;
      }

      Ext.Object.each(record.data, (k, v) => {
        return !(result = (lowercase(v).indexOf(text) !== -1 || lowercase(v).indexOf(textInv) !== -1  ||
                           lowercase(v).indexOf(textRu) !== -1 || lowercase(v).indexOf(textEn) !== -1));
      });

      return result;
    },

    translate(text, lang1, lang2) {
      for (var i=0; i < text.length; i++) {
        if (window.Admin.field.Filter.charMap[lang1][text[i]]) {
          text = text.replace(text[i], window.Admin.field.Filter.charMap[lang1][text[i]]);
        }
        else if (lang2 && window.Admin.field.Filter.charMap[lang2][text[i]]) {
          text = text.replace(text[i], window.Admin.field.Filter.charMap[lang2][text[i]]);
        }
      }

      return text;
    },
  },
});
