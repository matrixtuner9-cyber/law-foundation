import Flutter
import UIKit
import UserNotifications

@main
@objc class AppDelegate: FlutterAppDelegate, FlutterImplicitEngineDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  func didInitializeImplicitFlutterEngine(_ engineBridge: FlutterImplicitEngineBridge) {
    GeneratedPluginRegistrant.register(with: engineBridge.pluginRegistry)
    if let r = engineBridge.pluginRegistry.registrar(forPlugin: "MithaqPush") {
      MithaqPush.register(with: r)
    }
  }
}

/// إشعارات ميثاق على الآيفون: يطلب الإذن ويعيد رمز الجهاز (APNs) لتطبيق Flutter عبر القناة mithaq/push
final class MithaqPush: NSObject, FlutterPlugin {
  private var waiting: [FlutterResult] = []

  static func register(with registrar: FlutterPluginRegistrar) {
    let channel = FlutterMethodChannel(name: "mithaq/push", binaryMessenger: registrar.messenger())
    let me = MithaqPush()
    registrar.addMethodCallDelegate(me, channel: channel)
    registrar.addApplicationDelegate(me)
  }

  func handle(_ call: FlutterMethodCall, result: @escaping FlutterResult) {
    switch call.method {
    case "status":
      UNUserNotificationCenter.current().getNotificationSettings { s in
        let v: String
        switch s.authorizationStatus {
        case .authorized, .provisional, .ephemeral: v = "granted"
        case .denied: v = "denied"
        default: v = "default"
        }
        DispatchQueue.main.async { result(v) }
      }
    case "enable":
      UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { ok, _ in
        DispatchQueue.main.async {
          if !ok { result(["status": "denied"]); return }
          self.waiting.append(result)
          UIApplication.shared.registerForRemoteNotifications()
          // إن لم يرد iOS خلال 20 ثانية (لا إنترنت مثلاً) نعيد خطأ بدل الانتظار للأبد
          DispatchQueue.main.asyncAfter(deadline: .now() + 20) { self.finish(["status": "error", "error": "timeout"]) }
        }
      }
    case "clearBadge":
      UIApplication.shared.applicationIconBadgeNumber = 0
      result(nil)
    default:
      result(FlutterMethodNotImplemented)
    }
  }

  func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    finish(["status": "granted", "token": deviceToken.map { String(format: "%02x", $0) }.joined()])
  }

  func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
    finish(["status": "error", "error": error.localizedDescription])
  }

  private func finish(_ v: [String: String]) {
    let w = waiting
    waiting = []
    w.forEach { $0(v) }
  }
}
