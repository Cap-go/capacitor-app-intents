package app.capgo.appintents;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "CapgoAppIntents")
public class CapgoAppIntentsPlugin extends Plugin {

    private static final String pluginVersion = "0.1.0";
    private static final String UNIMPLEMENTED =
        "CapgoAppIntents is only implemented on iOS. App Intents, Siri, Shortcuts, and Spotlight are not available on Android.";

    private void rejectUnimplemented(PluginCall call) {
        call.reject(UNIMPLEMENTED);
    }

    @PluginMethod
    public void getPendingInvocations(PluginCall call) {
        rejectUnimplemented(call);
    }

    @PluginMethod
    public void removePendingInvocation(PluginCall call) {
        rejectUnimplemented(call);
    }

    @PluginMethod
    public void setEntityCatalog(PluginCall call) {
        rejectUnimplemented(call);
    }

    @PluginMethod
    public void setShortcutDefinitions(PluginCall call) {
        rejectUnimplemented(call);
    }

    @PluginMethod
    public void refreshShortcuts(PluginCall call) {
        rejectUnimplemented(call);
    }

    @PluginMethod
    public void setHomeScreenShortcutItems(PluginCall call) {
        rejectUnimplemented(call);
    }

    @PluginMethod
    public void indexSpotlightEntities(PluginCall call) {
        rejectUnimplemented(call);
    }

    @PluginMethod
    public void removeSpotlightEntities(PluginCall call) {
        rejectUnimplemented(call);
    }

    @PluginMethod
    public void performAppleSchemaTemplate(PluginCall call) {
        rejectUnimplemented(call);
    }

    @PluginMethod
    public void getPluginVersion(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("version", pluginVersion);
        call.resolve(ret);
    }
}
