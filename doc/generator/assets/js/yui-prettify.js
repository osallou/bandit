YUI().use('node', Y => {
    var code = Y.all('.prettyprint.linenums');
    if (code.size()) {
        code.each(c => {
            var lis = c.all('ol li');
            var l = 1;
            lis.each(n => {
                n.prepend('<a name="LINENUM_' + l + '"></a>');
                l++;
            });
        });
        var h = location.hash;
        location.hash = '';
        h = h.replace('LINE_', 'LINENUM_');
        location.hash = h;
    }
});
