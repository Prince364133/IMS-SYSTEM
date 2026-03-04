import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_service.dart';
import '../../../core/di/service_locator.dart';

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

  // ─── Convenience getters ─────────────────────────────────────────────────
  int get totalEmployees => stats['employees']?['total'] ?? 0;
  int get activeProjects => stats['projects']?['active'] ?? 0;
  int get totalProjects => stats['projects']?['total'] ?? 0;
  int get completedProjects => stats['projects']?['completed'] ?? 0;
  int get delayedProjects => stats['projects']?['delayed'] ?? 0;
  int get totalTasks => stats['tasks']?['total'] ?? 0;
  int get pendingTasksCount => stats['tasks']?['pending'] ?? 0;
  int get completedTasksCount => stats['tasks']?['completed'] ?? 0;
  int get presentToday => stats['attendance']?['present'] ?? 0;
  int get absentToday => stats['attendance']?['absent'] ?? 0;
  int get onLeaveToday => stats['attendance']?['on_leave'] ?? 0;
  double get attendancePct =>
      (stats['attendance']?['percentage'] ?? 0.0).toDouble();
}

class DashboardNotifier extends StateNotifier<DashboardState> {
  final ApiService _api;

  DashboardNotifier(this._api) : super(DashboardState()) {
    loadDashboard();
  }

  Future<void> loadDashboard() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      // Parallel fetch of all modules - each wrapped with catchError to be resilient
      final projectsRes = await _api
          .get('/projects?limit=20')
          .catchError((_) => <String, dynamic>{});
      final pendingTaskRes = await _api
          .get('/tasks?status=todo&limit=5')
          .catchError((_) => <String, dynamic>{});
      final usersRes = await _api
          .get('/users?limit=200')
          .catchError((_) => <String, dynamic>{});
      final allTasksRes = await _api
          .get('/tasks?limit=200')
          .catchError((_) => <String, dynamic>{});
      final attendanceRes = await _api
          .get('/attendance?limit=200')
          .catchError((_) => <String, dynamic>{});

      // Projects breakdown from list
      final allProjects = (projectsRes['projects'] as List?) ?? [];
      final allProjectsTotal = projectsRes['total'] ?? allProjects.length;
      final activeP = allProjects
          .where((p) => p['status'] == 'in_progress' || p['status'] == 'active')
          .length;
      final completedP =
          allProjects.where((p) => p['status'] == 'completed').length;
      final delayedP =
          allProjects.where((p) => p['status'] == 'on_hold').length;

      // Tasks breakdown
      final allTasks = (allTasksRes['tasks'] as List?) ?? [];
      final pendingT = allTasks
          .where((t) => t['status'] == 'todo' || t['status'] == 'in_progress')
          .length;
      final completedT = allTasks
          .where((t) => t['status'] == 'done' || t['status'] == 'completed')
          .length;

      // Employees
      final allUsers = (usersRes['users'] as List?) ?? [];
      final totalEmps = allUsers.where((u) => u['role'] != 'client').length;

      // Attendance today
      final attendList = (attendanceRes['attendance'] as List?) ?? [];
      final presentCount =
          attendList.where((a) => a['status'] == 'present').length;
      final absentCount =
          attendList.where((a) => a['status'] == 'absent').length;
      final onLeaveCount = attendList
          .where((a) => a['status'] == 'on_leave' || a['status'] == 'leave')
          .length;
      final attPct = totalEmps > 0
          ? (presentCount / totalEmps * 100).clamp(0.0, 100.0)
          : 0.0;

      // HRMS enrichment (optional)
      Map<String, dynamic> hrmsStats = {};
      try {
        hrmsStats = await _api.get('/hrms/dashboard');
      } catch (_) {}

      final stats = {
        'projects': {
          'total': allProjectsTotal,
          'active': hrmsStats['active_projects'] ?? activeP,
          'completed': completedP,
          'delayed': delayedP,
        },
        'tasks': {
          'total': allTasksRes['count'] ?? allTasks.length,
          'pending': pendingT,
          'completed': completedT,
          'overdue': 0,
        },
        'employees': {
          'total': hrmsStats['employees']?['total'] ?? totalEmps,
          'active': hrmsStats['employees']?['active'] ?? totalEmps,
        },
        'attendance': {
          'present':
              hrmsStats['attendance']?['breakdown']?['present'] ?? presentCount,
          'absent':
              hrmsStats['attendance']?['breakdown']?['absent'] ?? absentCount,
          'on_leave': onLeaveCount,
          'percentage': hrmsStats['attendance']?['percentage'] ?? attPct,
        },
        'hrms': hrmsStats,
      };

      state = state.copyWith(
        stats: stats,
        recentProjects: allProjects,
        pendingTasks: (pendingTaskRes['tasks'] as List?) ?? [],
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }
}

final dashboardProvider =
    StateNotifierProvider<DashboardNotifier, DashboardState>((ref) {
  return DashboardNotifier(locator<ApiService>());
});
