var query = require('../query');
var {getWaitTarget} = require('../order/trainsInfoFilter')
var {URL12306} = require('../config');
const request12306 = require("../request/requset12306");
function waitHandler(order,trainsInfo){
    if(trainsInfo){
        const waitTarget = getWaitTarget(order,trainsInfo);
        getPassenger(order)
        .then(passengerInitApi)
        .then(getQueueNum)
        .then(comitHB.bind(this,waitTarget));
        //comitHB(order,waitTarget);
    }else{
        query(order).then(trainsInfo=>{

        })
    }
}
function passengerInitApi({order,passengerInfo}){
    return new Promise(resolve=>{
        const {passengerInitApi} = URL12306;
        request12306.post({
            id:order.orderId,
            url:passengerInitApi,
            callback:function (error, response, body) {               
                try{
                    if (error) throw new Error(error);
                    resolve({order,passengerInfo});
                }catch(error){
                    console.log('shibai');
                }
            }
        });
    });
}

function getQueueNum({order,passengerInfo}){
        return new Promise(resolve=>{
            const {getQueueNum} = URL12306;
            request12306.post({
                id:order.orderId,
                url:getQueueNum,
                callback:function (error, response, body) {               
                    try{
                        if (error) throw new Error(error);
                        resolve({order,passengerInfo});
                    }catch(error){
                        console.log('shibai');
                    }
                }
            });
        });

}

function comitHB(waitTarget,{order,passengerInfo}){
   
        const {confirmHB} = URL12306;
        const param = {};
        console.log(passengerInfo);
        param.passengerInfo = passengerInfo.map(passenger=>{
            const {passenger_type,passenger_name,passenger_id_type_code,passenger_id_no,allEncStr,passenger_flag} = passenger
            let result = [passenger_type,passenger_name,passenger_id_type_code,passenger_id_no,allEncStr,passenger_flag];
            return result.join('#')
        }).join(';')
        param.jzParam = order.hbDeadline;
        const hbTrain = [];
        waitTarget.forEach(item=>{
            item.trainList.forEach(v=>hbTrain.push(`${v},${item.seatCode}#`))
        });
        param.hbTrain = hbTrain.slice(0,2).join('')
        param.lkParam = "";
        request12306.post({
            id:order.orderId,
            url:confirmHB,
            data:param,
            callback:function (error, response, body) {               
                try{
                    if (error) throw new Error(error);
                    console.log(body);
                }catch(error){
                    console.log('shibai');
                }
            }
        });


   
}



function getPassenger(orderInfo){
    return new Promise(resolve=>{
        const { getPassengerDTOsURL } = URL12306;
        var param = {} 
        request12306.post({
            id:orderInfo.orderId,
            url:getPassengerDTOsURL,
            data:param,
            callback:function (error, response, body) {               
                try{
                    if (error) throw new Error(error);
                    const passengerInfo  = JSON.parse(body);
                    const nomalPassengerInfo = passengerInfo.data.normal_passengers.filter(item=>{
                        return orderInfo.passenger.includes(item.passenger_name);
                    })
                    resolve({order:orderInfo,passengerInfo:nomalPassengerInfo});
                }catch(error){
                    console.log('shibai');
                }
            }
        });
    })
    
   
}

module.exports = waitHandler;