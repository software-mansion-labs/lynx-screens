# LYNX START
# use @Keep to annotate retained classes.
-dontwarn android.support.annotation.Keep
-keep @android.support.annotation.Keep class **
-keep @android.support.annotation.Keep class ** {
    @android.support.annotation.Keep <fields>;
    @android.support.annotation.Keep <methods>;
}
-dontwarn androidx.annotation.Keep
-keep @androidx.annotation.Keep class **
-keep @androidx.annotation.Keep class ** {
    @androidx.annotation.Keep <fields>;
    @androidx.annotation.Keep <methods>;
}
# native method call
-keepclasseswithmembers,includedescriptorclasses class * {
    native <methods>;
}
-keepclasseswithmembers class * {
    @com.lynx.tasm.base.CalledByNative <methods>;
}

# to customize a module, you need to keep the class name and the method annotated as LynxMethod.
-keepclasseswithmembers class * {
    @com.lynx.jsbridge.LynxMethod <methods>;
}

-keepclassmembers class *  {
    @com.lynx.tasm.behavior.LynxProp <methods>;
    @com.lynx.tasm.behavior.LynxPropGroup <methods>;
    @com.lynx.tasm.behavior.LynxUIMethod <methods>;
}

-keepclassmembers class com.lynx.tasm.behavior.ui.UIGroup {
    public boolean needCustomLayout();
}

# in case R8 compiler may remove mLoader in bytecode.
# as mLoader is not used in java and passed as a WeakRef in JNI.
-keepclassmembers class com.lynx.tasm.LynxTemplateRender {
    private com.lynx.tasm.core.resource.LynxResourceLoader mLoader;
    private com.lynx.tasm.core.resource.LynxResourceLoader mResourceLoader;
}

# the automatically generated setter classes use the class names of LynxBaseUI and ShadowNode and their subclasses.
-keep class com.lynx.tasm.behavior.ui.LynxBaseUI
-keep class com.lynx.tasm.behavior.shadow.ShadowNode
-keep class com.lynx.jsbridge.LynxModule { *; }
-keep class * extends com.lynx.tasm.behavior.ui.LynxBaseUI
-keep class * extends com.lynx.tasm.behavior.shadow.ShadowNode
-keep class * extends com.lynx.jsbridge.LynxModule { *; }
-keep class * extends com.lynx.jsbridge.LynxContextModule
-keep class * implements com.lynx.tasm.behavior.utils.Settable
-keep class * implements com.lynx.tasm.behavior.utils.LynxUISetter
-keep class * implements com.lynx.tasm.behavior.utils.LynxUIMethodInvoker
-keep class com.lynx.tasm.rendernode.compat.**{
    *;
}
-keep class com.lynx.tasm.rendernode.compat.RenderNodeFactory{
    *;
}
# LYNX END
