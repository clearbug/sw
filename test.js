const cbUtil = require('./lib/cbUtil');

cbUtil.readCaptcha()
    .then(line => {
        console.log(`您输入的验证码是：${line}`);
    });