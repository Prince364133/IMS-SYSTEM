import '../../../core/network/api_service.dart';
import '../../../shared/services/cache_service.dart';
import '../domain/models/task_model.dart';
import 'dart:convert';

class TaskService {
  final ApiService _api;
  final CacheService _cache;

  static const String _tasksCacheKey = 'tasks_list';

  TaskService(this._api, this._cache);

  Future<List<TaskModel>> getTasks({String? projectId, String? status}) async {
    final params = <String>[];
    if (projectId != null && projectId.isNotEmpty)
      params.add('projectId=$projectId');
    if (status != null && status.isNotEmpty) params.add('status=$status');

    final queryString = params.isEmpty ? '' : '?${params.join('&')}';

    try {
      final response = await _api.get('/tasks$queryString');
      final List raw = response['tasks'] ?? [];

      // Cache the result for the specific project if possible
      if (projectId != null && status == null) {
        await _cache.put('${_tasksCacheKey}_$projectId', jsonEncode(raw));
      }

      return raw.map((e) => TaskModel.fromJson(e)).toList();
    } catch (e) {
      // Offline fallback
      if (projectId != null) {
        final cachedData = _cache.get('${_tasksCacheKey}_$projectId');
        if (cachedData != null) {
          final List raw = jsonDecode(cachedData);
          return raw.map((e) => TaskModel.fromJson(e)).toList();
        }
      }
      rethrow;
    }
  }

  Future<TaskModel> getTask(String id) async {
    final response = await _api.get('/tasks/$id');
    return TaskModel.fromJson(response);
  }

  Future<TaskModel> createTask(Map<String, dynamic> data) async {
    final response = await _api.post('/tasks', data);
    return TaskModel.fromJson(response);
  }

  Future<TaskModel> updateTask(String id, Map<String, dynamic> data) async {
    final response = await _api.put('/tasks/$id', data);
    return TaskModel.fromJson(response);
  }

  Future<void> deleteTask(String id) async {
    await _api.delete('/tasks/$id');
  }
}
