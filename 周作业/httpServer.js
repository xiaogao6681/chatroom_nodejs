/**
 * Created by hxsd on 2016/11/11.
 */
var http=require("http");
var path=require("path");
var express=require("express");

var app=express();

//链接静态资源
var staticpath=path.resolve(__dirname,"public");
app.use(express.static(staticpath));

var httpServer=http.createServer(app);//创建服务器
httpServer.listen(1212,function(){   //创建服务器监听事件
    console.log("服务器正运行在1212端口... http://localhost:1212")
});

var socketIO= require("socket.io");
var socketServer=socketIO.listen(httpServer);
socketServer.on("connect",function(socket){
    console.log("有用户链接")
    //2） 通过connect链接页面
    socket.on("message",function(data){

        var type=data.type;
        //2-1根据不同的消息类型来进行不同的处理
        switch (type){
            case "101":// 用户登录信息
                handleUserLogin(socket,data);
                break;
            case "201":// 用户群发消息内容
                handleUserChat(socket,data);
                break;
            case "300":// 用户群发消息内容
                leave(socket,data);
                break;
        };
    });



});
//2-2 处理101消息类型的方法-------------
var userinfo=[];//！！！设置一个空数组

function handleUserLogin(socket,data){
    //！！！将每一个用户对象登录的信息记录在里面。
    data.socketid=socket.id;//将新登陆的用户SOCKEDID存入用户数据中
    userinfo.push(data);//将数据存入到数组中
    data.length=userinfo.length;//统计登陆人数
    console.log("当前在线人数"+userinfo.length);

    //保存用户的昵称在socket对象中
    socket.nickname=data.nickname;
    socket.imageUrl=data.imageUrl;
    //构造一个群发消息的格式，并且发送给用户
    var content={
        type:"101",
        nickname:data.nickname,
        imageUrl:data.imageUrl,
        inLine:data.inLine,
        sex:data.sex,
        UserArr:userinfo//再把数组内容传给客户端
    };
    socket.broadcast.send(content);//发送给除了自己之外的所有的socket客户端，
    //给自己发送消息
    content.type="100";
    socket.send(content);//谁登录发给谁
};
//处理201消息类型的方法
function handleUserChat(socket,data){
    var allMSG={
        type:"201",
        sendMSG:data.sendMSG,
        nickname:socket.nickname,
        imageUrl:socket.imageUrl
    };//向所有用户发送该消息
    socket.broadcast.send(allMSG);
    allMSG.type="200";
    socket.send(allMSG);
};
//300 用户离开事件
function leave(socket,data){
    console.log("300用户离开的时候处理的方法86.："+JSON.stringify(userinfo))
    for(var i = 0;i<userinfo.length;i++){
        userinfo[i].type="300";//改变状态码
        if(userinfo[i].socketid==socket.id){
            userinfo.splice(i,1);
        };
    };
    var deletearr=userinfo;
    //把用户离开的消息群发
    var leavemsg={
        type:"300",
        nickname:socket.nickname,
        UserArr:deletearr//从数组中删除当前退出的这个用户之后的新数组
    };
    console.log("300 数组："+JSON.stringify(deletearr));
    console.log("300用户离开发送给用户的："+JSON.stringify(leavemsg));
    socket.broadcast.send(leavemsg);//发送给除了自己之外的所有的socket客户端，

};