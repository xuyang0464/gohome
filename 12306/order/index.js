var request = require("request");
const config12306 = require("../config");
const request12306 = require("../request/requset12306");
const _ = require("lodash");

const {URL12306} = config12306;
class Order{
    constructor(orderInfo,trainsInfo){
        this.orderInfo = orderInfo;
        this.trainsInfo = trainsInfo;
        this.seatIndex = 0;
        this.stop = false;
        this.queryOrderWaitTime = this.queryOrderWaitTime.bind(this);
        this.queryMyOrderNoComplete = this.queryMyOrderNoComplete.bind(this);
    }
    init(resolve,reject){
        let that = this;
        if(!that.hasOwnProperty('resolve')){
            that.resolve = resolve;
        }
        if(!that.hasOwnProperty('reject')){
            that.reject = reject;
        }

        this.trainsInfo.forEach(tkinfo=>{
            that.submitOrderReq(tkinfo);
        });
        
    }
    //预定接口，想要预定的车次信息提交到服务器
    submitOrderReq(tkinfo){
        let that = this;
        if(that.stop){
            return ;
        }
        const { submitOrderRequestURL } = URL12306;
        var param = {
            secretStr: tkinfo.secretStr,
            train_date: that.orderInfo.time,
            back_train_date: that.orderInfo.time,
            tour_flag: 'dc',
            purpose_codes: 'ADULT',
            query_from_station_name: that.orderInfo.start,
            query_to_station_name: that.orderInfo.end,
        }
        request12306.post({
            id:that.orderInfo.orderId,
            url:submitOrderRequestURL,
            data:param,
            callback:function (error, response, body) {              
                try{
                    if (error) throw new Error(error);
                    const data = JSON.parse(body);
                    console.log("订单："+that.orderInfo.orderId+"调用车票预定接口成功")
                    if(data.status)
                        that.getInitDc();
                    else{
                        console.log(data.messages[0]);
                        that.failHandle(that.queryMyOrderNoComplete);
                    }    
                }catch(error){
                    console.log("订单："+that.orderInfo.orderId+"调用车票预定接口失败");
                    console.log("错误是",error);
                    that.stop = true;
                    that.failHandle();
                }
            }
        });
        console.log("订单："+that.orderInfo.orderId+"调用车票预定接口...")
    }
    //获取车次剩余车票的详情数据
    getInitDc(){
        let that = this;
        if(that.stop){
            return ;
        }
        const { initDcURL } = URL12306;
        var param = {'_json_att': ""} 
        request12306.post({
            id:that.orderInfo.orderId,
            url:initDcURL,
            data:param,
            callback:function (error, response, body) {
                try{
                    if (error) throw new Error(error);
                    that.globalRepeatSubmitToken = body.match(/globalRepeatSubmitToken = '(\S*)';/)[1];
                    let ticketInfoForPassengerForm=body.match(/ticketInfoForPassengerForm=(\S*);/);

                    if(!ticketInfoForPassengerForm){
                        console.log('ticketInfoForPassengerForm没有值');
                        that.failHandle();
                        return;
                    }else{
                        ticketInfoForPassengerForm = ticketInfoForPassengerForm[1];
                    }
                    ticketInfoForPassengerForm = ticketInfoForPassengerForm.replace(/\'/g,"\"");
                    that.ticketInfoForPassengerForm = JSON.parse(ticketInfoForPassengerForm);

                    console.log("订单："+that.orderInfo.orderId+"调用车票查询接口成功")
                    that.getPassenger();
                }catch(error){

                    console.log("订单："+that.orderInfo.orderId+"调用车票查询接口失败")
                    console.log("错误是",error);
                    that.stop = true;
                    that.failHandle();
                    
                }
            }
        });
        console.log("订单："+that.orderInfo.orderId+"调用车票查询接口...")
        
    }
    //获取常用联系人信息
    getPassenger(){
        let that = this;
        if(that.stop){
            return ;
        }
        const { getPassengerDTOsURL } = URL12306;
        var param = {
            '_json_att': "",
             'REPEAT_SUBMIT_TOKEN':that.globalRepeatSubmitToken
        } 
        request12306.post({
            id:that.orderInfo.orderId,
            url:getPassengerDTOsURL,
            data:param,
            callback:function (error, response, body) {               
                try{
                    if (error) throw new Error(error);
                    const passengerInfo  = JSON.parse(body);
                    const nomalPassengerInfo = passengerInfo.data.normal_passengers.filter(item=>{
                        return that.orderInfo.passenger.includes(item.passenger_name);
                    })
                    console.log("订单："+that.orderInfo.orderId+"获取文件联系人成功");
                    that.checkOrderInfo(nomalPassengerInfo);
                }catch(error){
                    console.log("订单："+that.orderInfo.orderId+"获取文件联系人失败")
                    console.log("错误是",error);
                    that.failHandle();
                }
            }
        });
        console.log("订单："+that.orderInfo.orderId+"获取文件联系人...")
    }
    //校验订单信息
    checkOrderInfo (passengerInfo){
        let that = this;
        if(that.stop){
            return ;
        }
        let passengerTicketStr = "",oldPassengerStr=[];
        let seatType = "";
        that.orderInfo.seat.forEach(seat=>{  
            if(seat=="无座"){
                seat = "硬座";
            }
            const seat_type_codes = that.ticketInfoForPassengerForm.limitBuySeatTicketDTO.seat_type_codes;
            const hasSeatList = seat_type_codes.filter(item=>{return item.value===seat});
            that.hasSeatList = hasSeatList;
            const tar_seat = hasSeatList[that.seatIndex] ;
            if(!passengerTicketStr&&tar_seat){
                seatType = tar_seat.id;
                passengerTicketStr = [];
                passengerInfo.forEach(passenger=>{
                    // 坐席类型id,怀疑是passenger_flag==0,乘客身份类型,乘客名称,证件类型,证件号码,电话号,N
                    let ticketArray = [tar_seat.id,
                        passenger.passenger_flag,passenger.passenger_type,
                        passenger.passenger_name,passenger.passenger_id_type_code,
                        passenger.passenger_id_no,passenger.mobile_no,'N',passenger.allEncStr
                    ];
                    passengerTicketStr.push(ticketArray.join(','));
                    const passengerArray = [passenger.passenger_name,passenger.passenger_id_type_code,passenger.passenger_id_no,1];
                    oldPassengerStr.push(passengerArray.join(','));
                })
                passengerTicketStr = passengerTicketStr.join("_");
                oldPassengerStr = oldPassengerStr.join("_")+"_";
            }
        })
        that.passengerTicketStr = passengerTicketStr;
        that.oldPassengerStr = oldPassengerStr;
        const param = {
            cancel_flag: 2,
            bed_level_order_num: '000000000000000000000000000000',
            passengerTicketStr:passengerTicketStr,
            oldPassengerStr: oldPassengerStr,
            tour_flag: 'dc',
            randCode: "",
            whatsSelect: 1,
            _json_att: "",
            REPEAT_SUBMIT_TOKEN:that.globalRepeatSubmitToken
        }


        request12306.post({
            id:that.orderInfo.orderId,
            url:URL12306.checkOrderInfoURL,
            data:param,
            callback:function (error, response, body) {               
                try{
                    if (error) throw new Error(error);
                    const resData = JSON.parse(body);
                    
                    if(resData.status&&resData.data.submitStatus)
                    {
                        console.log("订单："+that.orderInfo.orderId+"校验订单信息成功")
                        that.getQueueCount(seatType)
                    }else{
                        console.log("订单："+that.orderInfo.orderId+"校验订单信息失败")
                        console.log("错误是",resData);
                        if(_.isArray(resData.messages)){
                            console.log(resData.messages[0])
                            that.failHandle();
                        }else if(_.isObject(resData.data)&&!resData.data.checkSeatNum){
                            that.checkOrderInfo(passengerInfo);
                        }
                        
                    } 
                }catch(error){
                    console.log("订单："+that.orderInfo.orderId+"校验订单信息失败")
                    console.log("错误是",error);
                    that.failHandle();
                }
            }
        });
        console.log("订单："+that.orderInfo.orderId+"校验订单信息...")
    }
    //获取订单队列中现在的排队人数以及余票信息
    getQueueCount(seatType){
        let that = this;
        if(that.stop){
            return ;
        }
        const{ticketInfoForPassengerForm} = that;
        const{train_no,station_train_code,from_station,to_station,train_date} = ticketInfoForPassengerForm.queryLeftTicketRequestDTO;
        //train_date = train_date.slice(0,4)+'-'+train_date.slice(4,6)+"-"+train_date.slice(6,8)
        const param = {
            train_date:new Date(`${that.orderInfo.time} 00:00:00`).toString(),
            train_no:train_no,
            stationTrainCode:station_train_code,
            seatType:seatType,
            fromStationTelecode:from_station,
            toStationTelecode:to_station,
            leftTicket:ticketInfoForPassengerForm.leftTicketStr,
            purpose_codes:ticketInfoForPassengerForm.purpose_codes,
            train_location:ticketInfoForPassengerForm.train_location,
            isCheckOrderInfo:"",
            _json_att:"",
            REPEAT_SUBMIT_TOKEN:that.globalRepeatSubmitToken
        };

        request12306.post({
            id:that.orderInfo.orderId,
            url:URL12306.getQueueCountURL,
            data:param,
            callback:function (error, response, body) {               
                try{
                    if (error) throw new Error(error);
                    const data = JSON.parse(body);
                    if(data.status){
                        console.log("订单："+that.orderInfo.orderId+"获取队列信息成功，可以入队")
                        that.confirmSingleForQueue();
                    }else{
                        console.log("订单："+that.orderInfo.orderId+"获取队列信息成功，但不可以入队，重试中...")
                        console.log("错误是",data);
                        setTimeout(()=>{
                            that.getQueueCount(seatType);
                        },1000)
                    } 
                }catch(error){
                    console.log('获取队列信息失败');
                    console.log("错误是",error);
                    that.failHandle();
                }
            }
        });
        console.log("订单："+that.orderInfo.orderId+"获取队列信息...")
    }
    //提交单程票的订单进入订单队列
    confirmSingleForQueue(){

        let that = this;
        if(that.stop){
            return ;
        }
        const{ticketInfoForPassengerForm} = that;
        const{queryLeftTicketRequestDTO,key_check_isChange,leftTicketStr,purpose_codes,train_location} = ticketInfoForPassengerForm
        const{train_no,station_train_code,from_station,to_station,train_date,seat_types} = queryLeftTicketRequestDTO;
        const param = {
            passengerTicketStr: that.passengerTicketStr,
            oldPassengerStr: that.oldPassengerStr,
            randCode: "",
            purpose_codes: purpose_codes,
            key_check_isChange: key_check_isChange,
            leftTicketStr: leftTicketStr,
            train_location: train_location,
           // choose_seats: "1A1B1C",
            choose_seats: "",
            seatDetailType: "000",
            whatsSelect: '1',
            roomType: "00",
            _json_att: "",
            REPEAT_SUBMIT_TOKEN: that.globalRepeatSubmitToken
        };



        request12306.post({
            id:that.orderInfo.orderId,
            url:URL12306.confirmSingleForQueueURL,
            data:param,
            callback:function (error, response, body) {               
                try{
                    if (error) throw new Error(error);
                    const data = JSON.parse(body);
                    
                    if(data.status,data.data.submitStatus){
                        console.log("订单："+that.orderInfo.orderId+"提交订单入队成功")
                        that.queryOrderWaitTime();
                    }else{
                        console.log("订单："+that.orderInfo.orderId+"提交订单入队失败")
                        console.log(data.data);
                    }
                }catch(error){
                    console.log("订单："+that.orderInfo.orderId+"提交订单入队失败")
                    console.log("错误是",error);
                    that.failHandle();
                }
            }
        });
        console.log("订单："+that.orderInfo.orderId+"提交订单入队中...")

    }
    //轮询订单结果
    queryOrderWaitTime(){
        var that= this;
        const param = { 
            'random': new Date().getTime(),
            tourFlag: 'dc',
            _json_att: "",
            REPEAT_SUBMIT_TOKEN: that.globalRepeatSubmitToken 
        };

        request12306.get({
            id:that.orderInfo.orderId,
            url:URL12306.queryOrderWaitTimeURL,
            data:param,
            callback:function (error, response, body) {               
                try{
                    if (error) throw new Error(error);
                    const data = JSON.parse(body);
                    if(data.status&&data.data.orderId&&Number(data.data.waitTime)<0){
                        console.log("订单："+that.orderInfo.orderId+"订单队列结果获取成功");
                        //that.resultOrderForDcQueue(data.data.orderId);
                        that.queryMyOrderNoComplete();
                    }else{
                        console.log("订单："+that.orderInfo.orderId+"订单队列结果获取未成功，继续查询");
                        setTimeout(that.queryOrderWaitTime,8000);
                    }
                }catch(error){
                    console.log("错误是",error);
                    that.failHandle();
                }
            }
        });
        console.log("订单："+that.orderInfo.orderId+"轮询订单结果中...")

    }
    //确认下单是否成功
    resultOrderForDcQueue(orderId){
        let that = this;
        if(that.stop){
            return ;
        }
        const param = {
            orderSequence_no:orderId,
            '_json_att': "",
            'REPEAT_SUBMIT_TOKEN':that.globalRepeatSubmitToken
        } ;

        request12306.post({
            id:that.orderInfo.orderId,
            url:URL12306.resultOrderForDcQueueURL,
            data:param,
            callback:function (error, response, body) {               
                try{
                    if (error) throw new Error(error);
                    const data = JSON.parse(body);
    
                    if(data.status&&data.data.submitStatus){
                        console.log("订单："+that.orderInfo.orderId+"下单成功");
                        that.stop = true;
                    that.queryMyOrderNoComplete();
                    }else{
                        console.log("订单："+that.orderInfo.orderId+"下单失败，再次下单")
                        console.log("错误是",data.data);
                        that.confirmSingleForQueue();
                    }
                }catch(error){
                    console.log("订单："+that.orderInfo.orderId+"下单失败，再次下单")
                    console.log("错误是",error);
                    that.failHandle();
                }
            }
        });
        console.log("订单："+that.orderInfo.orderId+"正在查询订单是否成功...")

    }
    //获取订单详情
    queryMyOrderNoComplete(){
        let that = this;
        if(that.stop){
            return ;
        }
        const param = {'_json_att': ""} ;

        request12306.post({
            id:that.orderInfo.orderId,
            url:URL12306.queryMyOrderNoCompleteURL,
            data:param,
            callback:function (error, response, body) {               
                try{
                    if (error) throw new Error(error);
                    const data = JSON.parse(body);
                    if(data.status){
                        console.log("订单："+that.orderInfo.orderId+"获取订单详情成功")
                        const info = data.data.orderDBList[0];
                        const result = [{key:"订单号",value:info.sequence_no},
                        {key:"账号",value:that.orderInfo.username},{key:"密码",value:that.orderInfo.password},
                        {key:"订单总价",value:info.ticket_total_price_page},{key:"订单人数",value:info.ticket_totalnum},
                        {key:"车次",value:info.train_code_page},{key:"发车时间",value:info.start_train_date_page},
                        {key:"启点",value:info.from_station_name_page[0]},{key:"终点",value:info.to_station_name_page[0]},
                        {key:"乘客",value:info.tickets.map(item=>{return `${item.passengerDTO.passenger_name} ${item.coach_name}车 ${item.seat_name} ${item.seat_type_name} ${item.str_ticket_price_page}元`}).join('；')},
                        ,{key:"订单截止时间",value:info.tickets[0].pay_limit_time}
                        ]
                        result.forEach(item=>console.log(item.key+":"+item.value));
                        that.resolve(result);
                    }
                }catch(error){
                    console.log("订单："+that.orderInfo.orderId+"获取订单详情失败")
                    that.queryMyOrderNoComplete();
                }
            }
        });
        console.log("订单："+that.orderInfo.orderId+"获取订单详情...")
    }
    checkUser(){
        let that = this;
         const param = {'_json_att': ""} ;
         return new Promise((resolve,reject)=>{
            request12306.post({
                id:that.orderInfo.orderId,
                url:URL12306.checkUserURL,
                data:param,
                callback:function (error, response, body) {               
                    try{
                        if (error) throw new Error(error);
                        const data = JSON.parse(body);
                        if(data.status){
                            resolve(data.data.flag);
                        }
                    }catch(error){
                        
                    }
                }
            });
         });
    }
    //失败之后的通用处理方法
    failHandle(nextStep){
        let that = this;
        //失败之后先验证登录是否过期，如果登陆过期则返回重新登录，如果登录状态正常则
        this.checkUser().then(status=>{
            if(status){
                if(nextStep){
                    nextStep();
                }else{
                    setTimeout(() => {
                        that.init(); 
                    }, 1000);
                    
                }
                console.log("登录状态有效，重新下单");
                
            }else{
                console.log("登录状态失效，重新登录");
                that.reject({order:that.orderInfo});
            }
        })
    }
}




const orderFactory = (orderInfo,trainsInfo)=>{
    return new Promise((resolve,reject)=>{
        const orderObject = new Order(orderInfo,trainsInfo);
        orderObject.init(resolve,reject);
    })
    
}
module.exports = orderFactory;
//str.match(/globalRepeatSubmitToken = '(\S*)';/)[1]