import UIKit

/// Where a bundle URL comes from, so none of them are baked into the sources.
/// Mirrors the Android home screen.
class HomeViewController: UIViewController, UITableViewDataSource, UITableViewDelegate {
  private let input = UITextField()
  private let table = UITableView()
  private var history: [String] = UserDefaults.standard.stringArray(forKey: historyKey) ?? []

  override func viewDidLoad() {
    super.viewDidLoad()

    title = "LynxScreens"
    view.backgroundColor = .systemBackground

    input.placeholder = "http://192.168.x.x:3000/main.lynx.bundle?fullscreen=true"
    input.borderStyle = .roundedRect
    input.autocapitalizationType = .none
    input.autocorrectionType = .no
    input.keyboardType = .URL
    input.text = history.first
    input.returnKeyType = .go
    input.addTarget(self, action: #selector(open), for: .editingDidEndOnExit)

    let openButton = UIButton(type: .system)
    openButton.setTitle("Open", for: .normal)
    openButton.addTarget(self, action: #selector(open), for: .touchUpInside)

    let scanButton = UIButton(type: .system)
    scanButton.setTitle("Scan", for: .normal)
    scanButton.addTarget(self, action: #selector(scan), for: .touchUpInside)

    let buttons = UIStackView(arrangedSubviews: [openButton, scanButton])
    buttons.distribution = .fillEqually
    buttons.spacing = 12

    let recent = UILabel()
    recent.text = "Recent"
    recent.font = .preferredFont(forTextStyle: .headline)

    table.dataSource = self
    table.delegate = self

    let stack = UIStackView(arrangedSubviews: [input, buttons, recent, table])
    stack.axis = .vertical
    stack.spacing = 16
    stack.translatesAutoresizingMaskIntoConstraints = false
    view.addSubview(stack)

    let guide = view.safeAreaLayoutGuide
    NSLayoutConstraint.activate([
      stack.topAnchor.constraint(equalTo: guide.topAnchor, constant: 20),
      stack.leadingAnchor.constraint(equalTo: guide.leadingAnchor, constant: 20),
      stack.trailingAnchor.constraint(equalTo: guide.trailingAnchor, constant: -20),
      stack.bottomAnchor.constraint(equalTo: guide.bottomAnchor, constant: -20),
    ])
  }

  @objc private func open() {
    show(input.text ?? "")
  }

  @objc private func scan() {
    navigationController?.pushViewController(
      ScanViewController { [weak self] url in
        self?.input.text = url
        self?.show(url)
      },
      animated: true
    )
  }

  private func show(_ url: String) {
    let trimmed = url.trimmingCharacters(in: .whitespacesAndNewlines)

    guard !trimmed.isEmpty else { return }

    remember(trimmed)
    navigationController?.pushViewController(CardViewController(url: trimmed), animated: true)
  }

  private func remember(_ url: String) {
    history = Array(([url] + history.filter { $0 != url }).prefix(historyLimit))
    UserDefaults.standard.set(history, forKey: historyKey)
    table.reloadData()
  }

  func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
    history.count
  }

  func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
    let cell = UITableViewCell(style: .default, reuseIdentifier: nil)
    cell.textLabel?.text = history[indexPath.row]
    cell.textLabel?.font = .preferredFont(forTextStyle: .footnote)
    cell.textLabel?.numberOfLines = 2
    return cell
  }

  func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
    tableView.deselectRow(at: indexPath, animated: true)
    show(history[indexPath.row])
  }

}

let historyKey = "home.history"
private let historyLimit = 10
