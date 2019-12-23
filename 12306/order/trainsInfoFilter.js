const config12306 = require("../config");
const _ = require("lodash");

const {siteMap,siteCode} = config12306;
const filter = (trains,orderInfo)=>{
    let result = false ;
    if(orderInfo.trainNumber.includes(trains.station_train_code)){
       const seatList = orderInfo.seat.filter(site=>{
            const sitePro = siteMap[site]+'_num';
            let number =  _.isNumber(trains[sitePro])?Number(trains[sitePro]):0;
            if(trains[sitePro]=="有"){
                number = Infinity;
            }
            return number>orderInfo.passenger.length;
        });
        result = seatList.length>0;
    }
    return result;

}
function trainsFilter(orderInfo,trainsInfo){
    return trainsInfo.filter(trains=>{
        if(trains.canWebBuy=="Y"){
            return filter(trains,orderInfo);
        }else{
            return false;
        }
        
    })
    
}
function getTargetTrains(orderInfo,trainsInfo){
    return trainsInfo.filter(trains=>orderInfo.trainNumber.includes(trains.station_train_code))
}
//可以购买
function canBuy(orderInfo,trainsInfo){
  const targetTrains =  getTargetTrains(orderInfo,trainsInfo);
  const cannotBuylist = targetTrains.filter(trains=>trains.canWebBuy=="IS_TIME_NOT_BUY"||trains.canWebBuy=="N")
  return cannotBuylist.length!=targetTrains.length;
}
//获取候补目标车次
function getWaitTarget(orderInfo,trainsInfo){
    const waitTarget = [];
    const targetTrains =  getTargetTrains(orderInfo,trainsInfo);
    //此处采取坐席优先策略
    orderInfo.seat.forEach(seat=>waitTarget.push({seatCode:siteCode[seat],trainList:[]}));
    targetTrains.forEach(train=>{
       if(train.houbu_train_flag=='1'){
        const limitSeatMap = {};
        const wantList = {}
        for(let i=0;i<train.houbu_seat_limit.length;i++){
            const limitSeatType = train.houbu_seat_limit[i];
            limitSeatMap[limitSeatType]=0;
        }
        orderInfo.seat.forEach(seat=>wantList[siteCode[seat]]=1);
        const maxin = {...wantList,...limitSeatMap};
        Object.keys(maxin).forEach(key=>{
            if(maxin[key]==1){
                waitTarget.forEach(t=>{
                    if(t.seatCode==key){
                        t.trainList.push(train.train_no)
                    }
                })
            }
        })
       }
    })
    return waitTarget;
}
module.exports = {trainsFilter,canBuy,getWaitTarget};
