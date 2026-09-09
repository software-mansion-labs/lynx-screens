import AVFoundation
import UIKit

/// Reads a QR code and hands the text back. AVFoundation covers this, so no
/// scanning library is needed - the same approach LynxExplorer takes.
class ScanViewController: UIViewController, AVCaptureMetadataOutputObjectsDelegate {
  private let session = AVCaptureSession()
  private let onResult: (String) -> Void
  private let message = UILabel()

  init(onResult: @escaping (String) -> Void) {
    self.onResult = onResult
    super.init(nibName: nil, bundle: nil)
  }

  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  override func viewDidLoad() {
    super.viewDidLoad()
    view.backgroundColor = .black
    title = "Scan"

    message.textColor = .white
    message.textAlignment = .center
    message.numberOfLines = 0
    message.translatesAutoresizingMaskIntoConstraints = false
    view.addSubview(message)

    NSLayoutConstraint.activate([
      message.centerYAnchor.constraint(equalTo: view.centerYAnchor),
      message.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 32),
      message.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -32),
    ])

    // The simulator has no camera: the session builds but fails to start, which
    // otherwise just leaves a black screen.
    NotificationCenter.default.addObserver(
      forName: AVCaptureSession.runtimeErrorNotification,
      object: session,
      queue: .main
    ) { [weak self] _ in
      self?.show("The camera is not available here. QR scanning needs a device.")
    }

    AVCaptureDevice.requestAccess(for: .video) { [weak self] granted in
      DispatchQueue.main.async {
        guard granted else {
          self?.show("Camera access was denied.")
          return
        }
        self?.start()
      }
    }
  }

  private func start() {
    guard let device = AVCaptureDevice.default(for: .video),
          let input = try? AVCaptureDeviceInput(device: device),
          session.canAddInput(input)
    else {
      show("No camera to scan with.")
      return
    }

    session.addInput(input)

    let output = AVCaptureMetadataOutput()

    guard session.canAddOutput(output) else {
      show("No camera to scan with.")
      return
    }

    session.addOutput(output)
    output.setMetadataObjectsDelegate(self, queue: .main)
    output.metadataObjectTypes = [.qr]

    let preview = AVCaptureVideoPreviewLayer(session: session)
    preview.frame = view.layer.bounds
    preview.videoGravity = .resizeAspectFill
    view.layer.insertSublayer(preview, at: 0)

    // startRunning blocks, and the docs say to keep it off the main thread.
    DispatchQueue.global(qos: .userInitiated).async { [session] in session.startRunning() }
  }

  private func show(_ text: String) {
    message.text = text
  }

  override func viewDidDisappear(_ animated: Bool) {
    super.viewDidDisappear(animated)

    if session.isRunning {
      session.stopRunning()
    }
  }

  func metadataOutput(
    _ output: AVCaptureMetadataOutput,
    didOutput metadataObjects: [AVMetadataObject],
    from connection: AVCaptureConnection
  ) {
    guard let object = metadataObjects.first as? AVMetadataMachineReadableCodeObject,
          let text = object.stringValue
    else {
      return
    }

    session.stopRunning()
    navigationController?.popViewController(animated: true)
    onResult(text)
  }
}
