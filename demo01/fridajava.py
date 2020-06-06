import frida
import sys

jscode = """
Java.perform(function(){
    var MainActivity = Java.use('com.example.testfrida.MainActivity');
    MainActivity.testFrida.implementation = function(){
        send('Statr! Hook!');
        return 'Change String!'
    }
});
"""

def printMessage(message,data):
    if message['type'] == 'send':
        print('[*] {0}'.format(message['payload']))
    else:
        print(message)

process = frida.get_remote_device().attach('com.example.testfrida')
script = process.create_script(jscode)
script.on('message',printMessage)
script.load()
sys.stdin.read()