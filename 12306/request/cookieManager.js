const CookieFactory = require('./cookie');
const utils = require('./utils');
var _ = require('lodash');

const {readCacheFile,writeCacheFile} = utils;
const cachePath = './cache.json';

let cookieCache = _getCookieCacheInFile();

function _upDateCookieCacheInFile(_cookieCache){
    writeCacheFile(cachePath,_cookieCache);
}
function _getCookieCacheInFile(){
    const data = JSON.parse(readCacheFile(cachePath))||{};
    var Cookie = new CookieFactory();
    Object.keys(data).forEach(key=>{
        data[key] = Object.assign(Cookie,data[key]);
    })
    return data;
}


function setCookie(id,cookie){
    if(cookieCache[id]){
        var Cookie = cookieCache[id];
        Cookie.setCookie(cookie)
    }else{
        var Cookie = new CookieFactory();
        Cookie.setCookie(cookie)
    }
    cookieCache[id] = Cookie;
    _upDateCookieCacheInFile(cookieCache);
    
    return cookie;
}
function getCookie(id,path){
    if(cookieCache[id]){
        return cookieCache[id].getCookie(path);
    }else{
        return false;
    }
    
}

function checkCache (id){
    return !_.isEmpty(cookieCache[id]);

}




const cookieManager = {
    getCookie,setCookie,checkCache
};



module.exports = cookieManager;