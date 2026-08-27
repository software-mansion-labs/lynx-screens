import UIKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    let lynxEnv = LynxEnv.sharedInstance()
    let config = LynxConfig(provider: TemplateProvider())
    
    // Register new modules with:
    // config.register(YourModuleName.self)

    // cocoapods-lynx-library generates the registry from every linked Lynx
    // library, but nothing calls it - so ls-stack-host and friends were never
    // registered and the stack failed with LynxCreateUIException. Android gets
    // this for free through autolink.
    LynxGeneratedLibraryRegistry().setup(config)

    lynxEnv.prepareConfig(config)
    
    return true
  }
}
