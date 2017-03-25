var cbUtil = {
    parseSetCookie: function(setCookieArr) {
        var cookiesObj = {};
        for (var i = 0; i < setCookieArr.length; i++) {
            var cookieObj = {};
            var cookieObjKey = '';
            var itemCookieArr = setCookieArr[i].split(';');
            for (var j = 0; j < itemCookieArr.length; j++) {
                var kvArr = itemCookieArr[j].split('=');
                if (j === 0) {
                    cookieObjKey = kvArr[0];
                    cookieObj.value = kvArr[1];
                } else {
                    cookieObj[kvArr[0]] = kvArr[1];
                }
            }
            cookiesObj[cookieObjKey] = cookieObj;
        }
        return cookiesObj;
    },
    getPromise: function(mehtod) {
        return new Promise(mehtod);
    }
};

module.exports = cbUtil;