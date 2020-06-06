import frida
import sys

jscode = """
Java.perform(function(){
    Interceptor.attach(Module.findExportByName("libfridaso.so","Java_com_example_fridasostring_fridaSoString_FridaSo"),{
        onEnter: function(args) {
            send("Hook start");
            var str = Java.use("java.lang.String");
            var s=Java.cast(args[2],str);
            send("args[2]=" + s);
        },
        onLeave: function(retval){
            send("return:"+retval);
            var env = Java.vm.getEnv();
            var jstrings = env.newStringUtf("tamper");
            retval.replace(jstrings);
        }
    });
});
"""
def printMessage(message,data):
    if message['type'] == 'send':
        print('[*] {0}'.format(message['payload']))
    else:
        print(message)

process = frida.get_remote_device().attach('com.example.fridasostring')
script = process.create_script(jscode)
script.on('message',printMessage)
script.load()
sys.stdin.read()