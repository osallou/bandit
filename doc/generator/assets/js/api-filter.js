YUI.add('api-filter', Y => {

Y.APIFilter = Y.Base.create('apiFilter', Y.Base, [Y.AutoCompleteBase], {
    // -- Initializer ----------------------------------------------------------
    initializer() {
        this._bindUIACBase();
        this._syncUIACBase();
    },
    getDisplayName(name) {

        Y.each(Y.YUIDoc.meta.allModules, i => {
            if (i.name === name && i.displayName) {
                name = i.displayName;
            }
        });

        return name;
    }

}, {
    // -- Attributes -----------------------------------------------------------
    ATTRS: {
        resultHighlighter: {
            value: 'phraseMatch'
        },

        // May be set to "classes" or "modules".
        queryType: {
            value: 'classes'
        },

        source: {
            valueFn() {
                var self = this;
                return q => {
                    var data = Y.YUIDoc.meta[self.get('queryType')];
                    var out = [];
                    Y.each(data, v => {
                        if (v.toLowerCase().indexOf(q.toLowerCase()) > -1) {
                            out.push(v);
                        }
                    });
                    return out;
                };
            }
        }
    }
});

}, '3.4.0', {requires: [
    'autocomplete-base', 'autocomplete-highlighters', 'autocomplete-sources'
]});
