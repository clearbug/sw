## 一个码农，为啥要这么执着的学习英语
![全民编程](https://ws2.sinaimg.cn/large/006zuwa2gy1fefe7dqtsrj30bg0e310j.jpg)

从上图我们可以看到全民编程时代已经来了，连地铁里的大妈都在时刻学习编程技术。其实，让我震惊的不是大妈在学编程，全民编程时代嘛，大家都可以学呀！但是，大妈的手提包里还有英语培训相关的资料，连大妈都清楚地认识到了想要成为编程高手，必须先把英语学好啊！

## 简介
本工具是使用 NodeJs（都 2017 年了，如果你还不知道什么是 NodeJs，那么你可能真不适合做码农） 写的一个可以在 Gitbash 中查询单词的命令行个小工具。
当码农在阅读英文文档时，遇到不认识的单词经常会打开浏览器中的有道翻译、谷歌翻译等去查询，或者是使用有道翻译客户端等查询，我觉得这是极其浪费时间的。本工具默认使用扇贝网 API 进行单词查询，并且在设置了扇贝网的账号后，查询的单词会实时地添加到今日学习计划中，以便你可以随时随地拿起手机打开扇贝单词进行复习！
无图无真相：

![使用效果图](https://ws2.sinaimg.cn/large/006zuwa2gy1fefe465bimj30hp0es760.jpg)

## Installation
npm install --global cb_sw

## Usage
1. 初次使用，需要设置个人扇贝网账户的用户名和密码：
- 设置用户名：sw -u <your username>
- 设置密码：sw -p <your password>

2. 设置过用户名和密码之后就可以进行单词查询了：
- 扇贝网查询单词：sw courage

对于第一次单词查询需要使用用户名和密码去登录扇贝网，以便在查询完单词之后实时把该单词添加到个人每日单词学习库中。
今天发现扇贝网登录时需要输入验证码了，没办法，在下不懂图片验证码的自动识别，所以只能麻烦使用者自己在浏览器打开图片验证码的 URL，并按照要求输入验证码完成登录。每次登录后，本工具将会自动缓存用户 Cookie，十天之内不需要重复登录。

3. 因为在扇贝网上没有找到根据汉语查询英文单词的服务，所以接入了百度翻译，使用百度翻译不光可以查询英文单词（这里查询的单词并不会自动添加到个人每日单词学习库中）还可以根据汉语查询英文表达。用法：
- 百度翻译查询单词：sw -e courage
- 百度翻译查询汉语：sw -z 勇气

4. 查看个人扇贝网账户的用户名和密码：
- sw -i

5. 查看使用帮助菜单：
- sw -h
