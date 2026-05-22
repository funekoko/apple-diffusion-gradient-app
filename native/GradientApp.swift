import Cocoa
import WebKit

@main
final class AppDelegate: NSObject, NSApplicationDelegate, WKScriptMessageHandler {
  private var window: NSWindow!
  private var webView: WKWebView!

  func applicationDidFinishLaunching(_ notification: Notification) {
    let controller = WKUserContentController()
    controller.add(self, name: "savePNG")
    controller.add(self, name: "copyCSS")

    let configuration = WKWebViewConfiguration()
    configuration.userContentController = controller

    webView = WKWebView(frame: .zero, configuration: configuration)
    webView.setValue(false, forKey: "drawsBackground")

    window = NSWindow(
      contentRect: NSRect(x: 0, y: 0, width: 1280, height: 760),
      styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView],
      backing: .buffered,
      defer: false
    )
    window.title = "弥散渐变生成器"
    window.center()
    window.minSize = NSSize(width: 980, height: 640)
    window.contentView = webView
    window.titlebarAppearsTransparent = true
    window.isMovableByWindowBackground = true
    window.makeKeyAndOrderFront(nil)

    NSApp.activate(ignoringOtherApps: true)
    loadLocalApp()
  }

  func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
    true
  }

  func userContentController(
    _ userContentController: WKUserContentController,
    didReceive message: WKScriptMessage
  ) {
    switch message.name {
    case "copyCSS":
      guard let css = message.body as? String else { return }
      NSPasteboard.general.clearContents()
      NSPasteboard.general.setString(css, forType: .string)
    case "savePNG":
      savePNG(message.body)
    default:
      break
    }
  }

  private func loadLocalApp() {
    guard let url = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "www") else {
      showError("找不到应用资源。")
      return
    }
    webView.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())
  }

  private func savePNG(_ body: Any) {
    guard
      let payload = body as? [String: Any],
      let filename = payload["filename"] as? String,
      let dataUrl = payload["dataUrl"] as? String,
      let comma = dataUrl.firstIndex(of: ","),
      let data = Data(base64Encoded: String(dataUrl[dataUrl.index(after: comma)...]))
    else {
      showError("PNG 数据无效。")
      return
    }

    let panel = NSSavePanel()
    panel.title = "保存渐变 PNG"
    panel.nameFieldStringValue = filename
    panel.allowedFileTypes = ["png"]
    panel.canCreateDirectories = true

    panel.beginSheetModal(for: window) { response in
      guard response == .OK, let url = panel.url else { return }
      do {
        try data.write(to: url, options: .atomic)
      } catch {
        self.showError("保存失败：\(error.localizedDescription)")
      }
    }
  }

  private func showError(_ message: String) {
    let alert = NSAlert()
    alert.messageText = message
    alert.alertStyle = .warning
    alert.runModal()
  }
}
