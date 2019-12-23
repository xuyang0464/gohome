const config12306 = require('../config');
const request = require('request');
const _ = require('lodash');
const request12306 = require("../request/requset12306");
let imgCookies = "";
const {URL12306} = config12306;

class LoginProgrom{
    constructor(order,resolve,reject){
        this.order = order;
        this.resolve = resolve;
        this.reject = reject;
    }
    init(){
        this.getImg();
    }
    getImg(){
        let that = this;
        const url = URL12306.captchaImageURL2;
        let param  = {
            'module':'login',
            'rand':'sjrand',
            "": new Date().getTime()

        }
        request12306.get({
            id:that.order.orderId,
            url:url,
            data:param,
            callback:(error, response, body)=>{
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

    getCheck(base64){
        let that = this;
        const {getCheckURL} = config12306;
        var options = {
            method: 'POST',
            url: getCheckURL,
            headers: { 'Content-Type': 'application/json' },
            body: { base64: base64 },
            json: true
        };
        console.log('请求验证码check中...')
        request(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                if (body.check) {
                    console.log('请求验证码check获取成功')
                    that.getImgCheckResult(base64, body.check);
                } else {
                    console.log('获取check失败')
                   that.init();
                }
    
    
    
            }
        })
    }
    getImgCheckResult(base64, check) {
        let that = this;
        const {imgCheckResultURL} =config12306;
        var data = '{"img_buf":"' + base64 + '","check":"' + check + '"},"logon":1,"type":"D"}'
        var options = {
            method: 'POST',
            url: imgCheckResultURL,
            headers: {
                'Postman-Token': '0b505179-d64f-47f3-adea-0442ba727cf7',
                'cache-control': 'no-cache'
            },
            body: data
        };
        console.log('请求验证码识别结果中...');
        request(options, function (error, response, body) {
            if (error) throw new Error(error);
            try{
                const data = JSON.parse(body);
                if (data.res == "") {
                    console.log('识别结果返回为空')
                    that.init();
                } else {
                    console.log('请求验证码识别结果成功');
                    const xy = that.checkStringHandle(data.res);
                    that.checkResult12306(xy);
                }
            }catch(error){
                console.log('获取识别结果报错');
                that.init();
            }
            
    
        });
    
    }
    checkResult12306 (answer) {
        let that = this;
        const url = config12306.captchaCheckURL;
        var options = {
            url: url,
            qs: {
                answer: encodeURI(answer),
                rand: 'sjrand',
                login_site: 'E',
                _: new Date().getTime()
            },
            headers: {
                Cookie: that.Cookie.getCookie('/passport')
                //Cookie:'_passport_ct=62f22ccfa8a24bdc91f13df02957c6a6t5684'
            }
        };
        console.log('请求验证码识验证结果中...');
        request(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                const res = JSON.parse(body);
                if (res.result_code == '4') {
                    console.log('请求验证码验证结果成功');
                    that.Cookie.setCookie(response.headers['set-cookie']);
                    that.login12306(answer);
                    
                }
                else {
                    console.log(res.result_message)
                    that.init();
                }
    
            }
        })
    
    }
    login12306 (answer) {
        let that = this;
        const {  loginURL, host } = config12306;
        const {username, password,} = that.order;
        var data = {
            answer: encodeURI(answer),
            username: username,
            password: password,
            appid: 'otn'
        }
    
        const url = loginURL;
    
        var options = {
            method: 'POST',
            url: url,
            headers: {
                Cookie: that.Cookie.getCookie('/passport'),
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            form: data,
        };
        console.log('开始登录中...');
        request(options, function (error, response, body) {
            if (error) throw new Error(error);
            const data = JSON.parse(body);
            if (data.result_code == 0) {
                that.Cookie.setCookie(response.headers['set-cookie']);
                console.log("登陆成功");
                that.getUamtk();
                
            }else{
                console.log('登录失败');
                that.init();
            }
    
    
    
        });
    
    }
    getUamtk(){
        let that = this;
        const { uamtkURL, host } = config.config12306;
        var data = {
            appid: 'otn'
        }
        const url = uamtkURL;
    
        var options = {
            method: 'POST',
            url: url,
            headers: {
                Cookie: that.Cookie.getCookie('/passport'),
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            form: data,
        };
        console.log('获取Uamtk中...');
        request(options, function (error, response, body) {
            if (error) throw new Error(error);
            const data = JSON.parse(body);
            that.Cookie.setCookie(response.headers['set-cookie']);
            that.getNewCookies(data.newapptk);
    
        });
    
    }
    getNewCookies (uamtk) {
        let that = this;
        const { uamauthclientURL, host } = config.config12306;
        var data = {
            tk: uamtk
        }
        const url = uamauthclientURL;
        console.log('获取NewCookies中...');
        var options = {
            method: 'POST',
            url: url,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36'
            },
            form: data,
        };
        request(options, function (error, response, body) {
            if (error) throw new Error(error);
            if(response.statusCode == 200){
                try{
                    const data = JSON.parse(body);
                    that.resolve(data);
                    console.log('获取NewCookies成功',data);
                }catch(error){
                    console.log('获取NewCookies失败',body);
                }
            }else{
                console.log('获取NewCookies失败',body);
            }
           
            
    
    
    
        });
    
    }
    checkStringHandle (str) {
        var result = ""
        if (str) {
            result = str.replace(/\(|\)/g, "");
        }
        return result;
    }
}

const login2 = () => {
    return new Promise((resovle,reject)=>{
        let  loginProgrom= new LoginProgrom();
        loginProgrom.init();
    })
   
}
module.exports = login2;


