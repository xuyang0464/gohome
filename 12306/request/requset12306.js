const request = require('request');
const cookieManager = require('./cookieManager');
const Origin = 'https://kyfw.12306.cn';
const post = ({url,data,id,callback,header})=>{
    const cooikePath = url.split("://")[1].split('/')[1];
    let _headers = { 
        Origin,
        Cookie: cookieManager.getCookie(id,"/"+cooikePath),
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
         'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36' 
    }
    _headers = {..._headers,...header}
    var options = { 
        method: "POST",
        url: url,
        headers:_headers,
        form:data
    };
    request(options, function (error, response, body) {
        if(!error)
           cookieManager.setCookie(id,response.headers['set-cookie']);
           callback&&callback(error, response, body);
    })

}
const get = ({url,data,id,callback})=>{
    const cooikePath = url.split("://")[1].split('/')[1];
    var options = { 
        method: 'GET',
        url: url,
        qs: data,
        headers:{ 
            Cookie: cookieManager.getCookie(id,"/"+cooikePath),
            'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36'
         } };

        request(options, function (error, response, body) {
            if(!error)
            cookieManager.setCookie(id,response.headers['set-cookie']);
            callback&&callback(error, response, body);
        });
}
const setCookie = ({id,path,key,value})=>{
    var cookieStr = `${key}=${value}; Path=/${path}`
    cookieManager.setCookie(id,[cookieStr]);
}

const requset12306 = {
   post,get,setCookie
}
module.exports = requset12306;