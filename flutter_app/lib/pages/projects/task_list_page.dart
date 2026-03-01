import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../services/api_service.dart';
import '../../flutter_flow/flutter_flow_theme.dart';

class TaskListPage extends StatefulWidget {
  final String projectId;
  const TaskListPage({super.key, required this.projectId});
  @override
  State<TaskListPage> createState() => _TaskListPageState();
}

class _TaskListPageState extends State<TaskListPage> {
  final _api = ApiService();
  List<dynamic> _tasks = [];
  String _filter = '';
  bool _loading  = true;
  final _statuses = ['', 'todo', 'in_progress', 'review', 'done'];

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final q = 'projectId=${widget.projectId}${_filter.isNotEmpty ? '&status=$_filter' : ''}';
      final res = await _api.get('/tasks?$q');
      setState(() => _tasks = res['tasks'] ?? []);
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _toggleDone(Map t) async {
    final newStatus = t['status'] == 'done' ? 'todo' : 'done';
    await _api.put('/tasks/${t['_id']}', {'status': newStatus});
    _load();
  }

  Color _priorityColor(String p) {
    switch (p) {
      case 'critical': return Colors.red;
      case 'high':     return Colors.orange;
      case 'medium':   return Colors.blue;
      default:         return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = FlutterFlowTheme.of(context);
    return Scaffold(
      backgroundColor: theme.primaryBackground,
      appBar: AppBar(
        backgroundColor: theme.secondaryBackground,
        title:   Text('Tasks', style: theme.titleMedium),
        leading: BackButton(onPressed: () => context.go('/projects/${widget.projectId}')),
      ),
      body: Column(
        children: [
          SizedBox(
            height: 44,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              children: _statuses.map((s) {
                final label = s.isEmpty ? 'All' : s.replaceAll('_', ' ');
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label:     Text(label),
                    selected:  _filter == s,
                    onSelected: (_) { setState(() => _filter = s); _load(); },
                    selectedColor: theme.primary,
                    labelStyle: TextStyle(color: _filter == s ? Colors.white : theme.primaryText),
                  ),
                );
              }).toList(),
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _tasks.isEmpty
                    ? Center(child: Text('No tasks', style: theme.labelMedium))
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _tasks.length,
                        itemBuilder: (_, i) {
                          final t = _tasks[i];
                          return Container(
                            margin: const EdgeInsets.only(bottom: 10),
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color:        theme.secondaryBackground,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Row(
                              children: [
                                GestureDetector(
                                  onTap: () => _toggleDone(t),
                                  child: Icon(
                                    t['status'] == 'done'
                                        ? Icons.check_circle
                                        : Icons.radio_button_unchecked,
                                    color: t['status'] == 'done' ? Colors.green : theme.primary,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(t['title'] ?? '', style: theme.bodyMedium.copyWith(
                                        decoration: t['status'] == 'done' ? TextDecoration.lineThrough : null,
                                      )),
                                      if (t['assigneeId'] != null)
                                        Text(t['assigneeId']['name'] ?? '', style: theme.labelMedium),
                                    ],
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                                  decoration: BoxDecoration(
                                    color:        _priorityColor(t['priority'] ?? '').withOpacity(0.12),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    t['priority'] ?? '',
                                    style: TextStyle(color: _priorityColor(t['priority'] ?? ''), fontSize: 11),
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: theme.primary,
        onPressed: () => context.go('/projects/${widget.projectId}/tasks/new'),
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }
}
