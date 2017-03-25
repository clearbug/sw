#! /usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');

const program = require('commander');

const cbUtil = require('../lib/cbUtil');

const config = require('../config/config.json');
const shanbayApi = require('../config/shanbay_api.json');

program
    .version(require('../package.json').version)
    .usage('<english-word>')
    .option('-u, --username <your username>', 'Set your username of shanbay.com')
    .option('-p, --password <your password>', 'Set your password of shanbay.com')
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
    console.log('您还没有设置扇贝账号用户名，设置方法：sw -u <your username>');
    process.exit();
} else if(config.username && !config.password) {
    console.log('您还没有设置扇贝账号密码，设置方法：sw -p <your password>');
    process.exit();
}

var content = args[0];

var loginReqOptions = shanbayApi.loginReqOptions;
var loginInfo = {
    username: config.username,
    password: config.password
};
var loginPutData = JSON.stringify(loginInfo);
loginReqOptions.headers['Content-Length'] = loginPutData.length;

var homepageReqOptions = shanbayApi.homepageReqOptions;

var searchReqOptions = shanbayApi.searchReqOptions;
searchReqOptions.path += content;

var learnReqOptions = shanbayApi.learnReqOptions;

var loginReq = http.request(loginReqOptions, (res) => {
    res.on('data', (data) => {
        data = JSON.parse(data);
        if (data.status_code === 0 && data.msg === 'SUCCESS') {
            var cookiesObj = cbUtil.parseSetCookie(res.headers['set-cookie']);
            //console.dir(cookiesObj);
            homepageReqOptions.headers.Cookie += 'csrftoken=' + cookiesObj.csrftoken.value + ';'; 
            homepageReqOptions.headers.Cookie += 'auth_token=' + cookiesObj.auth_token.value + ';'; 
            homepageReqOptions.headers.Cookie += 'sessionid=' + cookiesObj.sessionid.value + ';'; 
            //console.dir(homepageReqOptions);

            var homePageReq = http.request(homepageReqOptions, (res) => {
                res.on('data', (data) => {
                    
                });
                res.on('end', () => {
                    var cookiesObj = cbUtil.parseSetCookie(res.headers['set-cookie']);
                    learnReqOptions.headers.Cookie += homepageReqOptions.headers.Cookie + 'userid=' + cookiesObj.userid.value + ';';
                    var searchReq = http.request(searchReqOptions, (res) => {
                        res.on('data', (data) => {
                            data = JSON.parse(data);
                            if (data.status_code === 0 && data.msg === 'SUCCESS') {
                                data = data.data;
                                var id = data.id;
                                var cnDefinitions = data.definitions.cn;
                                console.log(`单词 [${content}] 含义如下：\r\n`);
                                for (var i = 0; i < cnDefinitions.length; i++) {
                                    console.log(`[${i + 1}] ${cnDefinitions[i].pos} ${cnDefinitions[i].defn}`);
                                }

                                var learnReqData = JSON.stringify({
                                    id: id,
                                    content_type: 'vocabulary'
                                });
                                learnReqOptions.headers['Content-Length'] = learnReqData.length;
                                var learnReq = http.request(learnReqOptions, (res) => {
                                    res.on('data', (data) => {
                                        data = JSON.parse(data);
                                        if (data.status_code === 0 && data.msg === 'SUCCESS') {
                                            console.log(`\r\n单词 [${content}] 已成功添加到单词学习库。`)
                                        }
                                    });
                                    res.on('end', () => {

                                    });
                                });
                                learnReq.write(learnReqData);
                                learnReq.end();
                            } else {
                                console.log(`[查询结果] ${data.msg}`);
                            }
                        });
                        res.on('end', () => {

                        });
                    });
                    searchReq.end();
                });
            });

            homePageReq.on('error', (e) => {
                console.log(`problem with request: ${e.message}`);
            });
            homePageReq.end();
        }
    });
    res.on('end', () => {

    });
});

loginReq.on('error', (e) => {
    console.log(`problem with request: ${e.message}`);
});

loginReq.write(loginPutData);
loginReq.end();