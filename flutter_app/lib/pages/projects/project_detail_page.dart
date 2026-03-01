import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../services/api_service.dart';
import '../../flutter_flow/flutter_flow_theme.dart';
import '../../flutter_flow/flutter_flow_widgets.dart';

class ProjectDetailPage extends StatefulWidget {
  final String projectId;
  const ProjectDetailPage({super.key, required this.projectId});

  @override
  State<ProjectDetailPage> createState() => _ProjectDetailPageState();
}

class _ProjectDetailPageState extends State<ProjectDetailPage> {
  final _api = ApiService();
  Map<String, dynamic>? _project;
  List<dynamic> _tasks = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final [projRes, taskRes] = await Future.wait([
        _api.get('/projects/${widget.projectId}'),
        _api.get('/tasks?projectId=${widget.projectId}'),
      ]);
      setState(() {
        _project = projRes['project'];
        _tasks   = taskRes['tasks'] ?? [];
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  Color _statusColor(String s) {
    switch (s) {
      case 'completed':   return Colors.green;
      case 'in_progress': return Colors.blue;
      case 'on_hold':     return Colors.orange;
      default:            return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = FlutterFlowTheme.of(context);
    if (_loading) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    if (_project == null) return Scaffold(body: Center(child: Text('Project not found', style: theme.bodyMedium)));

    return Scaffold(
      backgroundColor: theme.primaryBackground,
      appBar: AppBar(
        backgroundColor: theme.secondaryBackground,
        title:   Text(_project?['name'] ?? '', style: theme.titleMedium),
        leading: BackButton(onPressed: () => context.go('/projects')),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_outlined),
            onPressed: () => context.go('/add-description?docId=${widget.projectId}&docType=project'),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            // ── Status Badge ─────────────────────────────────────────
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color:        _statusColor(_project?['status'] ?? '').withOpacity(0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    (_project?['status'] ?? '').replaceAll('_', ' ').toUpperCase(),
                    style: TextStyle(
                      color:      _statusColor(_project?['status'] ?? ''),
                      fontWeight: FontWeight.w600,
                      fontSize:   12,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color:        theme.accent1,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    _project?['priority']?.toUpperCase() ?? '',
                    style: TextStyle(color: theme.primary, fontSize: 12, fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // ── Description ──────────────────────────────────────────
            if ((_project?['description'] ?? '').isNotEmpty) ...[
              Text('Description', style: theme.labelMedium),
              const SizedBox(height: 4),
              Text(_project!['description'], style: theme.bodyMedium),
              const SizedBox(height: 16),
            ],

            // ── Deadline ─────────────────────────────────────────────
            if (_project?['deadline'] != null) ...[
              Row(
                children: [
                  Icon(Icons.calendar_today_outlined, size: 16, color: theme.secondaryText),
                  const SizedBox(width: 6),
                  Text('Deadline: ${_project!['deadline'].toString().substring(0, 10)}', style: theme.labelMedium),
                ],
              ),
              const SizedBox(height: 16),
            ],

            // ── Members ──────────────────────────────────────────────
            if ((_project?['memberIds'] as List?)?.isNotEmpty == true) ...[
              Text('Team Members', style: theme.labelMedium),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                children: (_project!['memberIds'] as List).map<Widget>((m) {
                  return Chip(
                    avatar: CircleAvatar(
                      backgroundImage: (m['photoUrl'] ?? '').isNotEmpty ? NetworkImage(m['photoUrl']) : null,
                      child: (m['photoUrl'] ?? '').isEmpty ? Text(m['name'][0]) : null,
                    ),
                    label: Text(m['name'] ?? ''),
                  );
                }).toList(),
              ),
              const SizedBox(height: 16),
            ],

            // ── Tasks header ─────────────────────────────────────────
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Tasks (${_tasks.length})', style: theme.titleMedium),
                TextButton.icon(
                  onPressed: () => context.go('/projects/${widget.projectId}/tasks'),
                  icon:  const Icon(Icons.list, size: 16),
                  label: const Text('View All'),
                ),
              ],
            ),
            const SizedBox(height: 8),

            // ── Task preview ─────────────────────────────────────────
            ..._tasks.take(3).map((t) => Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color:        theme.secondaryBackground,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                children: [
                  Icon(
                    t['status'] == 'done'
                        ? Icons.check_circle
                        : Icons.radio_button_unchecked,
                    color: t['status'] == 'done' ? Colors.green : theme.primary,
                    size: 20,
                  ),
                  const SizedBox(width: 10),
                  Expanded(child: Text(t['title'] ?? '', style: theme.bodyMedium)),
                ],
              ),
            )),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: theme.primary,
        onPressed: () => context.go('/projects/${widget.projectId}/tasks/new'),
        icon:  const Icon(Icons.add, color: Colors.white),
        label: const Text('Add Task', style: TextStyle(color: Colors.white)),
      ),
    );
  }
}
