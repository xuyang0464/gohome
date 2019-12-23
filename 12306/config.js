const host12306 = 'https://kyfw.12306.cn/';
const hostBaiduApi = 'https://aip.baidubce.com/'
const orderInfo = [
     {
      orderId:'18810201713001',
      username:'18810201713',
      password:'xy8694467',
      start:'哈尔滨',
      end:'北京',
      time:'2020-01-21',
      trainNumber:["Z16"],
      seat:["软卧"],
      passenger:["徐洋","刘妍希","高晶","刘德祥"],
      hbDeadline:'2019-12-30#23#30'
    },
    // {
    //   orderId:'18810201735001',
    //   username:'18810201735',
    //   password:'xy861170',
    //   start:'哈尔滨',
    //   end:'北京',
    //   time:'2019-02-14',
    //   trainNumber:["Z18"],
    //   seat:['无座'],
    //   passenger:['徐洋',"李艺轩"]
    // },
    // {
    //   orderId:'18810201713001',
    //   username:'18810201713',
    //   password:'xy8694467',
    //   start:'北京',
    //   end:'上海',
    //   time:'2019-02-12',
    //   trainNumber:["G101","G103"],
    //   seat:["二等座"],
    //   passenger:["刘德祥"]
    // }
  ];
module.exports = {
    advanceBookingCycle:30,//预售周期，现在是30天
    orderInfo:orderInfo,
    rootPath:"./app/12306/",
    cachePath:'./app/12306/cache.json',
    imgPath:'./app/12306/imgPath/',
    baiduAPI:{
      client_id:'G2mGEq6NYh0XnPrmgSIPF6Y5',
      client_secret: 'ie7RI9KFuP6P7tC03UkLBn24bGs5c1uG'
    },
    access_token:"24.556943477b70bacd85807d4969336745.2592000.1552723502.282335-15558355",
    siteMap:{
        '软卧':'rw',
        '硬卧':'yw',
        '软座':'rz',
        '硬座':'yz',
        '一等座':'zy',
        '二等座':'ze',
        '商务座':'swz',
        '高级软卧':'gr',
        "无座":"wz",
        
    },
    siteCode:{
      '软卧':'4',
      '硬卧':'3',
      '软座':'2',
      '硬座':'1',
      '一等座':'M',
      '二等座':'O',
      '商务座':'9',
      '高级软卧':'6',
      "无座":"",
      
  },
    URL12306:{ 
        uamtkURL:host12306+ "/passport/web/auth/uamtk-static",
        getLoginBannerURL:host12306+'otn/index12306/getLoginBanner',
        confURL:host12306+'otn/login/conf',
        GetJSURL:host12306+'otn/HttpZF/GetJS',
        captchaImageURL:host12306+'passport/captcha/captcha-image64',
        captchaImageURL2:host12306+'otn/passcodeNew/getPassCodeNew',
        captchaCheckURL:host12306+'passport/captcha/captcha-check',
        loginURL:host12306+'passport/web/login',
        uamtkURL:host12306+'passport/web/auth/uamtk',
        uamauthclientURL:host12306+"otn/uamauthclient",
        getCheckURL:'http://60.205.200.159/api',
        getCheckUrlNew:"http://littlebigluo.qicp.net:47720/",
        imgCheckResultURL:"http://check.huochepiao.360.cn/img_vcode",
        submitOrderRequestURL:host12306+"otn/leftTicket/submitOrderRequest",
        initDcURL:host12306+"otn/confirmPassenger/initDc",
        getPassengerDTOsURL:host12306+"otn/confirmPassenger/getPassengerDTOs",
        checkOrderInfoURL:host12306+"otn/confirmPassenger/checkOrderInfo",
        getQueueCountURL:host12306+"otn/confirmPassenger/getQueueCount",
        confirmSingleForQueueURL:host12306+"otn/confirmPassenger/confirmSingleForQueue",
        queryOrderWaitTimeURL:host12306+"otn/confirmPassenger/queryOrderWaitTime",
        resultOrderForDcQueueURL:host12306+"otn/confirmPassenger/resultOrderForDcQueue",
        queryMyOrderNoCompleteURL:host12306+"otn/queryOrder/queryMyOrderNoComplete",
        queryURL:host12306+'otn/leftTicket/query',
        checkUserURL:host12306+"otn/login/checkUser",
        baiduApiOauthURL:hostBaiduApi+'oauth/2.0/token',
        baiduApiiMageClassify: "rest/2.0/image-classify/v2/advanced_general",
        confirmHB:host12306+'otn/afterNate/confirmHB',
        passengerInitApi:host12306+"otn/afterNate/passengerInitApi",
        getQueueNum:host12306+"otn/afterNate/getQueueNum",
      }
}