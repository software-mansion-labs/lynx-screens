import UIKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    let lynxEnv = LynxEnv.sharedInstance()
    let config = LynxConfig(provider: TemplateProvider())
    
    // Register new modules with:
    // config.register(YourModuleName.self)
    
    lynxEnv.prepareConfig(config)

    enableDevTool(lynxEnv)

    return true
  }

  private func enableDevTool(_ lynxEnv: LynxEnv) {
    let devTool = LynxServices.getInstanceWith(
      LynxServiceDevToolProtocol.self,
      bizID: DEFAULT_LYNX_SERVICE
    ) as? LynxServiceDevToolProtocol

    // Required for the DevTool desktop app to see this app at all.
    devTool?.enableAllSessions()
    devTool?.logBoxPresetValue = true

    lynxEnv.lynxDebugEnabled = true
    lynxEnv.devtoolEnabled = true
    lynxEnv.logBoxEnabled = true
  }
}
