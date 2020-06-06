# -*- coding: utf-8 -*-
"""
Created on Thu Apr  9 18:52:27 2020

@author: ThinkPad
"""
import frida,sys
"""jscode=
Java.perform(function(){
        var utils=Java.use('com.example.fridatest.Utils');
        utils.getCalc.implementation=function(a,b){
                console.log("Hook Start...");
                send(arguments[0]);
                send(arguments[1]);

                return this.getCalc(100000,11);
               } 
        });

"""
#调用构造方法
"""
jscode=
Java.perform(function(){
        var money=Java.use('com.example.fridatest.Money');
        money.$init.implementation=function(a,b){
                console.log("Hook Start...");
                send(arguments[0]);
                send(arguments[1]);

                return this.$init(100000,"美元");
               } 
        });

"""
#调用重载方法
"""
jscode=
Java.perform(function(){
        var utils=Java.use('com.example.fridatest.Utils');
        utils.test.overload("int").implementation=function(a){
                console.log("Hook Start ...");
                send(arguments[0]);
                send("Success!");
                return "zzh"+arguments[0];
    }
});
"""

"""
jscode =
Java.perform(function(){
    var utils=Java.use('com.example.fridatest.Utils');
    var money=Java.use('com.example.fridatest.Money');
    utils.test.overload().implementation=function(){
        console.log("Hook Start...");
        var mon =money.$new(2000,'港币');
        return this.test(800);
    }        
});
"""
#修改对象属性
jscode="""
Java.perform(function(){
        var utils=Java.use('com.example.fridatest.Utils');
        var money=Java.use('com.example.fridatest.Money');
        var clazz=Java.use('java.lang.Class');
        utils.test.overload().implementation=function(){
                console.log("Hook Start ...");
                var mon=money.$new(200,'港币');
                send(mon.getInfo());
                var mumid=Java.cast(mon.getClass,clazz).getDeclaredFields('newi');
                numid.setAccessible(true);
                numid.setInt(mon,1000);
                send(mon.getInfo());
                return this.test(800);
    }
});
"""
def message(message,data):
    if message["type"]=='send':
        print("[*] {0}".format(message['payload']))
    else:
        print(message)
process=frida.get_remote_device().attach('com.example.fridatest')
script=process.create_script(jscode)
script.on("message",message)
script.load()
sys.stdin.read()
