const login1  = require('./login1');
const login2  = require('./login2');
const config12306 = require('../config');
const request12306 = require("../request/requset12306");
// 12306有两套登录接口先尝试第一套，如果最后登录失败则改为第二套登录

const { URL12306 } = config12306;
const login = (order) => {
    const {orderId } = order;
    const {getLoginBannerURL,confURL,GetJSURL,uamtkURL} = URL12306;
    const p1 = getCookieRequest(orderId,getLoginBannerURL,'get',{});
    const p2 = getCookieRequest(orderId,confURL,'post',{});
    const p3 = getCookieRequest(orderId,GetJSURL,'get',{});
    const p4 = getCookieRequest(orderId,uamtkURL,'post',{appid:'otn'});
    return new Promise(resolve=>{
        Promise.all([p1,p2,p3,p4]).then(()=>{
            login1(order).then(res=>resolve(res));
        })
    })   
}
const getCookieRequest = (id,url,method)=>{
    return new Promise(resolve=>{
        request12306[method]({id,url,data: {}, callback: resolve});
    })
}
module.exports = login;


