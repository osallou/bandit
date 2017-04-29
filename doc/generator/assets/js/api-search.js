YUI.add('api-search', Y => {
    var Lang   = Y.Lang;
    var Node   = Y.Node;
    var YArray = Y.Array;

    Y.APISearch = Y.Base.create('apiSearch', Y.Base, [Y.AutoCompleteBase], {
        // -- Public Properties ----------------------------------------------------
        RESULT_TEMPLATE:
            '<li class="result {resultType}">' +
                '<a href="{url}">' +
                    '<h3 class="title">{name}</h3>' +
                    '<span class="type">{resultType}</span>' +
                    '<div class="description">{description}</div>' +
                    '<span class="className">{class}</span>' +
                '</a>' +
            '</li>',

        // -- Initializer ----------------------------------------------------------
        initializer() {
            this._bindUIACBase();
            this._syncUIACBase();
        },

        // -- Protected Methods ----------------------------------------------------
        _apiResultFilter(query, results) {
            // Filter components out of the results.
            return YArray.filter(results, result => result.raw.resultType === 'component' ? false : result);
        },

        _apiResultFormatter(query, results) {
            return YArray.map(results, function (result) {
                var // create a copy
                raw  = Y.merge(result.raw);

                var desc = raw.description || '';

                // Convert description to text and truncate it if necessary.
                desc = Node.create('<div>' + desc + '</div>').get('text');

                if (desc.length > 65) {
                    desc = Y.Escape.html(desc.substr(0, 65)) + ' &hellip;';
                } else {
                    desc = Y.Escape.html(desc);
                }

                raw['class'] || (raw['class'] = '');
                raw.description = desc;

                // Use the highlighted result name.
                raw.name = result.highlighted;

                return Lang.sub(this.RESULT_TEMPLATE, raw);
            }, this);
        },

        _apiTextLocator(result) {
            return result.displayName || result.name;
        }
    }, {
        // -- Attributes -----------------------------------------------------------
        ATTRS: {
            resultFormatter: {
                valueFn() {
                    return this._apiResultFormatter;
                }
            },

            resultFilters: {
                valueFn() {
                    return this._apiResultFilter;
                }
            },

            resultHighlighter: {
                value: 'phraseMatch'
            },

            resultListLocator: {
                value: 'data.results'
            },

            resultTextLocator: {
                valueFn() {
                    return this._apiTextLocator;
                }
            },

            source: {
                value: '/api/v1/search?q={query}&count={maxResults}'
            }
        }
    });
}, '3.4.0', {requires: [
    'autocomplete-base', 'autocomplete-highlighters', 'autocomplete-sources',
    'escape'
]});
