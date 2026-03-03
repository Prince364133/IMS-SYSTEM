import '../../../core/network/api_service.dart';
import '../../../shared/services/cache_service.dart';
import '../domain/models/project_model.dart';
import 'dart:convert';

class ProjectService {
  final ApiService _api;
  final CacheService _cache;

  static const String _projectsCacheKey = 'projects_list';

  ProjectService(this._api, this._cache);

  Future<List<ProjectModel>> getProjects(
      {String? status, String? search}) async {
    final params = <String>[];
    if (status != null && status.isNotEmpty) params.add('status=$status');
    if (search != null && search.isNotEmpty) params.add('search=$search');

    final queryString = params.isEmpty ? '' : '?${params.join('&')}';

    try {
      final response = await _api.get('/projects$queryString');
      final List raw = response['projects'] ?? [];

      // Cache the result (only if it's the full list or a common filter)
      if (queryString.isEmpty) {
        await _cache.put(_projectsCacheKey, jsonEncode(raw));
      }

      return raw.map((e) => ProjectModel.fromJson(e)).toList();
    } catch (e) {
      // Offline or error, try to return from cache
      final cachedData = _cache.get(_projectsCacheKey);
      if (cachedData != null) {
        final List raw = jsonDecode(cachedData);
        return raw.map((e) => ProjectModel.fromJson(e)).toList();
      }
      rethrow;
    }
  }

  Future<ProjectModel> getProject(String id) async {
    final response = await _api.get('/projects/$id');
    return ProjectModel.fromJson(response);
  }

  Future<ProjectModel> createProject(Map<String, dynamic> data) async {
    final response = await _api.post('/projects', data);
    return ProjectModel.fromJson(response);
  }

  Future<ProjectModel> updateProject(
      String id, Map<String, dynamic> data) async {
    final response = await _api.put('/projects/$id', data);
    return ProjectModel.fromJson(response);
  }

  Future<void> deleteProject(String id) async {
    await _api.delete('/projects/$id');
  }
}
