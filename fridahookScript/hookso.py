# -*- coding: utf-8 -*-
"""
Created on Sat Apr 11 13:16:51 2020

@author: ThinkPad
"""
import frida,sys
jscode="""
setImmediate(function(){
    send("start");
    //遍历模块寻址
    Process.enumerateModules({
            onMatch:function(exp){
                if(exp.name=='libfridaso.so'){
                send('enumerateModules find');
                send(exp.name+"|"+exp.base+"|"+exp.size+"|"+exp.path);
                send(exp);
                return 'stop';
                
            }
        },
        onComplete:function(){
            send('enumerateModules stop');
        }
    });
    //hook导出函数
    var exports=Module.enumerateExportsSync('libfridaso.so')
    for(var i=0;i<exports.length;i++){
        send("name:"+exports[i].name+"  address:"+exports[i].address);
        
    }
    //通过模块名直接查找基地址
    var baseSOFile=Module.findBaseAddress("libfridaso.so");
    Interceptor.attach(baseSOFile.add(0x500),{
        onEnter:function(args){
             send("Hook start");
            send("args[2]=" + args[2]);
            send("args[3]=" + args[3]);
        },
        onLeave:function(retval){
            send("return:"+retval);
            retval.replace(100);
        }
    });
});
"""
def message(message,data):
    if message["type"]=='send':
        print("[*] {0}".format(message['payload']))
    else:
        print(message)
process=frida.get_remote_device().attach('com.example.fridaso')
script=process.create_script(jscode)
script.on("message",message)
script.load()
sys.stdin.read()