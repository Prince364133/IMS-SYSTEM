import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_service.dart';

const String _kToken    = 'auth_token';
const String _kUserJson = 'auth_user_json';

class AuthService extends ChangeNotifier {
  final SharedPreferences _prefs;
  final ApiService _api = ApiService();

  UserModel? _currentUser;
  bool       _isLoading = false;

  AuthService(this._prefs) {
    _loadFromStorage();
  }

  UserModel? get currentUser => _currentUser;
  bool       get isLoggedIn  => _currentUser != null;
  bool       get isLoading   => _isLoading;

  // ─── Restore session from local storage ────────────────────────────────
  void _loadFromStorage() {
    final token    = _prefs.getString(_kToken);
    final userJson = _prefs.getString(_kUserJson);
    if (token != null && userJson != null) {
      _api.setToken(token);
      _currentUser = UserModel.fromJson(jsonDecode(userJson));
      notifyListeners();
    }
  }

  // ─── Login ─────────────────────────────────────────────────────────────
  Future<void> login(String email, String password) async {
    _isLoading = true;
    notifyListeners();
    try {
      final data = await _api.post('/auth/login', {
        'email':    email,
        'password': password,
      });
      final token = data['token'] as String;
      _currentUser = UserModel.fromJson(data['user']);
      _api.setToken(token);
      await _prefs.setString(_kToken,    token);
      await _prefs.setString(_kUserJson, jsonEncode(data['user']));
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // ─── Register ──────────────────────────────────────────────────────────
  Future<void> register({
    required String name,
    required String email,
    required String password,
    String role = 'employee',
  }) async {
    _isLoading = true;
    notifyListeners();
    try {
      final data = await _api.post('/auth/register', {
        'name':     name,
        'email':    email,
        'password': password,
        'role':     role,
      });
      final token = data['token'] as String;
      _currentUser = UserModel.fromJson(data['user']);
      _api.setToken(token);
      await _prefs.setString(_kToken,    token);
      await _prefs.setString(_kUserJson, jsonEncode(data['user']));
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // ─── Logout ────────────────────────────────────────────────────────────
  Future<void> logout() async {
    _currentUser = null;
    _api.clearToken();
    await _prefs.remove(_kToken);
    await _prefs.remove(_kUserJson);
    notifyListeners();
  }

  // ─── Update local user cache ─────────────────────────────────────────
  void updateUser(UserModel user) {
    _currentUser = user;
    _prefs.setString(_kUserJson, jsonEncode(user.toJson()));
    notifyListeners();
  }
}

// ─── User Model ──────────────────────────────────────────────────────────────
class UserModel {
  final String id;
  final String name;
  final String email;
  final String role;
  final String photoUrl;
  final String phone;
  final String department;
  final String position;

  const UserModel({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.photoUrl  = '',
    this.phone     = '',
    this.department = '',
    this.position  = '',
  });

  factory UserModel.fromJson(Map<String, dynamic> json) => UserModel(
    id:         json['id']         ?? json['_id'] ?? '',
    name:       json['name']       ?? '',
    email:      json['email']      ?? '',
    role:       json['role']       ?? 'employee',
    photoUrl:   json['photoUrl']   ?? '',
    phone:      json['phone']      ?? '',
    department: json['department'] ?? '',
    position:   json['position']   ?? '',
  );

  Map<String, dynamic> toJson() => {
    'id':         id,
    'name':       name,
    'email':      email,
    'role':       role,
    'photoUrl':   photoUrl,
    'phone':      phone,
    'department': department,
    'position':   position,
  };
}
