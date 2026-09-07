import UIKit

/// Renders one bundle. The URL comes from the home screen, never from here.
class CardViewController: UIViewController {
  private let url: String

  init(url: String) {
    self.url = url
    super.init(nibName: nil, bundle: nil)
  }

  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  override func loadView() {
    let size = UIScreen.main.bounds.size

    let lynxView = LynxView { builder in
#if DEBUG
      builder.enableGenericResourceFetcher = .true
      builder.genericResourceFetcher = GenericResourceFetcher()
#endif
      builder.screenSize = size
      builder.fontScale = 1.0
      // builder.config?.registerUI(LynxColorBoxComponent.self, withName: "color-box-view")
    }

    lynxView.preferredLayoutWidth = size.width
    lynxView.preferredLayoutHeight = size.height
    lynxView.layoutWidthMode = .exact
    lynxView.layoutHeightMode = .exact

    // Without this a failed load is a black screen, which reads as a crash.
    lynxView.backgroundColor = .systemBackground

    view = lynxView
    lynxView.loadTemplate(fromURL: url, initData: nil)
  }
}
