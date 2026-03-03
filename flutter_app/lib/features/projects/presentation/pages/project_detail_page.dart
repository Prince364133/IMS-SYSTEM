import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_service.dart';
import '../../../../core/di/service_locator.dart';
import '../../../../flutter_flow/flutter_flow_theme.dart';
import '../../domain/models/project_model.dart';
import '../../../../shared/widgets/glass_card.dart';
import '../../../../features/auth/application/auth_service.dart';

class ProjectDetailPage extends ConsumerStatefulWidget {
  final String projectId;
  const ProjectDetailPage({super.key, required this.projectId});

  @override
  ConsumerState<ProjectDetailPage> createState() => _ProjectDetailPageState();
}

class _ProjectDetailPageState extends ConsumerState<ProjectDetailPage>
    with SingleTickerProviderStateMixin {
  final _api = locator<ApiService>();
  late TabController _tabController;

  ProjectModel? _project;
  List<dynamic> _tasks = [];
  List<dynamic> _team = [];
  Map<String, dynamic>? _client;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _load();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      if (widget.projectId == 'null') {
        if (mounted) setState(() => _loading = false);
        return;
      }

      final [projRes, taskRes] = await Future.wait([
        _api.get('/projects/${widget.projectId}'),
        _api
            .get('/tasks?projectId=${widget.projectId}')
            .catchError((_) => {'tasks': []}),
      ]);

      if (mounted) {
        setState(() {
          _project = ProjectModel.fromJson(projRes['project'] ?? projRes);
          _tasks = taskRes['tasks'] ?? [];
          // We would load team and client here if the backend provided them directly
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Color _statusColor(String s) {
    switch (s.toLowerCase()) {
      case 'completed':
        return Colors.green;
      case 'in_progress':
        return Colors.blue;
      case 'active':
        return Colors.blue;
      case 'on_hold':
        return Colors.orange;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  bool _canEdit() {
    final userRole = ref.read(authProvider).userRole;
    return userRole == 'admin' || userRole == 'manager';
  }

  Widget _buildOverviewTab(FlutterFlowTheme theme) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        GlassCard(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Project Description', style: theme.labelMedium),
              const SizedBox(height: 8),
              Text(
                _project?.description?.isNotEmpty == true
                    ? _project!.description!
                    : 'No description provided.',
                style: theme.bodyMedium,
              ),
              const SizedBox(height: 20),
              Wrap(
                spacing: 20,
                runSpacing: 20,
                children: [
                  _buildStatItem(
                      theme,
                      Icons.calendar_today,
                      'Deadline',
                      _project?.deadline?.toString().substring(0, 10) ??
                          'Not set'),
                  _buildStatItem(theme, Icons.check_circle_outline, 'Tasks',
                      '${_tasks.length} Total'),
                  _buildStatItem(theme, Icons.timeline, 'Progress',
                      '${_project!.progress.toInt()}%'),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        GlassCard(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Project Reports', style: theme.titleMedium),
              const SizedBox(height: 16),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                      color: theme.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10)),
                  child: Icon(Icons.analytics_outlined, color: theme.primary),
                ),
                title: Text('Performance Analytics', style: theme.bodyMedium),
                trailing: Icon(Icons.download, color: theme.secondaryText),
                onTap: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Generating report...')));
                },
              ),
            ],
          ),
        )
      ],
    );
  }

  Widget _buildStatItem(
      FlutterFlowTheme theme, IconData icon, String label, String val) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: theme.secondaryBackground.withValues(alpha: 0.5),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: theme.primary, size: 20),
        ),
        const SizedBox(width: 12),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: theme.labelSmall),
            Text(val,
                style: theme.bodyMedium.copyWith(fontWeight: FontWeight.bold)),
          ],
        )
      ],
    );
  }

  Widget _buildTasksTab(FlutterFlowTheme theme) {
    if (_tasks.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.task_alt,
                size: 64, color: theme.secondaryText.withValues(alpha: 0.5)),
            const SizedBox(height: 16),
            Text('No tasks yet', style: theme.titleMedium),
            const SizedBox(height: 16),
            if (_canEdit())
              ElevatedButton.icon(
                onPressed: () => context
                    .push('/projects/${widget.projectId}/tasks/new')
                    .then((_) => _load()),
                icon: const Icon(Icons.add),
                label: const Text('Add First Task'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: theme.primary,
                  foregroundColor: Colors.white,
                ),
              ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: _tasks.length,
      itemBuilder: (context, index) {
        final task = _tasks[index];
        final bool isDone =
            task['status'] == 'done' || task['status'] == 'completed';
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(
            color: theme.secondaryBackground,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: theme.alternate, width: 1),
          ),
          child: ListTile(
            leading: IconButton(
              icon: Icon(
                  isDone ? Icons.check_circle : Icons.radio_button_unchecked,
                  color: isDone ? Colors.green : theme.secondaryText),
              onPressed: () async {
                // Toggle task status
                try {
                  final newStatus = isDone ? 'todo' : 'done';
                  await _api.put('/tasks/${task['id']}', {'status': newStatus});
                  _load();
                } catch (e) {
                  ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Failed to update task')));
                }
              },
            ),
            title: Text(task['title'] ?? 'Untitled Task',
                style: TextStyle(
                    decoration: isDone ? TextDecoration.lineThrough : null)),
            subtitle: Text(
                'Status: ${task['status']} | Priority: ${task['priority'] ?? 'medium'}',
                style: theme.labelSmall),
            trailing: _canEdit()
                ? PopupMenuButton(
                    icon: const Icon(Icons.more_vert),
                    itemBuilder: (context) => [
                      const PopupMenuItem(
                          value: 'assign', child: Text('Assign Member')),
                      const PopupMenuItem(
                          value: 'edit', child: Text('Edit Task')),
                      const PopupMenuItem(
                          value: 'delete', child: Text('Delete')),
                    ],
                    onSelected: (val) async {
                      if (val == 'delete') {
                        await _api.delete('/tasks/${task['id']}');
                        _load();
                      }
                      // Handle assign logic
                    },
                  )
                : null,
          ),
        );
      },
    );
  }

  Widget _buildTeamTab(FlutterFlowTheme theme) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.groups_outlined,
              size: 64, color: theme.secondaryText.withValues(alpha: 0.5)),
          const SizedBox(height: 16),
          Text('Team Members', style: theme.titleMedium),
          const SizedBox(height: 8),
          Text('Assign tasks to team members here.', style: theme.labelMedium),
          const SizedBox(height: 16),
          if (_canEdit())
            OutlinedButton.icon(
              onPressed: () {
                // Show member assignment modal
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                    content: Text('Team management coming soon')));
              },
              icon: const Icon(Icons.person_add),
              label: const Text('Add Team Member'),
            ),
        ],
      ),
    );
  }

  Widget _buildClientTab(FlutterFlowTheme theme) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.business_center_outlined,
              size: 64, color: theme.secondaryText.withValues(alpha: 0.5)),
          const SizedBox(height: 16),
          Text('Client Connections', style: theme.titleMedium),
          const SizedBox(height: 8),
          Text('Connect a client profile to this project.',
              style: theme.labelMedium),
          const SizedBox(height: 16),
          if (_canEdit())
            OutlinedButton.icon(
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                    content: Text('Client connection coming soon')));
              },
              icon: const Icon(Icons.link),
              label: const Text('Link Client'),
            ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = FlutterFlowTheme.of(context);

    if (_loading) {
      return Scaffold(
          backgroundColor: theme.primaryBackground,
          body: const Center(child: CircularProgressIndicator()));
    }

    if (_project == null) {
      return Scaffold(
        backgroundColor: theme.primaryBackground,
        appBar: AppBar(
            leading: BackButton(onPressed: () => context.go('/projects'))),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 64, color: theme.error),
              const SizedBox(height: 16),
              Text('Project not found or Invalid ID', style: theme.titleMedium),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => context.go('/projects'),
                child: const Text('Back to Projects'),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: theme.primaryBackground,
      appBar: AppBar(
        backgroundColor: theme.secondaryBackground,
        elevation: 0,
        leading: BackButton(onPressed: () => context.go('/projects')),
        title: Text(_project!.name, style: theme.titleMedium),
        actions: [
          if (_canEdit())
            IconButton(
              icon: const Icon(Icons.edit_outlined),
              onPressed: () {
                // Edit project logic
              },
            ),
        ],
        bottom: TabBar(
          controller: _tabController,
          labelColor: theme.primary,
          unselectedLabelColor: theme.secondaryText,
          indicatorColor: theme.primary,
          tabs: const [
            Tab(text: 'Overview'),
            Tab(text: 'Tasks'),
            Tab(text: 'Team'),
            Tab(text: 'Client'),
          ],
        ),
      ),
      body: Column(
        children: [
          // Project Header Banner
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
            decoration: BoxDecoration(
              color: theme.secondaryBackground,
              boxShadow: [
                BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 4,
                    offset: const Offset(0, 2))
              ],
            ),
            child: Row(
              children: [
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color:
                        _statusColor(_project!.status).withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                        color: _statusColor(_project!.status)
                            .withValues(alpha: 0.5)),
                  ),
                  child: Text(
                    _project!.status.replaceAll('_', ' ').toUpperCase(),
                    style: TextStyle(
                      color: _statusColor(_project!.status),
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
                const Spacer(),
                LinearProgressIndicator(
                  value: _project!.progress / 100,
                  backgroundColor: theme.alternate,
                  color: _statusColor(_project!.status),
                ),
                const SizedBox(width: 10),
                Text('${_project!.progress.toInt()}%',
                    style: theme.labelMedium),
              ],
            ),
          ),

          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildOverviewTab(theme),
                _buildTasksTab(theme),
                _buildTeamTab(theme),
                _buildClientTab(theme),
              ],
            ),
          ),
        ],
      ),
      floatingActionButton: _tabController.index == 1 && _canEdit()
          ? FloatingActionButton.extended(
              backgroundColor: theme.primary,
              onPressed: () => context
                  .push('/projects/${widget.projectId}/tasks/new')
                  .then((_) => _load()),
              icon: const Icon(Icons.add, color: Colors.white),
              label:
                  const Text('Add Task', style: TextStyle(color: Colors.white)),
            )
          : null,
    );
  }
}
