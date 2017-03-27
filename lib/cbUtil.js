const http = require('http');

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
    },
    request: function(reqOptions, data) {
        return new Promise((resolve, reject) => {
            var req = http.request(reqOptions, res => {
                var allData = '';
                res.on('data', data => {
                    allData += data;
                });
                res.on('end', () => {
                    if (res.headers['content-type'] === 'application/json') {
                        res.body = JSON.parse(allData);
                        if ('status_code' in res.body && 'msg' in res.body && res.body.status_code === 0 && res.body.msg === 'SUCCESS') {
                            resolve(res);
                        } else {
                            reject(res.body);
                        }
                    } else {
                        resolve(res);
                    }
                });
            });
            req.on('error', e => {
                reject(e);
            });
            if (data) {
                req.write(data);
            }
            req.end();
        });
    }, 
    getCookieStr: function(cookiesObj) {
        var cookiesStr = '';
        for (key in cookiesObj) {
            cookiesStr += key + '=' + cookiesObj[key].value + ';';
        }
        return cookiesStr;
    },
    checkCookieValid: function(cookiesObj) {
        var result = true;
        var index = 0;
        for (key in cookiesObj) {
            index++;
            var cookie = cookiesObj[key];
            if (cookie.expires) {
                var expiresDate = Date.parse(cookie.expires);
                if (expiresDate < (new Date()).getTime()) {
                    result = false;
                    break;
                }
            }
        }
        if (index === 0) { result = false; }
        return result;
    }
};

module.exports = cbUtil;