var request = require("request");
var fs = require('fs');
var _ = require('lodash');
var config = require("../config");

let info = {};
const  resultHandler = (res) =>{
        const data =   res.split("=")[1];
        const statelist =   data.split("@");
        statelist.shift();
        statelist.forEach(item=>{
            var val = item.split('|')
            info[val[1]] = {
                name:val[1],
                code:val[2],
                pinyin:val[3],
                shouzimu:[0]
            }
            
        })
        
      
}
const readCacheFile = ()=>{
    const {rootPath} = config;
    const stateInfoJsonUrl =  rootPath+'query/stateinfo.txt';
    return new Promise((resolve,reject)=>{
        fs.readFile(stateInfoJsonUrl,'utf-8',function(err, data){
            if(err) {
                console.log('读取stateinfo操作失败');
                resolve();
            }else{
                 resolve(data);
            }
           
            
        });
    })
}
const writeCacheFile = (src)=>{
    const {rootPath} = config;
    const stateInfoJsonUrl =  rootPath+'query/stateinfo.txt';
    return new Promise((resolve,reject)=>{
        fs.writeFile(stateInfoJsonUrl,src,function(err, data){
            if(err) console.log('写cache操作失败');
            else resolve();
        });
    })
}
const query = (resolve)=>{
    //获取车站信息
    console.log("获取车站信息")
    var options = { method: 'GET',
                url: 'https://kyfw.12306.cn/otn/resources/js/framework/station_name.js',
                qs: { station_version: '1.9090' },
                headers: 
                { 'Postman-Token': 'a3023976-52e6-4f78-a0c1-d2e81227afa7',
                    'cache-control': 'no-cache' } };

                request(options, function (error, response, body) {
                if (error) throw new Error(error);
                     writeCacheFile(body);
                     resultHandler(body)
                     resolve(info) ;
                }); 
}

function  getStateName(){
    return new Promise((resolve,reject)=>{
        readCacheFile().then(data=>{
            if(data){
                resultHandler(data)
                resolve(info) ;
            }else{
                query(resolve);
            }
        })
        
    })
    
}

     


module.exports = getStateName;


