const config12306 = require('../config');
const request = require('request');
const _ = require('lodash');
const request12306 = require("../request/requset12306");
const getStationName = require("./stateInfo");

const {URL12306} = config12306;

let stateInfo = {};

const queryResultHandler = (data)=>{
        let result = [];
        data.result.forEach(res=>{
            let cu = {}
            const cq = res.split("|");
            cu.startSaleTime = cq[1];
            cu.train_no = cq[2]; //车票号
            cu.station_train_code = cq[3]; //车次
            cu.start_station_telecode = cq[4]; //起始站代号
            cu.end_station_telecode = cq[5]; //终点站代号
            cu.from_station_telecode = cq[6]; //出发站代号
            cu.to_station_telecode = cq[7]; //到达站代号
            cu.start_time = cq[8]; //出发时间
            cu.arrive_time = cq[9]; //到达时间
            cu.lishi = cq[10]; //历时
            cu.canWebBuy = cq[11]; //是否能购买：Y 可以
            cu.yp_info = cq[12];
            cu.start_train_date = cq[13]; //出发日期
            cu.train_seat_feature = cq[14]; 
            cu.location_code = cq[15];
            cu.from_station_no = cq[16];  
            cu.to_station_no = cq[17];
            cu.is_support_card = cq[18];
            cu.controlled_train_flag = cq[19];
            cu.gg_num = cq[20] ? cq[20] : "--";
            cu.gr_num = cq[21] ? cq[21] : "--";
            cu.qt_num = cq[22] ? cq[22] : "--";
            cu.rw_num = cq[23] ? cq[23] : "--"; //软卧
            cu.rz_num = cq[24] ? cq[24] : "--"; //软座
            cu.tz_num = cq[25] ? cq[25] : "--"; 
            cu.wz_num = cq[26] ? cq[26] : "--"; //无座
            cu.yb_num = cq[27] ? cq[27] : "--";
            cu.yw_num = cq[28] ? cq[28] : "--"; //硬卧
            cu.yz_num = cq[29] ? cq[29] : "--"; 
            cu.ze_num = cq[30] ? cq[30] : "--"; //二等座
            cu.zy_num = cq[31] ? cq[31] : "--"; //一等座
            cu.swz_num = cq[32] ? cq[32] : "--"; //商务特等座
            cu.srrb_num = cq[33] ? cq[33] : "--";
            cu.yp_ex = cq[34];
            cu.seat_types = cq[35];
            cu.secretStr = decodeURIComponent(cq[0]); //secretStr索引为0
            cu.houbu_seat_limit = cq[38];
            cu.houbu_train_flag = cq[37];
            result.push(cu);
       })
       return result;
}

const queryInfo = ({start,end,time,orderId,p="Z"},resolve)=>{
        const {queryURL} = config12306.URL12306;

        request12306.get({
            id:orderId,
            url:queryURL+p,
            data:{ 'leftTicketDTO.train_date': time,
            'leftTicketDTO.from_station': stateInfo[start].code,
            'leftTicketDTO.to_station': stateInfo[end].code,
            purpose_codes: 'ADULT' },
            callback:function (error, response, body) {
                try{
                    if (error) throw new Error(error);
                    const data = JSON.parse(body).data;
                    const result = queryResultHandler(data);
                    resolve(result);
                    console.log("查询车次信息成功")

                }catch(err){
                    console.log("查询车次信息失败");
                    //resolve(false);
                }
                
                   
            }
        })
        console.log("查询车次信息...")

}

const query = (order)=>{
    return new Promise((resolve,reject)=>{
        getStationName().then(res=>{
            stateInfo = res;
            queryInfo(order,resolve);
        });
    })
    
   // 
}


module.exports = query;