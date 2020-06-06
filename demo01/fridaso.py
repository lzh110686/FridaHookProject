import frida
import sys

jscode = """
Java.perform(function(){
    Interceptor.attach(Module.findExportByName("libfridaso.so","Java_com_example_fridaso_FridaSoDefine_FridaSo"),{
    //函数执行前    
    onEnter: function(args) {
            send("Hook start");
            send("args[2]=" + args[2]);
            send("args[3]=" + args[3]);
        },
    //函数执行后
        onLeave: function(retval){
            //send("return:"+retval);
            //retval.replace(0);
        }
    });
});
"""
def printMessage(message,data):
    if message['type'] == 'send':
        print('[*] {0}'.format(message['payload']))
    else:
        print(message)

process = frida.get_remote_device().attach('com.example.fridaso')
script = process.create_script(jscode)
script.on('message',printMessage)
script.load()
sys.stdin.read()