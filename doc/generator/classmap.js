YAHOO.env.classMap = {"BandIt": "BandIt", "BanditLogger": "BandIt", "pick": "BandIt"};

YAHOO.env.resolveClass = className => {
    var a=className.split('.');
    var ns=YAHOO.env.classMap;

    for (var i=0; i<a.length; i=i+1) {
        if (ns[a[i]]) {
            ns = ns[a[i]];
        } else {
            return null;
        }
    }

    return ns;
};
