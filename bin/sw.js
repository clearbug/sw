#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const program = require('commander');
const ncp = require('copy-paste');

const config = require('../config/config.json');

const cbUtil = require('../lib/cbUtil');
const cbLog = require('../lib/cbLog');

const shanbayApi = require('../config/shanbay_api.json');
const baiduApi = require('../config/baidu_api.json');

program
    .version(require('../package.json').version)
    .usage('<english-word>')
    .option('-i, --personalinfo', 'Show shanbay personal info')
    .option('-e, --baiduenglish <english word>', 'Use Baidu Fanyi search english')
    .option('-z, --baiduzhongwen <han zi>', 'Use Baidu Fanyi search zhongwen')
    .option('-u, --username <your username>', 'Set your username of shanbay.com')
    .option('-p, --password <your password>', 'Set your password of shanbay.com')
    .option('-d, --debug', 'Use debug mode')
    .parse(process.argv);

//----------------------------------------------------------------------------------------------------- 设置扇贝账户用户名、密码（开始）
if (program.username) {
    config.username = program.username;
}
if (program.password) {
    config.password = program.password;
}
if (program.username || program.password) {
    fs.writeFileSync(path.join(path.parse(__dirname).dir, 'config/config.json'), JSON.stringify(config));
    process.exit();
}

if (!config.username && !config.password) {
    console.log('初次使用，请先设置您的扇贝账号，设置方法：');
    console.log('1. sw -u <your username>');
    console.log('2. sw -p <your password>');
    process.exit();
} else if(!config.username && config.password) {
    console.log('您还没有设置扇贝账号的用户名，设置方法：sw -u <your username>');
    process.exit();
} else if(config.username && !config.password) {
    console.log('您还没有设置扇贝账号的密码，设置方法：sw -p <your password>');
    process.exit();
}
//----------------------------------------------------------------------------------------------------- 设置扇贝账户用户名、密码（结束）

var content = program.args[0];
var cookiesObj = JSON.parse(fs.readFileSync(path.join(path.parse(__dirname).dir, 'storage/cookie.json')));

if (program.debug) {
    cbLog.info('您启动了 [Debug] 模式...');
}
if (program.personalinfo) { // 查询个人扇贝账户信息
    var personalinfo = JSON.parse(fs.readFileSync(path.join(path.parse(__dirname).dir, 'config/config.json')));
    console.log('您的扇贝账户个人信息：');
    console.log(`1. 用户名：${personalinfo.username}`);
    console.log(`2. 密  码：${personalinfo.password}`);
} else if (program.baiduenglish) { // 百度翻译，英语查询
    var postData = 'from=en&to=zh&transtype=realtime&simple_means_flag=3&query=';
    postData += program.baiduenglish;
    var searchReqOptions = baiduApi.searchReqOptions;
    searchReqOptions.headers['Content-Length'] = postData.length;
    cbUtil.request(searchReqOptions, postData)
        .then(res => {
            if (res.body.dict_result && res.body.dict_result.simple_means) {
                var word_means = res.body.dict_result.simple_means.word_means;
                console.log(`单词 [${program.baiduenglish}] 含义如下：\r\n`);
                for (var i = 0; i < word_means.length; i++) {
                    console.log(`[${i + 1}] ${word_means[i]}`);
                }
            } else {
                console.log(`[百度翻译] 未查找到单词：${program.baiduenglish}`);
            }
            
        })
        .catch(error => {
            cbUtil.dealError(error, program.debug);
        });
} else if(program.baiduzhongwen) { // 百度翻译，汉语查询
    var postData = 'from=zh&to=en&transtype=realtime&simple_means_flag=3&query=';
    postData += encodeURI(program.baiduzhongwen);
    var searchReqOptions = baiduApi.searchReqOptions;
    searchReqOptions.headers['Content-Length'] = postData.length;
    cbUtil.request(searchReqOptions, postData)
        .then(res => {
            var word_means = res.body.dict_result.simple_means.word_means;
            console.log(`[${program.baiduzhongwen}] 英文解释如下：\r\n`);
            for (var i = 0; i < word_means.length; i++) {
                console.log(`[${i + 1}] ${word_means[i]}`);
            }
        })
        .catch(error => {
            cbUtil.dealError(error, program.debug);
        });
} else if (cbUtil.checkCookieValid(cookiesObj)) { // 扇贝翻译（只支持英文单词查询），使用保存的 Cookie
    if (program.debug) {
        cbLog.info('缓存 Cookie 有效性校验通过.');
    }
    var searchReqOptions = shanbayApi.searchReqOptions;
    searchReqOptions.path += content;
    cbUtil.request(searchReqOptions)
        .then(res => {
            var data = res.body.data;
            var cnDefinitions = data.definitions.cn;
            console.log(`单词 [${content}] 含义如下：\r\n`);
            for (var i = 0; i < cnDefinitions.length; i++) {
                console.log(`[${i + 1}] ${cnDefinitions[i].pos} ${cnDefinitions[i].defn}`);
            }

            var learnReqOptions = shanbayApi.learnReqOptions;
            var learnReqData = JSON.stringify({
                id: data.id,
                content_type: 'vocabulary'
            });
            learnReqOptions.headers['Content-Length'] = learnReqData.length;
            var cookiesObj = JSON.parse(fs.readFileSync(path.join(path.parse(__dirname).dir, 'storage/cookie.json')));
            learnReqOptions.headers.Cookie += cbUtil.getCookieStr(cookiesObj);
            return cbUtil.request(learnReqOptions, learnReqData);
        })
        .then(res => {
            console.log(`\r\n单词 [${content}] 已成功添加到单词学习库。`);
        })
        .catch(error => {
            cbUtil.dealError(error, program.debug);
        });
} else { // 扇贝翻译（只支持英文单词查询），Cookie 过期
    if (program.debug) {
        cbLog.info('缓存 Cookie 有效性校验未通过.');
        cbLog.info('重新登录获取 Cookie.');
    }
    var loginInfo = {
        username: config.username,
        password: config.password,
        key: '',
        code: ''
    };
    cbUtil.request(shanbayApi.captchaOptions)
        .then(res => {
            loginInfo.key += res.body.data.key;
            console.log('1. 扇贝网现在登录需要输入图片验证码了，本工具并不能完全自动化登录了，蛋疼。。。现在需要您手动在浏览器中浏览器图片验证码上的验证码并输入该验证码，本工具已对登录用户的 Cookie 做缓存，所以您登录一次可以保证十天之内不再需要重复登录！');
            console.log(`2. 验证码图片地址：${res.body.data.image_url}`);
            return new Promise((resolve, reject) => {
                ncp.copy(res.body.data.image_url, () => {
                    console.log('3. 验证码图片地址已复制到粘贴板，您可打开浏览器直接输入浏览！');
                    resolve('success');
                });
            });
            
        })
        .then(res => {
            return cbUtil.readCaptcha();
        })
        .then(captcha => {
            loginInfo.code += captcha;
            var loginReqOptions = shanbayApi.loginReqOptions;
            var loginPutData = JSON.stringify(loginInfo);
            loginReqOptions.headers['Content-Length'] = loginPutData.length;
            return cbUtil.request(loginReqOptions, loginPutData);
        })
        .then(res => {
            if (program.debug) {
                cbLog.info('登录成功.');
            }
            var cookiesObj = cbUtil.parseSetCookie(res.headers['set-cookie']);
            fs.writeFileSync(path.join(path.parse(__dirname).dir, 'storage/cookie.json'), JSON.stringify(cookiesObj));
            var homepageReqOptions = shanbayApi.homepageReqOptions;
            homepageReqOptions.headers.Cookie += cbUtil.getCookieStr(cookiesObj);
            return cbUtil.request(homepageReqOptions);
        })
        .then(res => {
            var cookiesObj = JSON.parse(fs.readFileSync(path.join(path.parse(__dirname).dir, 'storage/cookie.json')));
            var cookiesObj2 = cbUtil.parseSetCookie(res.headers['set-cookie']);
            for (key in cookiesObj2) {
                cookiesObj[key] = cookiesObj2[key];
            }
            fs.writeFileSync(path.join(path.parse(__dirname).dir, 'storage/cookie.json'), JSON.stringify(cookiesObj));
            if (program.debug) {
                cbLog.info('重新缓存 Cookie 成功.');
            }
            var searchReqOptions = shanbayApi.searchReqOptions;
            searchReqOptions.path += content;
            return cbUtil.request(searchReqOptions);
        })
        .then(res => {
            var data = res.body.data;
            var cnDefinitions = data.definitions.cn;
            console.log(`单词 [${content}] 含义如下：\r\n`);
            for (var i = 0; i < cnDefinitions.length; i++) {
                console.log(`[${i + 1}] ${cnDefinitions[i].pos} ${cnDefinitions[i].defn}`);
            }

            var learnReqOptions = shanbayApi.learnReqOptions;
            var learnReqData = JSON.stringify({
                id: data.id,
                content_type: 'vocabulary'
            });
            learnReqOptions.headers['Content-Length'] = learnReqData.length;
            var cookiesObj = JSON.parse(fs.readFileSync(path.join(path.parse(__dirname).dir, 'storage/cookie.json')));
            learnReqOptions.headers.Cookie += cbUtil.getCookieStr(cookiesObj);
            return cbUtil.request(learnReqOptions, learnReqData);
        })
        .then(res => {
            console.log(`\r\n单词 [${content}] 已成功添加到单词学习库。`);
            process.exit(); // 不知道为啥这里程序不能自动停止了，尴尬，只能手动让它停下来了！
        })
        .catch(error => {
            cbUtil.dealError(error, program.debug);
            process.exit(); // 不知道为啥这里程序不能自动停止了，尴尬，只能手动让它停下来了！
        });
}