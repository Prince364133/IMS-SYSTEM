import 'package:http/http.dart' as http;
import 'dart:convert';

// ─── Switch between dev and prod ─────────────────────────────────────────────
const String kBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'http://127.0.0.1:5000/api', // localhost for web dev
);

class ApiService {
  ApiService();

  String? _token;
  Future<bool> Function()? onRefreshToken;

  void setToken(String token) => _token = token;
  void clearToken() => _token = null;

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (_token != null) 'Authorization': 'Bearer $_token',
      };

  Future<Map<String, dynamic>> _call(
      Future<http.Response> Function() fn) async {
    final res = await fn();
    if (res.statusCode == 401 && onRefreshToken != null) {
      final success = await onRefreshToken!();
      if (success) {
        // Retry with new token
        final retryRes = await fn();
        return _handle(retryRes);
      }
    }
    return _handle(res);
  }

  // ── GET ──────────────────────────────────────────────────────────────────
  Future<Map<String, dynamic>> get(String endpoint) async {
    return _call(() => http.get(
          Uri.parse('$kBaseUrl$endpoint'),
          headers: _headers,
        ));
  }

  // ── POST ─────────────────────────────────────────────────────────────────
  Future<Map<String, dynamic>> post(
      String endpoint, Map<String, dynamic> body) async {
    return _call(() => http.post(
          Uri.parse('$kBaseUrl$endpoint'),
          headers: _headers,
          body: jsonEncode(body),
        ));
  }

  // ── MULTIPART POST ───────────────────────────────────────────────────────
  Future<Map<String, dynamic>> postMultipart(
      String endpoint, List<int> bytes, String filename,
      {String field = 'file', Map<String, String>? fields}) async {
    final uri = Uri.parse('$kBaseUrl$endpoint');
    final request = http.MultipartRequest('POST', uri)
      ..headers.addAll({
        if (_token != null) 'Authorization': 'Bearer $_token',
      })
      ..files
          .add(http.MultipartFile.fromBytes(field, bytes, filename: filename));

    if (fields != null) request.fields.addAll(fields);

    final streamedRes = await request.send();
    final res = await http.Response.fromStream(streamedRes);
    return _handle(res);
  }

  // ── PUT ──────────────────────────────────────────────────────────────────
  Future<Map<String, dynamic>> put(
      String endpoint, Map<String, dynamic> body) async {
    return _call(() => http.put(
          Uri.parse('$kBaseUrl$endpoint'),
          headers: _headers,
          body: jsonEncode(body),
        ));
  }

  // ── DELETE ───────────────────────────────────────────────────────────────
  Future<Map<String, dynamic>> delete(String endpoint) async {
    return _call(() => http.delete(
          Uri.parse('$kBaseUrl$endpoint'),
          headers: _headers,
        ));
  }

  Map<String, dynamic> _handle(http.Response res) {
    // Some endpoints return empty 204 or non-JSON
    if (res.body.isEmpty && res.statusCode < 300) return {};

    final data = jsonDecode(res.body) as Map<String, dynamic>;
    if (res.statusCode >= 200 && res.statusCode < 300) return data;
    throw ApiException(
      message: data['detail'] ?? data['error'] ?? 'Unknown error',
      statusCode: res.statusCode,
    );
  }
}

// ─── Typed API Exception ─────────────────────────────────────────────────────
class ApiException implements Exception {
  final String message;
  final int statusCode;
  ApiException({required this.message, required this.statusCode});

  @override
  String toString() => 'ApiException($statusCode): $message';
}
