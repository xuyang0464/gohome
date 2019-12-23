const config12306 = require('../config');
const request = require('request');
const login2 = require('./login2');
const _ = require('lodash');
const request12306 = require("../request/requset12306");
var fs = require('fs');
var FormData = require('form-data');

const { URL12306 } = config12306;
class LoginProgrom {
    constructor(order, resolve, reject) {
        this.order = order;
        this.resolve = resolve;
        this.reject = reject;
    }
    init() {
        //默认采用第一套接口登录
        this.logIn1();

    }
    //第一套登录接口
    logIn1() {
        this.getImg1();
    }
    //第二套登录接口
    logIn2() {
        this.getImg2();
    }
    //第一套登录接口===========================
    getImg1() {
        let that = this;
        const url = URL12306.captchaImageURL;
        let param = {
            'login_site': "E",
            'module': 'login',
            'rand': 'sjrand',
            "": new Date().getTime()

        }
        request12306.get({
            id: that.order.orderId,
            url: url,
            data: param,
            callback: (error, response, body) => {
                if (!error && response.statusCode == 200) {
                    try {
                        const data = JSON.parse(body);
                        console.log('请求验证码获取成功');
                        this.base64ToFile(data.image).then(filePath => {
                            this.getImgCheckResult(filePath);
                        })
                    } catch (error) {
                        console.error(error);
                        that.init1();
                    }
                }
            }
        })
        console.log('请求验证码中...')
    }

    base64ToFile(base64) {
        const { imgPath } = config12306;
        const filtPath = imgPath + Date.now() + '.jpeg';
        var dataBuffer = new Buffer(base64, 'base64');
        return new Promise((resolve, resject) => {
            fs.writeFile(filtPath, dataBuffer, function (err) {//用fs写入文件
                if (err) {
                    console.log(err);
                } else {
                    console.log('写入成功！');
                    resolve(filtPath)
                }
            })

        })
    }
    getImgCheckResult(filePath) {
        let that = this;
        const { getCheckUrlNew } = URL12306;
        var options = {
            method: 'POST',
            url: getCheckUrlNew,
            headers: { 'Content-Type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW' },
            formData: {
                pic_xxfile: {
                    value: fs.createReadStream(filePath),
                    options: {
                        filename: filePath,
                        contentType: null
                    }
                }
            },
        };
        console.log('请求验证码check中...')
        request(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                const coordinates = ['40,40', '110,40', '180,40', '250,40', '40,110', '110,110', '180,110', '250,110'];
                const checkresultIndexList = body.match(/(?<=<B>).*?(?=<\/B>)/g);
                if (checkresultIndexList[0]) {
                    const checkResult = checkresultIndexList[0].split(' ').map(item => coordinates[Number(item) - 1]).join(',');
                    that.checkResult12306(checkResult);
                }
            }
        })
    }


    //这部分是采用360抢票王验证啊验证的方式，但是由于过去checkd的接口关闭，此方法不能用了。
    // getCheck(base64){
    //     let that = this;
    //     const {getCheckURL} = URL12306;
    //     var options = {
    //         method: 'POST',
    //         url: getCheckURL,
    //         headers: { 'Content-Type': 'application/json' },
    //         body: { base64: base64 },
    //         json: true
    //     };
    //     console.log('请求验证码check中...')
    //     request(options, function (error, response, body) {
    //         if (!error && response.statusCode == 200) {
    //             if (body.check) {
    //                 console.log('请求验证码check获取成功')
    //                 that.getImgCheckResult(base64, body.check);
    //             } else {
    //                 console.log('获取check失败')
    //                 setTimeout(function(){
    //                     that.init();
    //                 },1000);
    //             }
    //         }
    //     })
    // }
    // getImgCheckResult(base64, check) {
    //     let that = this;
    //     const {imgCheckResultURL} =URL12306;
    //     var data = '{"img_buf":"' + base64 + '","check":"' + check + '"},"logon":1,"type":"D"}'
    //     var options = {
    //         method: 'POST',
    //         url: imgCheckResultURL,
    //         headers: {
    //             'Postman-Token': '0b505179-d64f-47f3-adea-0442ba727cf7',
    //             'cache-control': 'no-cache'
    //         },
    //         timeout:10000,
    //         body: data
    //     };
    //     console.log('请求验证码识别结果中...');
    //     request(options, function (error, response, body) {

    //         try{
    //             if (error) throw new Error(error);
    //             const data = JSON.parse(body);
    //             if (data.res == "") {
    //                 console.log('识别结果返回为空')
    //                 that.init();
    //             } else {
    //                 console.log('请求验证码识别结果成功');
    //                 const xy = that.checkStringHandle(data.res);
    //                 that.checkResult12306(xy);
    //             }
    //         }catch(error){
    //             console.log('获取识别结果报错');
    //             setTimeout(function(){
    //                 that.init();
    //             },1000);
    //         }
    //     });
    // }
    // checkStringHandle(str) {
    //     var result = ""
    //     if (str) {
    //         result = str.replace(/\(|\)/g, "");
    //     }
    //     return result;
    // }
    checkResult12306(answer) {
        let that = this;
        const url = URL12306.captchaCheckURL;
        const param = {
            answer: encodeURI(answer),
            rand: 'sjrand',
            login_site: 'E',
            _: new Date().getTime()
        };
        request12306.get({
            id: that.order.orderId,
            url: url,
            data: param,
            callback: function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    const res = JSON.parse(body);
                    if (res.result_code == '4') {
                        console.log('请求验证码验证结果成功');
                        that.login12306(answer);
                    }
                    else {
                        console.log(res.result_message)
                        setTimeout(function () {
                            that.init();
                        }, 1000);
                    }

                }
            }
        });
        console.log('请求验证码识验证结果中...');
    }
    login12306(answer) {
        let that = this;
        const { loginURL } = URL12306;
        const { username, password } = that.order;
        var param = {
            answer: encodeURI(answer),
            username: username,
            password: password,
            appid: 'otn'
        }
        request12306.post({
            id: that.order.orderId,
            url: loginURL,
            data: param,
            callback: function (error, response, body) {

                try {
                    if (error) throw new Error(error);
                    const data = JSON.parse(body);
                    if (data.result_code == 0) {

                        console.log("登陆成功");
                        that.getUamtk();

                    } else {
                        console.log('登录失败');
                        setTimeout(function () {
                            that.init();
                        }, 1000);
                    }

                } catch (err) {
                    console.log('登录失败');
                    setTimeout(function () {
                        that.init();
                    }, 1000);
                }

            }
        });
        console.log('开始登录中...');
    }
    getUamtk() {
        let that = this;
        const { uamtkURL } = URL12306;
        var param = {
            appid: 'otn'
        }
        request12306.post({
            id: that.order.orderId,
            url: uamtkURL,
            data: param,
            header:{'Referer':'https://kyfw.12306.cn/otn/passport?redirect=/otn/login/userLogin'},
            callback: function (error, response, body) {
                if (error) throw new Error(error);
                try {
                    const data = JSON.parse(body);

                    that.getNewCookies(data.newapptk);
                } catch (err) {
                    console.log('获取Uamtk失败');
                    setTimeout(function () {
                        that.init();
                    }, 1000);
                }

            }
        });
        console.log('获取Uamtk中...');

    }
    getNewCookies(uamtk) {
        let that = this;
        const { uamauthclientURL } = URL12306;
        var param = {
            tk: uamtk
        }
        console.log('获取NewCookies中...');
        request12306.post({
            id: that.order.orderId,
            url: uamauthclientURL,
            data: param,
            callback: function (error, response, body) {
                if (error) throw new Error(error);
                if (response.statusCode == 200) {
                    try {
                        const data = JSON.parse(body);
                        that.resolve(data);
                        console.log('获取NewCookies成功', data);
                    } catch (error) {
                        console.log('获取NewCookies失败', body);
                    }
                } else {
                    console.log('获取NewCookies失败', body);
                    setTimeout(function () {
                        that.init();
                    }, 1000);
                }

            }
        });

    }

    //第二套登录接口==========================================
    getImg2() {
        let that = this;
        const url = URL12306.captchaImageURL2;
        let param = {
            'module': 'login',
            'rand': 'sjrand',
            "": new Date().getTime()

        }
        request12306.get({
            id: that.order.orderId,
            url: url,
            data: param,
            callback: (error, response, body) => {
                if (!error && response.statusCode == 200) {
                    try {
                        const data = JSON.parse(body);
                        console.log('请求验证码获取成功')


                    } catch (error) {
                        console.error(error);

                    }
                }
            }
        })
        console.log('请求验证码中...')
    }

}


const login1 = (order) => {
    return new Promise((resolve, reject) => {
        const loginObj = new LoginProgrom(order, resolve, reject);
        loginObj.init();

    })
}
module.exports = login1;


