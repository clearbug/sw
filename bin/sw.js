#! /usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');

const program = require('commander');

const cbUtil = require('../lib/cbUtil');
const cbLog = require('../lib/cbLog');

const config = require('../config/config.json');
const shanbayApi = require('../config/shanbay_api.json');

program
    .version(require('../package.json').version)
    .usage('<english-word>')
    .option('-u, --username <your username>', 'Set your username of shanbay.com')
    .option('-p, --password <your password>', 'Set your password of shanbay.com')
    .option('-d, --debug', 'Use debug mode')
    .parse(process.argv);

var args = program.args;

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

var content = args[0];

if (program.debug) {
    cbLog.info('您启动了 [Debug] 模式...');
}
var cookiesObj = JSON.parse(fs.readFileSync(path.join(path.parse(__dirname).dir, 'storage/cookie.json')));
if (cbUtil.checkCookieValid(cookiesObj)) {
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
            if (program.debug) {
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
        });
} else {
    if (program.debug) {
        cbLog.info('缓存 Cookie 有效性校验未通过.');
        cbLog.info('重新登录获取 Cookie.');
    }
    var loginReqOptions = shanbayApi.loginReqOptions;
    var loginInfo = {
        username: config.username,
        password: config.password
    };
    var loginPutData = JSON.stringify(loginInfo);
    loginReqOptions.headers['Content-Length'] = loginPutData.length;
    cbUtil.request(loginReqOptions, loginPutData)
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
        })
        .catch(error => {
            if (program.debug) {
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
        });
}