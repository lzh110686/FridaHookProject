package com.example.hookmain;

import android.content.Context;
import android.util.Log;
import android.view.ContextThemeWrapper;

import java.lang.reflect.Array;
import java.lang.reflect.Constructor;
import java.lang.reflect.Method;

import de.robv.android.xposed.IXposedHookLoadPackage;
import de.robv.android.xposed.XC_MethodHook;
import de.robv.android.xposed.XposedBridge;
import de.robv.android.xposed.XposedHelpers;
import de.robv.android.xposed.callbacks.XC_LoadPackage;

import static de.robv.android.xposed.XposedHelpers.callMethod;
import static de.robv.android.xposed.XposedHelpers.findAndHookConstructor;
import static de.robv.android.xposed.XposedHelpers.findAndHookMethod;
import static de.robv.android.xposed.XposedHelpers.findClass;
import static de.robv.android.xposed.XposedHelpers.getIntField;
import static de.robv.android.xposed.XposedHelpers.setIntField;
import static de.robv.android.xposed.XposedHelpers.setStaticObjectField;

public class HookMain implements IXposedHookLoadPackage {
    Context context;
    @Override
    public void handleLoadPackage(XC_LoadPackage.LoadPackageParam lpparam) throws Throwable {
        XposedBridge.log("HookMain begain");
        if (!lpparam.packageName.equals("com.example.goal")) {
            Log.i("失败", "未找到包");
            XposedBridge.log("未找到包" );
            return;
        }
        Log.i("begin","hook is begaining");
        //hook context  后面可使用Toast
        XposedHelpers.findAndHookMethod(ContextThemeWrapper.class, "attachBaseContext",Context.class, new XC_MethodHook() {
            @Override
            protected void beforeHookedMethod(MethodHookParam param) throws Throwable {
                context=(Context) param.args[0];
            }
        });

        final Class<?> clazz=findClass("com.example.goal.HookGoal",lpparam.classLoader);
        //hook 有参构造函数
        XposedHelpers.findAndHookConstructor(clazz,int.class,new XC_MethodHook() {
            @Override
            protected void beforeHookedMethod(MethodHookParam param) throws Throwable {
                //修改构造函数参数
                param.args[0]=666;

                //设置 TAG为hooking
                setStaticObjectField(clazz,"TAG","hooking");
            }
        });
        Class nminner=findClass("com.example.goal.HookGoal$1",clazz.getClassLoader());
        //hook 匿名内部类的eat()方法
        findAndHookMethod(nminner, "eat",String.class, new XC_MethodHook() {
            @Override
            protected void beforeHookedMethod(MethodHookParam param) throws Throwable {
                param.args[0]="is hooking";
                //修改匿名内部类的age属性
                Log.i("nminner","修改前age值："+getIntField(param.thisObject,"age"));
                setIntField(param.thisObject,"age",666);
                Log.i("nminner","修改后age值："+getIntField(param.thisObject,"age"));
            }
        });

        final Class diy=findClass("com.example.goal.DiyClass",lpparam.classLoader);
        final Constructor init=diy.getConstructor(int.class);

        findAndHookMethod(clazz, "func2",String.class, new XC_MethodHook() {
            @Override
            protected void beforeHookedMethod(MethodHookParam param) throws Throwable {
                //hook 静态方法参数
                param.args[0]="is hooking";

                //调用func0方法
                XposedHelpers.callMethod(clazz.getConstructor(int.class).newInstance(666),"func0");
                Log.i("hooking","way1 （静态方法中）创建新对象调用func0");

                //调用外部 DiyClass的getData()
                int data=(int)callMethod(init.newInstance(666),"getData");
                Log.i("hooking","调用DiyClass中getData() 返回值："+data);
            }
        });
        //hook 自定义类型数组参数
        Class diyClassArray= Array.newInstance(diy,3).getClass();
        findAndHookMethod(clazz, "func3", diyClassArray, new XC_MethodHook() {
            @Override
            protected void beforeHookedMethod(MethodHookParam param) throws Throwable {
                //调用func0方法
                XposedHelpers.callMethod(param.thisObject,"func0");
                Log.i("hooking","way2 （成员方法中）当前对象调用func0");

                //自定义类型数组
                Object a=Array.newInstance(diy,3);
                for(int i=0;i<3;i++)
                    Array.set(a,i,init.newInstance(666));
                param.args[0]=diyClassArray.cast(a);
                Log.i("func3",param.args[0].toString());
                Log.i("hooking","func3修改参数");
            }
        });
        Class inner=findClass("com.example.goal.HookGoal$InnerClass",clazz.getClassLoader());
        findAndHookConstructor(inner,clazz, String.class, new XC_MethodHook() {
            @Override
            protected void beforeHookedMethod(MethodHookParam param) throws Throwable {
                //修改内部类构造函数中的参数
                param.args[1]="is hooking";
                Log.i("inner Constructor",""+param.args[1]);
            }

            @Override
            protected void afterHookedMethod(MethodHookParam param) throws Throwable {
                //在内部类构造函数中修改innerNumber值
                Log.i("inner Constructor","修改前的innerNumber："+getIntField(param.thisObject,"innerNumber"));
               // Log.i("inner Constructor",""+param.thisObject);
                setIntField(param.thisObject,"innerNumber",6);
                Log.i("inner Constructor","修改后的innerNumber："+getIntField(param.thisObject,"innerNumber"));
            }
        });
        findAndHookMethod(inner, "innerFunc", String.class, new XC_MethodHook() {
            @Override
            protected void beforeHookedMethod(MethodHookParam param) throws Throwable {
                param.args[0]="is hooking";
                Log.i("innerFunc","修改前的innerNumber："+getIntField(param.thisObject,"innerNumber"));
                setIntField(param.thisObject,"innerNumber",666);
                Log.i("innerFunc","修改后的innerNumber："+getIntField(param.thisObject,"innerNumber"));
                Log.i("innerFunc",""+param.args[0]);
            }
        });
    }
}
