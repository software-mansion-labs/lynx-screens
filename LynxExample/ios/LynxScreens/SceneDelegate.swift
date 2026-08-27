import UIKit

/// Also the reference for how a host hands a route to a card, mirroring
/// `DebugActivity` on Android.
///
/// React Navigation asks the platform two things: which route the card was
/// opened with, and how later ones arrive. A card is not the process receiving
/// the link - the host is - so the host has to pass it along:
///
///     xcrun simctl openurl booted "lynxscreens:///depth/3"
///     xcrun simctl launch booted com.example.LynxScreens -route /depth/3
///
/// The launch argument is there because opening a custom scheme from the
/// simulator raises a system confirmation prompt, which makes the URL route
/// awkward to drive from a script. It mirrors `-e route` on Android.
///
/// Cold start rides in on `initData`, which the card can read before any
/// listener exists, so there is no race to lose the launch route to. Later
/// routes go out as a global event carrying `{ url }`.
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?
  private var lynxView: LynxView?

  /// Matches `INIT_DATA_KEY` in `@react-navigation/lynx`.
  private static let navigationKey = "__navigation"

  /// Matches `URL_EVENT`. Namespaced because `GlobalEventEmitter` is one
  /// namespace shared with the host.
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

    let route = Self.route(in: connectionOptions.urlContexts) ?? Self.routeFromLaunchArguments()
    let initData = Self.navigationData(for: route)

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

  /// Reached when a link arrives while the card is already up.
  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    guard let route = Self.route(in: URLContexts) else { return }

    lynxView?.sendGlobalEvent(Self.urlEvent, withParams: [["url": route]])
  }

  /// The path the host was asked to open, e.g. `/depth/3` out of
  /// `lynxscreens:///depth/3`. Routes that start with `/` reach
  /// `getStateFromPath` without any prefix stripping.
  private static func route(in contexts: Set<UIOpenURLContext>) -> String? {
    guard let url = contexts.first?.url else { return nil }

    let path = url.path.isEmpty ? "/" : url.path

    guard let query = url.query, !query.isEmpty else { return path }

    return "\(path)?\(query)"
  }

  /// `-route /depth/3` on the command line, for driving a cold start from a
  /// script.
  private static func routeFromLaunchArguments() -> String? {
    let arguments = ProcessInfo.processInfo.arguments

    guard let flag = arguments.firstIndex(of: "-route"),
          arguments.indices.contains(flag + 1)
    else {
      return nil
    }

    return arguments[flag + 1]
  }

  private static func navigationData(for route: String?) -> LynxTemplateData? {
    guard let route else { return nil }

    // `initData` is state, not an event: without something that changes per
    // navigation, going to the same route twice would leave the value
    // untouched and be dropped.
    return LynxTemplateData(dictionary: [
      navigationKey: [
        "route": route,
        "nonce": Date().timeIntervalSince1970,
      ],
    ])
  }
}
