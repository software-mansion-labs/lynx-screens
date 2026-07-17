import UIKit

class ViewController: UIViewController {

  override func viewDidLoad() {
    super.viewDidLoad()

    let lynxView = LynxView { builder in
      builder.config = LynxConfig(provider: TemplateProvider())
#if DEBUG
      builder.enableGenericResourceFetcher = .true
      builder.genericResourceFetcher = GenericResourceFetcher()
#endif
      builder.screenSize = self.view.frame.size
      builder.fontScale = 1.0

      builder.config?.registerUI(RNSStackHostComponent.self, withName: "stack-host-native")
      builder.config?.registerUI(RNSStackScreenComponent.self, withName: "stack-screen-native")
    }

    lynxView.preferredLayoutWidth = self.view.frame.size.width
    lynxView.preferredLayoutHeight = self.view.frame.size.height
    lynxView.layoutWidthMode = .exact
    lynxView.layoutHeightMode = .exact

    self.view.addSubview(lynxView)

#if DEBUG
    lynxView.loadTemplate(
      fromURL: "http://localhost:3000/main.lynx.bundle?fullscreen=true",
      initData: nil
    )
#else
    lynxView.loadTemplate(fromURL: "main.lynx")
#endif
  }
}
