setImmediate(function () {
    Java.perform(function () {
        console.log("start");
        //java层hook
        var hookgoal = Java.use("com.example.goal.HookGoal");
        var clazz = Java.use("java.lang.Class");
        var obj = Java.use("java.lang.Object");
        var Exception = Java.use("java.lang.Exception");
        var str = Java.use("java.lang.String");
        //hook 构造方法
        hookgoal.$init.overload("int").implementation = function (number) {
            send("HookGoal构造函数的参数number:" + number);
            send("HookGoal构造函数的参数修改为666");
            return this.$init(666);
        };

        //hook 静态变量TAG
        var reflectField = Java.cast(hookgoal.class, clazz).getDeclaredField("TAG");
        reflectField.setAccessible(true);
        reflectField.set("java.lang.String", "frida hooking");
        send("修改HookGoal的静态变量TAG为：frida hooking");


        //实例化对象way1
        var newhg = hookgoal.$new(0);
        send("new HookGoal instance newhg: " + newhg);
        // 实例化对象way2
        var newhg1 = hookgoal.$new.overload("int").call(hookgoal, 0);
        send("new HookGoal instance newhg1: " + newhg1);

        //hook匿名内部类，修改参数
        var nminner = Java.use("com.example.goal.HookGoal$1");
        nminner.eat.overload("java.lang.String").implementation = function (s) {
            var arg = arguments[0];
            send("eat参数获取 way1:" + arg);
            send("eat参数获取 way2:" + s);
            //修改参数
            return this.eat("is hooking");
        };
        var diy = Java.use("com.example.goal.DiyClass");
        hookgoal.func2.implementation = function (s) {
            //func2为静态方法
            var arg = arguments[0];
            send("func2()参数获取:" + s);
            //调用成员方法func0()在静态方法内只能通过创建的实例访问
            newhg.func0();
            send("func2()内调用func0()  通过创建实例newhg调用");
            newhg1.func0();
            send("func2()内调用func0()  通过创建实例newhg1调用");

            //修改实例的hookGoalNumber值，前面hook构造函数时已经将值改为666
            //修改字段值 通过反射得到字段，
            //var num1 = Java.cast(newhg1.getClass(), clazz).getDeclaredField("hookGoalNumber");
            var num1 = Java.cast(hookgoal.class, clazz).getDeclaredField("hookGoalNumber");
            num1.setAccessible(true);
            send("实例newhg1的hookGoalNumber:" + num1.get(newhg1));
            num1.setInt(newhg1, 777);
            send("修改实例newhg1的hookGoalNumber:" + num1.get(newhg1));

            send("实例newhg的hookGoalNumber:" + num1.get(newhg));

            // 反射调用方法
            var func = hookgoal.class.getDeclaredMethod("func0", null);
            send("func0:" + func);
            //var funcs = hookgoal.class.getDeclaredMethods();
            //for(var i=0;i<funcs.length;i++)
            //    send(""+i+" "+funcs[i]);

            //invoke(instance,args)调用成员方法
            func.invoke(newhg1, null);
            send("func2()内调用func0()  way2 通过反射调用");

            //调用DiyClass内的getData()
            var d = diy.$new(666);
            var x = d.getData();
            send("func2()内调用DiyClass下的getData() 通过创建实例d调用 返回：" + x);
            //修改func2的参数
            return this.func2("is hooking");
        };

        //修改func3参数
        hookgoal.func3.implementation = function (array) {
            //在成员方法func3内调用func0()
            this.func0();
            send("func3()内调用func0()  way2 成员方法中直接调用其他成员方法");
            //修改数组参数
            send("func3参数：" + array);
            var a = Java.array("com.example.goal.DiyClass", [diy.$new(111), diy.$new(222), diy.$new(333)]);
            send("func3参数修改：" + a);
            return this.func3(a);
        };

        var inner = Java.use("com.example.goal.HookGoal$InnerClass");
        //hook内部类
        inner.$init.overload("com.example.goal.HookGoal", "java.lang.String").implementation = function (clas, arg) {
            send("innerClass构造函数的参数:" + arg);
            return this.$init(clas, "frida is hooking");
        };
        //hook 内部类方法
        inner.innerFunc.implementation = function (s) {
            send("frida hook 前innerFunc()的参数：" + arguments[0]);
            var num = inner.class.getDeclaredField("innerNumber");
            num.setAccessible(true);

            //内部类成员方法中修改成员属性，way1 通过this.xxx.value 访问、修改
            send("通过this.innerNumber.value获取值:" + this.innerNumber.value);
            this.innerNumber.value = 1;
            send("通过this.innerNumber.value设置值后:" + this.innerNumber.value);
            //way2 先通过反射得到字段，
            send("反射方式 innerNumber修改前:" + num.get(this));
            num.setInt(this, 2);
            send("反射方式 innerNumber修改后:" + num.get(this));
            return this.innerFunc("frida is hooking");
        };


        //so层hook
        //导出函数
        //var exports = Module.enumerateExportsSync("libnative-lib.so");
        //for(var i=0;i<exports.length;i++){
        //    send("name:"+exports[i].name+"  address:"+exports[i].address);
        // }

        //遍历模块找基址
        Process.enumerateModules({
            onMatch: function (exp) {
                if (exp.name == 'libnative-lib.so') {
                    send('enumerateModules find');
                    send(exp.name + "|" + exp.base + "|" + exp.size + "|" + exp.path);
                    send(exp);
                    return 'stop';
                }
            },
            onComplete: function () {
                send('enumerateModules stop');
            }
        });

        //通过模块名直接查找基址
        var soAddr = Module.findBaseAddress("libnative-lib.so");
        send("soAddr:" + soAddr);


        //   hook导出函数 通过函数名
        send("findExportByName add():" + Module.findExportByName("libnative-lib.so", "_Z3addii"));
        //send("findExportByName edit():"+Module.findExportByName("libnative-lib.so", "_ZL4editP7_JNIEnvP8_jobjecti"))
        // Interceptor.attach(Module.findExportByName("xxx.so", "xxxx"), {
        //     onEnter: function (args) {
        //         send("open(" + Memory.readCString(args[0]) + "," + args[1] + ")");
        //     },
        //     onLeave: function (retval) {
        //
        //     }
        // });


        //say(JNIEnv *env, jobject)
        //edit(JNIEnv *env, jobject,int)
        //mystr(JNIEnv *env, jobject,jstring s)
        //myarray(JNIEnv *env, jobject obj, jobjectArray array)

        // arm64-v8a 下地址
        //var fadd = 0xED7C;
        //var fsay=0xF12C;
        //var fedit=0xF04C;
        //var fmystr=0xF328;
        //var fmyarray=0xF4DC;

        //下面为x86模拟器中地址偏移  arm真机下thumb指令下地址+1
        var fadd = 0x8AD0;
        var fsay = 0x8FA0;
        var fedit = 0x8E70;
        var fmystr = 0x9200;
        var fmyarray = 0x9420;

        //armeabi-v7a
        //var fadd = 0x839C;


        var faddptr = new NativePointer(soAddr).add(fadd);//得到内存地址
        send("函数add() faddptr:" + faddptr);
        //调用add（5，6）
        var funadd = new NativeFunction(faddptr, "int", ['int', 'int']);
        var t = funadd(5, 6);
        send("调用native 方法fun():" + t);
        Interceptor.attach(faddptr, {
            onEnter: function (args) {
                send("onEnter add()");
                x = args[0];
                y = args[1];
                args[0] = ptr(x * 2);
                args[1] = ptr(y * 2);
                send("hook add()修改参数为原来的两倍 args[0]:" + args[0].toInt32() + "  args[1]:" + args[1].toInt32());
            },
            onLeave: function (retval) {
                send("onLeave  add()");
                //retval.replace(678);
                //send("add()修改返回值为："+retval.toInt32())
            }

        });

        var fsayptr = new NativePointer(soAddr).add(fsay);
        Interceptor.attach(fsayptr, {
            onEnter: function (args) {
                send("onEnter say()");
            },
            onLeave: function (retval) {
                send("onLeave say()");
                var s = Java.cast(retval, str);
                send("say() 原返回值：" + s);
                var env = Java.vm.getEnv();
                var jstring = env.newStringUtf("frida hook native");
                retval.replace(ptr(jstring));
                send("修改say()返回值:" + Java.cast(jstring, str));
            }
        });


        var feditptr = new NativePointer(soAddr).add(fedit);
        Interceptor.attach(feditptr, {
            onEnter: function (args) {
                send("onEnter edit()");
                send("edit() env：" + args[0] + "  jobject：" + args[1] + " jint:" + args[2].toInt32());
                args[2] = ptr(4);
                send("hook edit() 修改后的参数jint：" + args[2]);
            },
            onLeave: function (retval) {
                send("onLeave edit()");
            }
        });

        var fmystrptr = new NativePointer(soAddr).add(fmystr);
        send("fmystrptr:" + fmystrptr);
        Interceptor.attach(fmystrptr, {
            onEnter: function (args) {
                send("onEnter mystr()");
                send("mystr() env：" + args[0] + "  jobject：" + args[1] + " jstring:" + args[2]);
                var s = Java.cast(args[2], str);
                send("mystr() jstring参数：" + s);

                //send("mystr："+Memory.readUtf16String(args[2],7));
                //send("mystr："+Memory.readUtf8String(args[2],7));
            },
            onLeave: function (retval) {
                send("onLeave mystr()");
                var env = Java.vm.getEnv();
                var jstring = env.newStringUtf("frida hook native");
                send("修改返回值jstring:" + jstring);
                retval.replace(ptr(jstring));
            }
        });
        // Java.choose("com.example.goal.DiyClass",{
        //     onMatch:function(instance){
        //         send("instance:"+instance);
        //     },
        //     onComplete:function(){
        //
        //     }
        //
        // });
        var fmyarrayptr = ptr(soAddr).add(fmyarray);
        //var fmyarrayptr = new NativePointer(soAddr).add(fmyarray);
        send("fmyarrayptr:" + fmyarrayptr);
        //var argptr;
        Interceptor.attach(fmyarrayptr, {
            onEnter: function (args) {
                send("onEnter myarray()");
                send("mystr() env：" + args[0] + "  jobject：" + args[1] + " jobjectArray:" + args[2]);
                send("jobjectArray参数：" + args[2].toString());
                //可以在onEnter中通过this.xxx保存变量 在onLeave中通过this.xxx读取
                this.argptr = args[2]

                //jstring 不同于wchar_t* (jchar*) 与 char*
                //send("mystr："+Memory.readUtf16String(args[2],7));
                //send("mystr："+Memory.readUtf8String(args[2],7));
            },
            onLeave: function (retval) {
                send("onLeave myarray()");
                send("argptr:" + this.argptr);

                var env = Java.vm.getEnv();
                var cla = env.findClass("com/example/goal/DiyClass");
                send("clazz:" + cla);
                var initid = env.getMethodId(cla, "<init>", "(I)V");
                send("initid:" + initid);
                var setid = env.getMethodId(cla, "setData", "(I)V");
                send("setid:" + setid);
                var getid = env.getMethodId(cla, "getData", "()I");
                send("getid:" + getid);
                //frida 中env 方法参考frida-java/lib/env.js  本人能力有限，有些方法确实搞不懂
                //调用env中的allocObject()方法创建对象，未初始化，
                var obj1 = env.allocObject(cla);
                send("obj1:" + obj1);

                var obj2 = env.allocObject(cla);
                send("obj2:" + obj2);

                var rtarray = env.newObjectArray(2, cla, ptr(0));
                send("env.newObjectArray:" + rtarray);

                //获取DiyClass类中public void setData(int data)方法
                var nvmethod = env.nonvirtualVaMethod("void", ["int"]);
                //NativeType CallNonvirtual<type>Method(JNIEnv *env, jobject obj,jclass clazz, jmethodID methodID, ...);
                //设置obj1中data值
                nvmethod(env, obj1, cla, setid, 11);
                //设置obj2中data值
                nvmethod(env, obj2, cla, setid, 22);
                send("env.nonvirtualVaMethod(JNIEnv,jobject,jclass,jmethodid,args):" + nvmethod);

                env.setObjectArrayElement(rtarray, 0, obj1);
                env.setObjectArrayElement(rtarray, 1, obj2);
                send("env.newObjectArray:" + rtarray);

                send("原retval:" + retval);
                retval.replace(ptr(rtarray));
                send("修改后retval:" + retval);

                // //堆中分配空间
                // var memo=Memory.alloc(4);
                // //写入数据
                // Memory.writeInt(memo,0x40302010);
                // // 读取数据
                // console.log(hexdump(memo, {
                //         offset: 0,
                //         length: 64,
                //         header: true,
                //         ansi: true
                // }));
            }
        });

    });
});