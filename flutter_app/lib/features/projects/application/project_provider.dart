import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/di/service_locator.dart';
import '../domain/models/project_model.dart';
import 'project_service.dart';

class ProjectState {
  final List<ProjectModel> projects;
  final bool isLoading;
  final String? error;

  ProjectState({
    required this.projects,
    this.isLoading = false,
    this.error,
  });

  ProjectState copyWith({
    List<ProjectModel>? projects,
    bool? isLoading,
    String? error,
  }) {
    return ProjectState(
      projects: projects ?? this.projects,
      isLoading: isLoading ?? this.isLoading,
      error: error ?? this.error,
    );
  }
}

class ProjectNotifier extends StateNotifier<ProjectState> {
  final ProjectService _service;

  ProjectNotifier(this._service) : super(ProjectState(projects: []));

  Future<void> loadProjects({String? status, String? search}) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final projects =
          await _service.getProjects(status: status, search: search);
      state = state.copyWith(projects: projects, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> deleteProject(String id) async {
    try {
      await _service.deleteProject(id);
      state = state.copyWith(
        projects: state.projects.where((p) => p.id != id).toList(),
      );
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  Future<void> createProject(Map<String, dynamic> data) async {
    await _service.createProject(data);
    await loadProjects();
  }
}

final projectProvider =
    StateNotifierProvider<ProjectNotifier, ProjectState>((ref) {
  return ProjectNotifier(locator<ProjectService>());
});
