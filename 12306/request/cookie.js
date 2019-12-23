
const RAIL_DEVICEID = "aQDh91yvXY28ul_avBShT7D-N_ExaA9wH3SDofs3116aPU1qu9O-lx9-FXCKKAZOIgiVlqAvQTYeYS1LUCAisy4ZQioKWLUvzaH3oFG_0CKdNgztjyecsKKwm9zavIESefGNHzBXTlgTmV71f3qalwP2ul37_N4c";

class Cookie{
    constructor(){
        this.cookie = {
            '/':{
                RAIL_EXPIRATION:new Date().getTime()
            }
        }
        this.getCookie = this.getCookie.bind(this);
        this.setCookie = this.setCookie.bind(this);
    }
    getCookie(root){
        var result = [];
        for( var key in this.cookie['/']){
            result.push(key+'='+this.cookie['/'][key])
        }
        if(this.cookie[root]){
            for( var key in this.cookie[root]){
                result.push(key+'='+this.cookie[root][key])
            }
        }
        return result.join('; ')+`; RAIL_DEVICEID=${RAIL_DEVICEID}`;
    }
    setCookie (cookieList){
        var that = this;
        if(Array.isArray(cookieList)){
            cookieList.forEach(cookieStr=>{
                var cookiearrya = cookieStr.split(';')
                const root = cookiearrya.pop().split('=')[1];
                if(!that.cookie.hasOwnProperty(root)){
                    that.cookie[root] = {}
                }
                cookiearrya.forEach(cookie=>{
                   const value =  cookie.split('=');
                   if(value[1])
                        that.cookie[root][value[0]] = value[1];
                    else{
                        delete  that.cookie[root][value[0]];
                    }
                    
                })

            })
        }


    }
}



module.exports = Cookie;