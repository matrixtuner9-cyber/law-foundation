import 'package:local_auth/local_auth.dart';

final _auth = LocalAuthentication();

/// هل يدعم الجهاز البصمة أو قفل الشاشة؟
Future<bool> bioAvailable() async {
  try {
    return await _auth.isDeviceSupported();
  } catch (_) {
    return false;
  }
}

/// يطلب البصمة (أو رمز قفل الهاتف إن لم تتوفر البصمة)
Future<bool> bioAuth(String reason) async {
  try {
    return await _auth.authenticate(
      localizedReason: reason,
      options: const AuthenticationOptions(biometricOnly: false, stickyAuth: true),
    );
  } catch (_) {
    return false;
  }
}
