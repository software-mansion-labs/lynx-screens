import UIKit

/// xcrun simctl openurl booted "lynxscreens:///depth/3"
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?
  private var lynxView: LynxView?

  // Both match `@react-navigation/lynx`.
  private static let navigationKey = "__navigation"
  private static let urlEvent = "reactnavigation.url"

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = (scene as? UIWindowScene) else { return }

    window = UIWindow(windowScene: windowScene)

    let lynxView = LynxView { builder in
#if DEBUG
      builder.enableGenericResourceFetcher = .true
      builder.genericResourceFetcher = GenericResourceFetcher()
#endif
      builder.screenSize = windowScene.screen.bounds.size
      builder.fontScale = 1.0
      // builder.config?.registerUI(LynxColorBoxComponent.self, withName: "color-box-view")
    }

    self.lynxView = lynxView

    lynxView.preferredLayoutWidth = windowScene.screen.bounds.size.width
    lynxView.preferredLayoutHeight = windowScene.screen.bounds.size.height
    lynxView.layoutWidthMode = .exact
    lynxView.layoutHeightMode = .exact

    let rootViewController = UIViewController()
    window?.rootViewController = rootViewController
    rootViewController.view = lynxView

    let initData = Self.navigationData(for: Self.route(in: connectionOptions.urlContexts))

#if DEBUG
    lynxView.loadTemplate(
      fromURL: "http://localhost:3000/main.lynx.bundle?fullscreen=true",
      initData: initData
    )
#else
    lynxView.loadTemplate(fromURL: "main.lynx", initData: initData)
#endif

    window?.makeKeyAndVisible()
  }

  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    guard let route = Self.route(in: URLContexts) else { return }

    lynxView?.sendGlobalEvent(Self.urlEvent, withParams: [["url": route]])
  }

  private static func route(in contexts: Set<UIOpenURLContext>) -> String? {
    guard let url = contexts.first?.url else { return nil }

    // `lynxscreens://depth/3` parses `depth` as the host, while
    // `lynxscreens:///depth/3` puts all of it in the path.
    var path = url.path
    if let host = url.host, !host.isEmpty { path = "/\(host)\(path)" }
    if path.isEmpty { path = "/" }

    guard let query = url.query, !query.isEmpty else { return path }

    return "\(path)?\(query)"
  }

  private static func navigationData(for route: String?) -> LynxTemplateData? {
    guard let route else { return nil }

    // initData is state, not an event: the same route twice would leave it
    // untouched and be dropped.
    return LynxTemplateData(dictionary: [
      navigationKey: [
        "route": route,
        "nonce": Date().timeIntervalSince1970,
      ],
    ])
  }
}
