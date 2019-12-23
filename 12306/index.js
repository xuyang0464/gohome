var fs = require('fs');
var moment =require('moment');
var login = require('./login');
var query = require('./query');
var orderFactory = require('./order');
var config = require('./config');
const trainsInfoFilter = require("./order/trainsInfoFilter");
const request12306 = require("./request/requset12306");
const startSaleTime = require("./query/startSaleTime");
const trainsList = require("./query/train_list")
const  schedule = require('node-schedule');
const request = require('request');
const {checkCache} = require('./request/cookieManager');
const waitHandler = require('./wait');
const {trainsFilter,canBuy} = trainsInfoFilter;

let Cache = {};
let gipTime = 1;//轮询间隔 s

const gonnaBuy = (order)=>{
    console.log('登录成功等待到点开抢')
    schedule.scheduleJob({hour: 10, minute: 30,second:58}, function(){
        trainsQuery(order);
    });
}

const trainsQuery = (order)=>{
    query(order).then(trainsInfo=>{
        if(canBuy(order,trainsInfo)){
            const filterResult = trainsFilter(order,trainsInfo);
            if(filterResult.length>0){
                orderFactory(order,filterResult).then((success)=>{
                    console.log(success)
                },(faile)=>{
                    const {order} = faile;
                    if(order)
                    startlogin(order);
                    else{
                        console.log("出错完了")
                    }
                });
            }else{
                // console.log("暂无符合要求的车次，进入候补流程");
                // waitHandler(order,trainsInfo);
                console.log('没查到车票再试试');
                setTimeout(()=>{
                    trainsQuery(order);
                },gipTime*1000)
            }

        }else{
            console.log("暂未开售，"+ gipTime +"秒后再次查询")
            setTimeout(()=>{
                trainsQuery(order);
            },gipTime*1000)
        }
    }); 
}
const startlogin = (order)=>{
    login(order).then(data=>{    
        order.auth = data;
        Cache[order.username] = data.apptk;
        request12306.setCookie({
            id:order.orderId,
            path:"",
            key:"tk",
            value:data.apptk
        })
        gonnaBuy(order);
       
    });
}
//抢票订单数据预处理，预售和捡漏
const orderPreHandler = function (orderList){
    const {advanceBookingCycle} = config;
    let preSaleList = []//预售队列
    let seckillList = [];//秒杀队列
    let nowSaleList = []//抢购队列
    const preTime = 15;//提前多长时间进入抢购队列
    //计算当日可够的最远时间车票
    const advanceBookingDate = moment().subtract(1-Number(advanceBookingCycle),'days');
    orderList.forEach(order=>{
       const orderTime = moment(order.time);
    //    if(moment()<orderTime){
        const startStationSaleTime = startSaleTime(order.start).map(item=>{
            const arr =  item.time.split(":");
            item.value = Number(arr[0])*60+Number(arr[1]);
            return item;
        }).sort((v1,v2)=>{return v1.value-v2.value>0})[0].time;
       
       //如果需要订票的日期晚于今日的售票最远日期则进入 预定队列
       if(orderTime>advanceBookingDate){
          preSaleList.push(order);
       }else if(orderTime.format("YYYY-MM-DD")==advanceBookingDate.format("YYYY-MM-DD")){
           //如果需要订票的日期就是今日的售票最远日期
           //则判断 当前时间是否早于 当日最早的订票时间
            //开售前15分钟进入秒杀警戒时间
            const seckillWarinningTime = moment(startStationSaleTime,"HH:mm").subtract(preTime,"minute");
            if(moment()<seckillWarinningTime){
                preSaleList.push(order);
            }else if(moment()<=moment(startStationSaleTime)&&moment()>=seckillWarinningTime){
                seckillList.push(order);
            }else{
                nowSaleList.push(order)
            }
       }
       //如果需要订票得日期小于今日的最远售票日,则进入捡漏队列
       else{
            nowSaleList.push(order);
       }

    //    }else{
    //        console.log()
    //    }
       
    });
    return {preSaleList,nowSaleList,seckillList}
}

//预购订单处理流程
const preSaleListHandler = (preSaleList)=>{
    preSaleList.forEach(order=>{

    })
}
//抢购订单处理流程
const nowSaleListHandler = (nowSaleList)=>{
    /*为了减少登录次数，将成功登录后的 tk 存到文件里，tk存在就直接进行查询下单流程
    如果下单流程报错,则说明可能是tk失效，那么久重新登录，更新tk；如果tk不存在则说明没登陆过
    那么久走登录流程
    */

   nowSaleList.forEach(order=>{
    if(!checkCache(order.orderId)){
        startlogin(order);
    }else{
        trainsQuery(order);
    }
    
})
    
}

const engine12306 = ()=>{
    const {orderInfo} = config;  
    const orderlist = orderPreHandler(orderInfo);
    preSaleListHandler(orderlist.preSaleList);
    nowSaleListHandler(orderlist.nowSaleList)
    // schedule.scheduleJob({hour: 10, minute: 30,second:58}, function(){
    //     nowSaleListHandler(orderInfo)
    // });
    // console.log('10点28登录');
   
}
module.exports = engine12306;



