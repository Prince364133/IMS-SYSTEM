import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_service.dart';

class DashboardState {
  final Map<String, dynamic> stats;
  final List<dynamic> recentProjects;
  final List<dynamic> pendingTasks;
  final bool isLoading;
  final String? error;

  DashboardState({
    this.stats = const {},
    this.recentProjects = const [],
    this.pendingTasks = const [],
    this.isLoading = true,
    this.error,
  });

  DashboardState copyWith({
    Map<String, dynamic>? stats,
    List<dynamic>? recentProjects,
    List<dynamic>? pendingTasks,
    bool? isLoading,
    String? error,
  }) {
    return DashboardState(
      stats: stats ?? this.stats,
      recentProjects: recentProjects ?? this.recentProjects,
      pendingTasks: pendingTasks ?? this.pendingTasks,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class DashboardNotifier extends StateNotifier<DashboardState> {
  final ApiService _api;

  DashboardNotifier(this._api) : super(DashboardState()) {
    loadDashboard();
  }

  Future<void> loadDashboard() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      // Fetch core data needed for all dashboards
      final [projectsRes, tasksRes] = await Future.wait([
        _api.get('/projects?limit=5'),
        _api.get('/tasks?status=todo&limit=5'),
      ]);

      Map<String, dynamic> stats = {
        'projects': projectsRes['total'] ?? 0,
        'tasks': tasksRes['count'] ?? 0,
      };

      // Try fetching HRMS data if user has access
      try {
        final hrmsRes = await _api.get('/hrms/dashboard');
        stats['hrms'] = hrmsRes;
      } catch (_) {
        // Fallback or ignore if not HR/Admin
      }

      state = state.copyWith(
        stats: stats,
        recentProjects: projectsRes['projects'] ?? [],
        pendingTasks: tasksRes['tasks'] ?? [],
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }
}

final dashboardProvider =
    StateNotifierProvider<DashboardNotifier, DashboardState>((ref) {
  final api =
      ApiService(); // Typically provided by another provider, but using direct for simplicity here
  return DashboardNotifier(api);
});
