import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../services/auth_service.dart';
import '../../services/api_service.dart';
import '../../flutter_flow/flutter_flow_theme.dart';
import '../../widgets/nav_wrapper.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});
  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final _api = ApiService();
  Map<String, dynamic>? _stats;
  List<dynamic> _recentProjects = [];
  List<dynamic> _pendingTasks   = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final [projectsRes, tasksRes] = await Future.wait([
        _api.get('/projects?limit=5'),
        _api.get('/tasks?status=todo&limit=5'),
      ]);
      setState(() {
        _recentProjects = projectsRes['projects'] ?? [];
        _pendingTasks   = tasksRes['tasks']       ?? [];
        _stats = {
          'projects': projectsRes['total'] ?? 0,
          'tasks':    tasksRes['count']    ?? 0,
        };
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = FlutterFlowTheme.of(context);
    final user  = context.watch<AuthService>().currentUser;

    return NavWrapper(
      activeNav: 'home',
      child: Scaffold(
        backgroundColor: theme.primaryBackground,
        body: _loading
            ? const Center(child: CircularProgressIndicator())
            : RefreshIndicator(
                onRefresh: _load,
                child: ListView(
                  padding: const EdgeInsets.all(24),
                  children: [
                    // ── Header ─────────────────────────────────────────
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Welcome back,', style: theme.labelMedium),
                            Text(user?.name ?? 'User', style: theme.headlineMedium),
                          ],
                        ),
                        CircleAvatar(
                          radius:           24,
                          backgroundImage:  (user?.photoUrl.isNotEmpty == true)
                              ? NetworkImage(user!.photoUrl)
                              : null,
                          backgroundColor: theme.primary,
                          child: (user?.photoUrl.isEmpty != false)
                              ? Text(
                                  (user?.name.isNotEmpty == true)
                                      ? user!.name[0].toUpperCase()
                                      : 'U',
                                  style: const TextStyle(color: Colors.white, fontSize: 18),
                                )
                              : null,
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // ── Stats Row ──────────────────────────────────────
                    Row(
                      children: [
                        _statCard(theme, 'Projects', '${_stats?['projects'] ?? 0}',
                            Icons.grain_sharp, theme.primary),
                        const SizedBox(width: 12),
                        _statCard(theme, 'Open Tasks', '${_stats?['tasks'] ?? 0}',
                            Icons.check_circle_outline, theme.secondary),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // ── Recent Projects ────────────────────────────────
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Recent Projects', style: theme.titleMedium),
                        TextButton(
                          onPressed: () => context.go('/projects'),
                          child: const Text('See all'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    ..._recentProjects.map((p) => _projectCard(context, theme, p)),

                    const SizedBox(height: 24),
                    // ── Pending Tasks ──────────────────────────────────
                    Text('My Pending Tasks', style: theme.titleMedium),
                    const SizedBox(height: 8),
                    ..._pendingTasks.map((t) => _taskCard(theme, t)),
                  ],
                ),
              ),
        floatingActionButton: FloatingActionButton.extended(
          backgroundColor: theme.primary,
          onPressed:        () => context.go('/projects/new'),
          icon:             const Icon(Icons.add, color: Colors.white),
          label:            const Text('New Project', style: TextStyle(color: Colors.white)),
        ),
      ),
    );
  }

  Widget _statCard(FlutterFlowTheme theme, String label, String count,
      IconData icon, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color:        theme.secondaryBackground,
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 8),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding:      const EdgeInsets.all(10),
              decoration:   BoxDecoration(color: color.withOpacity(0.15), borderRadius: BorderRadius.circular(10)),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(count, style: theme.headlineSmall),
                Text(label, style: theme.labelMedium),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _projectCard(BuildContext context, FlutterFlowTheme theme, Map p) {
    return GestureDetector(
      onTap: () => context.go('/projects/${p['_id']}'),
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color:        theme.secondaryBackground,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Container(
              width: 8, height: 40,
              decoration: BoxDecoration(
                color:        theme.primary,
                borderRadius: BorderRadius.circular(4),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(p['name'] ?? '', style: theme.titleMedium),
                  Text(p['status'] ?? '', style: theme.labelMedium),
                ],
              ),
            ),
            Icon(Icons.chevron_right, color: theme.secondaryText),
          ],
        ),
      ),
    );
  }

  Widget _taskCard(FlutterFlowTheme theme, Map t) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color:        theme.secondaryBackground,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          Icon(Icons.radio_button_unchecked, color: theme.primary),
          const SizedBox(width: 12),
          Expanded(child: Text(t['title'] ?? '', style: theme.bodyMedium)),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color:        theme.accent1,
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(t['priority'] ?? '', style: TextStyle(color: theme.primary, fontSize: 11)),
          ),
        ],
      ),
    );
  }
}
