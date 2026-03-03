import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/di/service_locator.dart';
import '../domain/models/task_model.dart';
import 'task_service.dart';

class TaskState {
  final List<TaskModel> tasks;
  final bool isLoading;
  final String? error;

  TaskState({
    required this.tasks,
    this.isLoading = false,
    this.error,
  });

  TaskState copyWith({
    List<TaskModel>? tasks,
    bool? isLoading,
    String? error,
  }) {
    return TaskState(
      tasks: tasks ?? this.tasks,
      isLoading: isLoading ?? this.isLoading,
      error: error ?? this.error,
    );
  }
}

class TaskNotifier extends StateNotifier<TaskState> {
  final TaskService _service;

  TaskNotifier(this._service) : super(TaskState(tasks: []));

  Future<void> loadTasks({String? projectId, String? status}) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final tasks =
          await _service.getTasks(projectId: projectId, status: status);
      state = state.copyWith(tasks: tasks, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> updateTaskStatus(String id, String status) async {
    try {
      final updated = await _service.updateTask(id, {'status': status});
      state = state.copyWith(
        tasks: state.tasks.map((t) => t.id == id ? updated : t).toList(),
      );
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  Future<void> deleteTask(String id) async {
    try {
      await _service.deleteTask(id);
      state = state.copyWith(
        tasks: state.tasks.where((t) => t.id != id).toList(),
      );
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  Future<void> createTask(Map<String, dynamic> data) async {
    await _service.createTask(data);
    if (data['projectId'] != null) {
      await loadTasks(projectId: data['projectId']);
    }
  }
}

final taskProvider = StateNotifierProvider<TaskNotifier, TaskState>((ref) {
  return TaskNotifier(locator<TaskService>());
});
