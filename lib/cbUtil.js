const http = require('http');
const zlib = require('zlib');
const readline = require('readline');

const cbLog = require('../lib/cbLog');

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
    request: function(reqOptions, data) {
        return new Promise((resolve, reject) => {
            var req = http.request(reqOptions, res => {
                var headers = res.headers;
                var allData = '';
                switch (res.headers['content-encoding']) {
                    case 'gzip':
                        res = res.pipe(zlib.createGunzip());
                        break;
                    case 'deflate':
                        res = res.pipe(zlib.createInflate());
                        break;
                }
                res.headers = headers;
                res.on('data', data => {
                    allData += data;
                });
                res.on('end', () => {
                    if (res.headers['content-type'] === 'application/json') {
                        res.body = JSON.parse(allData);
                        if (('status_code' in res.body && res.body.status_code !== 0) || ('msg' in res.body && res.body.msg !== 'SUCCESS')) {
                            reject(res.body);
                        } 
                        resolve(res);
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
    },
    dealError: function(error, isDebug) {
        if (isDebug) {
            cbLog.error(JSON.stringify(error));
        } else {
            if (typeof(error) === 'object') {
                if (error.msg) {
                    console.log(error.msg);
                } else if(error.message) {
                    console.log(error.message);
                } else {
                    console.log(JSON.stringify(error));
                }
            } else {
                console.log(JSON.stringify(error));
            }
        }
    },
    readCaptcha: function() {
        return new Promise((resolve, reject) => {
            var rl = readline.createInterface({
              input: process.stdin,
              output: process.stdout
            });

            rl.question('请输入您的验证码：', answer => {
                rl.close();
                resolve(answer);
            });
        });
    }
};

module.exports = cbUtil;