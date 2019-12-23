const fs= require('fs');
// 读取配置文件
exports.readCacheFile = (cachePath,isSync = true)=>{
    if(isSync){
        return fs.readFileSync(cachePath,'utf-8').toString();
    }else{
        return new Promise((resolve,reject)=>{
            fs.readFile(cachePath,'utf-8',function(err, data){
                if(err) console.log('写cache操作失败');
                else resolve(JSON.parse(data));
            });
        })
    }
    
}
//写入配置文件
exports.writeCacheFile = (cachePath,src,isSync = true)=>{
    if(isSync){
        fs.writeFileSync(cachePath,JSON.stringify(src));
    }else{
        return new Promise((resolve,reject)=>{
            fs.writeFile(cachePath,src,function(err, data){
                if(err) console.log('写cache操作失败');
                else resolve();
            });
        })
    }
    
}
