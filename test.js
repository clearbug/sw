const cbUtil = require('./lib/cbUtil');

var searchReqOptions = {
    "method": "GET",
    "hostname": "www.shanbay.com",
    "path": "/api/v1/bdc/search/?version=2&word=word",
    "headers": {
        "Host": "www.shanbay.com",
        "Connection": "keep-alive",
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "Referer": "https://www.shanbay.com/",
        "X-Requested-With": "XMLHttpRequest",
        "User-Agent": "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36",
        "Accept-Encoding": "gzip, deflate, sdch, br",
        "Accept-Language": "zh-CN,zh;q=0.8"
    }
};

cbUtil.request(searchReqOptions)
    .then(res => {
        console.dir(res.body);
    })
    .catch(error => {
        console.log(error.message);
    })