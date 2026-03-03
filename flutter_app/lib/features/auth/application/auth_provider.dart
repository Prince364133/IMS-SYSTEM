import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../../core/di/service_locator.dart';
import '../../../core/network/api_service.dart';
import '../domain/models/user_model.dart';
import 'auth_service.dart';

class AuthState {
  final UserModel? user;
  final bool isLoading;
  final bool isInitialized;

  AuthState({
    this.user,
    this.isLoading = false,
    this.isInitialized = false,
  });

  AuthState copyWith({
    UserModel? user,
    bool? isLoading,
    bool? isInitialized,
    bool clearUser = false,
  }) {
    return AuthState(
      user: clearUser ? null : (user ?? this.user),
      isLoading: isLoading ?? this.isLoading,
      isInitialized: isInitialized ?? this.isInitialized,
    );
  }

  bool get isLoggedIn => user != null;
  UserModel? get currentUser => user;
}

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthService _authService = locator<AuthService>();

  AuthNotifier() : super(AuthState()) {
    _init();
  }

  Future<void> _init() async {
    final session = await _authService.getStoredSession();
    final token = session['token'];
    final userJson = session['userJson'];

    if (token != null && userJson != null) {
      final user = UserModel.fromJson(jsonDecode(userJson));
      locator.get<ApiService>().setToken(token);
      state = state.copyWith(user: user, isInitialized: true);
    } else {
      state = state.copyWith(isInitialized: true);
    }

    // Setup refresh callback
    locator.get<ApiService>().onRefreshToken = _authService.handleRefresh;
  }

  Future<void> login(String email, String password) async {
    state = state.copyWith(isLoading: true);
    try {
      final data = await _authService.login(email, password);

      final token = data['token'] as String;
      final refreshToken = data['refreshToken'] as String;
      final user = UserModel.fromJson(data['user']);

      await _authService.saveSession(token, refreshToken, user);
      state = state.copyWith(user: user, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false);
      rethrow;
    }
  }

  Future<void> register({
    required String name,
    required String email,
    required String password,
    String role = 'employee',
  }) async {
    state = state.copyWith(isLoading: true);
    try {
      final data = await _authService.register(
        name: name,
        email: email,
        password: password,
        role: role,
      );

      final token = data['token'] as String;
      final refreshToken = data['refreshToken'] as String;
      final user = UserModel.fromJson(data['user']);

      await _authService.saveSession(token, refreshToken, user);
      state = state.copyWith(user: user, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false);
      rethrow;
    }
  }

  Future<void> logout() async {
    await _authService.clearSession();
    state = state.copyWith(clearUser: true);
  }

  Future<void> updateUser(UserModel user) async {
    state = state.copyWith(user: user);
    // We don't have a direct save user method in service yet, but we can add or do it here
    final _storage = const FlutterSecureStorage();
    await _storage.write(
        key: AuthService.kUserJson, value: jsonEncode(user.toJson()));
  }
}

// ─── Provider ──────────────────────────────────────────────────────────────
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier();
});
