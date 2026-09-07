import UIKit

/// Renders one bundle. The URL comes from the home screen, never from here.
class CardViewController: UIViewController {
  private let url: String
  private var lynxView: LynxView?

  init(url: String) {
    self.url = url
    super.init(nibName: nil, bundle: nil)
  }

  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  override func loadView() {
    // Without this a failed load is a black screen, which reads as a crash.
    let container = UIView()
    container.backgroundColor = .systemBackground
    view = container
  }

  override func viewDidLayoutSubviews() {
    super.viewDidLayoutSubviews()

    if let lynxView {
      resize(lynxView)
      return
    }

    // The window is only there once the view is in the hierarchy, and the
    // screen has to come from it: UIScreen.main is deprecated in iOS 26.
    guard let screen = view.window?.windowScene?.screen else { return }

    let lynxView = LynxView { builder in
#if DEBUG
      builder.enableGenericResourceFetcher = .true
      builder.genericResourceFetcher = GenericResourceFetcher()
#endif
      builder.screenSize = screen.bounds.size
      builder.fontScale = 1.0
      // builder.config?.registerUI(LynxColorBoxComponent.self, withName: "color-box-view")
    }

    lynxView.layoutWidthMode = .exact
    lynxView.layoutHeightMode = .exact

    self.lynxView = lynxView
    resize(lynxView)
    view.addSubview(lynxView)

    lynxView.loadTemplate(fromURL: url, initData: nil)
  }

  /// The card fills this view, which the navigation bar makes shorter than
  /// the screen, so its layout size is not the screen size.
  private func resize(_ lynxView: LynxView) {
    lynxView.frame = view.bounds
    lynxView.preferredLayoutWidth = view.bounds.width
    lynxView.preferredLayoutHeight = view.bounds.height
  }
}
