import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../../core/network/api_service.dart';
import '../domain/models/user_model.dart';

class AuthService {
  final ApiService _api;
  final _storage = const FlutterSecureStorage();

  static const String kToken = 'auth_token';
  static const String kRefreshToken = 'auth_refresh_token';
  static const String kUserJson = 'auth_user_json';

  AuthService(this._api);

  Future<Map<String, dynamic>> login(String email, String password) async {
    return await _api.post('/auth/login', {
      'email': email,
      'password': password,
    });
  }

  Future<Map<String, dynamic>> register({
    required String name,
    required String email,
    required String password,
    String role = 'employee',
  }) async {
    return await _api.post('/auth/register', {
      'name': name,
      'email': email,
      'password': password,
      'role': role,
    });
  }

  Future<bool> handleRefresh() async {
    final rt = await _storage.read(key: kRefreshToken);
    if (rt == null) return false;

    try {
      final data = await _api.post('/auth/refresh', {'refreshToken': rt});
      final newToken = data['token'] as String;
      final newRT = data['refreshToken'] as String;

      _api.setToken(newToken);
      await _storage.write(key: kToken, value: newToken);
      await _storage.write(key: kRefreshToken, value: newRT);
      return true;
    } catch (e) {
      await clearSession();
      return false;
    }
  }

  Future<void> saveSession(
      String token, String refreshToken, UserModel user) async {
    _api.setToken(token);
    await _storage.write(key: kToken, value: token);
    await _storage.write(key: kRefreshToken, value: refreshToken);
    await _storage.write(key: kUserJson, value: jsonEncode(user.toJson()));
  }

  Future<void> clearSession() async {
    _api.clearToken();
    await _storage.delete(key: kToken);
    await _storage.delete(key: kRefreshToken);
    await _storage.delete(key: kUserJson);
  }

  Future<Map<String, String?>> getStoredSession() async {
    return {
      'token': await _storage.read(key: kToken),
      'userJson': await _storage.read(key: kUserJson),
    };
  }
}
