import UIKit

/// xcrun simctl openurl booted "lynxscreens:///depth/3"
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = (scene as? UIWindowScene) else { return }

    let navigation = UINavigationController(rootViewController: HomeViewController())

    window = UIWindow(windowScene: windowScene)
    window?.rootViewController = navigation
    window?.makeKeyAndVisible()

    // A link carries a route, not a bundle, so it opens the one used last.
    if let route = Self.route(in: connectionOptions.urlContexts),
       let url = UserDefaults.standard.stringArray(forKey: historyKey)?.first {
      navigation.pushViewController(
        CardViewController(url: url, route: route),
        animated: false
      )
    }
  }

  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    guard let route = Self.route(in: URLContexts),
          let card = (window?.rootViewController as? UINavigationController)?
            .topViewController as? CardViewController
    else {
      return
    }

    card.deliver(route: route)
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
}
