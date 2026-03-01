import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

const String _kToken = 'auth_token';
const String _kUser  = 'auth_user';

// ─── Switch between dev and prod ─────────────────────────────────────────────
const String kBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'http://10.0.2.2:5000/api', // Android emulator → localhost
);

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  String? _token;

  void setToken(String token) => _token = token;
  void clearToken()           => _token = null;

  Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    if (_token != null) 'Authorization': 'Bearer $_token',
  };

  // ── GET ──────────────────────────────────────────────────────────────────
  Future<Map<String, dynamic>> get(String endpoint) async {
    final res = await http.get(
      Uri.parse('$kBaseUrl$endpoint'),
      headers: _headers,
    );
    return _handle(res);
  }

  // ── POST ─────────────────────────────────────────────────────────────────
  Future<Map<String, dynamic>> post(String endpoint, Map<String, dynamic> body) async {
    final res = await http.post(
      Uri.parse('$kBaseUrl$endpoint'),
      headers: _headers,
      body:    jsonEncode(body),
    );
    return _handle(res);
  }

  // ── PUT ──────────────────────────────────────────────────────────────────
  Future<Map<String, dynamic>> put(String endpoint, Map<String, dynamic> body) async {
    final res = await http.put(
      Uri.parse('$kBaseUrl$endpoint'),
      headers: _headers,
      body:    jsonEncode(body),
    );
    return _handle(res);
  }

  // ── DELETE ───────────────────────────────────────────────────────────────
  Future<Map<String, dynamic>> delete(String endpoint) async {
    final res = await http.delete(
      Uri.parse('$kBaseUrl$endpoint'),
      headers: _headers,
    );
    return _handle(res);
  }

  Map<String, dynamic> _handle(http.Response res) {
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    if (res.statusCode >= 200 && res.statusCode < 300) return data;
    throw ApiException(
      message:    data['error'] ?? 'Unknown error',
      statusCode: res.statusCode,
    );
  }
}

// ─── Typed API Exception ─────────────────────────────────────────────────────
class ApiException implements Exception {
  final String message;
  final int    statusCode;
  ApiException({required this.message, required this.statusCode});

  @override
  String toString() => 'ApiException($statusCode): $message';
}
