import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../application/task_provider.dart';
import '../../../../flutter_flow/flutter_flow_theme.dart';
import '../../../../shared/widgets/skeleton_loader.dart';
import '../../../../shared/widgets/empty_state.dart';
import '../../domain/models/task_model.dart';

class TaskListPage extends ConsumerStatefulWidget {
  final String projectId;
  const TaskListPage({super.key, required this.projectId});
  @override
  ConsumerState<TaskListPage> createState() => _TaskListPageState();
}

class _TaskListPageState extends ConsumerState<TaskListPage> {
  String _filter = '';
  final _statuses = ['', 'todo', 'in_progress', 'review', 'done'];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    await ref.read(taskProvider.notifier).loadTasks(
          projectId: widget.projectId,
          status: _filter,
        );
  }

  Future<void> _toggleDone(TaskModel t) async {
    final newStatus = t.status == 'done' ? 'todo' : 'done';
    await ref.read(taskProvider.notifier).updateTaskStatus(t.id, newStatus);
  }

  Color _priorityColor(String p) {
    switch (p) {
      case 'critical':
        return Colors.red;
      case 'high':
        return Colors.orange;
      case 'medium':
        return Colors.blue;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = FlutterFlowTheme.of(context);
    final taskState = ref.watch(taskProvider);
    final tasks = taskState.tasks;
    final isLoading = taskState.isLoading;

    return Scaffold(
      backgroundColor: theme.primaryBackground,
      appBar: AppBar(
        backgroundColor: theme.secondaryBackground,
        title: Text('Tasks', style: theme.titleMedium),
        leading: BackButton(
            onPressed: () => context.go('/projects/${widget.projectId}')),
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
                    label: Text(label),
                    selected: _filter == s,
                    onSelected: (_) {
                      setState(() => _filter = s);
                      _load();
                    },
                    selectedColor: theme.primary,
                    labelStyle: TextStyle(
                        color: _filter == s ? Colors.white : theme.primaryText),
                  ),
                );
              }).toList(),
            ),
          ),
          Expanded(
            child: isLoading
                ? const ListSkeleton(height: 80)
                : tasks.isEmpty
                    ? LottieEmptyState(
                        message: 'No tasks yet for this project',
                        animationUrl:
                            'https://assets9.lottiefiles.com/packages/lf20_q77v9as6.json', // Checklist animation
                        onAction: () => context
                            .go('/projects/${widget.projectId}/tasks/new'),
                        actionLabel: 'Add Task',
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: tasks.length,
                        itemBuilder: (_, i) {
                          final t = tasks[i];
                          return Container(
                            margin: const EdgeInsets.only(bottom: 10),
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: theme.secondaryBackground,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Row(
                              children: [
                                GestureDetector(
                                  onTap: () => _toggleDone(t),
                                  child: Icon(
                                    t.status == 'done'
                                        ? Icons.check_circle
                                        : Icons.radio_button_unchecked,
                                    color: t.status == 'done'
                                        ? Colors.green
                                        : theme.primary,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(t.title,
                                          style: theme.bodyMedium.copyWith(
                                            decoration: t.status == 'done'
                                                ? TextDecoration.lineThrough
                                                : null,
                                          )),
                                      if (t.assignee != null)
                                        Text(t.assignee!['name'] ?? '',
                                            style: theme.labelMedium),
                                    ],
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 6, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: _priorityColor(t.priority)
                                        .withValues(alpha: 0.12),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    t.priority,
                                    style: TextStyle(
                                        color: _priorityColor(t.priority),
                                        fontSize: 11),
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
