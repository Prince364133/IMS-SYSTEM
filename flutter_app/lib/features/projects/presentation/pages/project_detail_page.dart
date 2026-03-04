import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_service.dart';
import '../../../../core/di/service_locator.dart';
import '../../../../flutter_flow/flutter_flow_theme.dart';
import '../../domain/models/project_model.dart';
import '../../../../shared/widgets/glass_card.dart';
import '../../../auth/application/auth_provider.dart';

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
    final userRole = ref.read(authProvider).user?.role;
    return userRole == 'admin' || userRole == 'manager';
  }

  Widget _buildOverviewTab(FlutterFlowTheme theme) {
    final project = _project!;
    final progress = project.progress;
    final deadline = project.deadline != null
        ? project.deadline.toString().substring(0, 10)
        : 'No deadline set';
    final description = (project.description?.isNotEmpty == true)
        ? project.description!
        : 'No description provided for this project.';
    final doneTasks = _tasks
        .where((t) => t['status'] == 'done' || t['status'] == 'completed')
        .length;

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        // Progress hero card
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [theme.primary, theme.primary.withValues(alpha: 0.6)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Overall Progress',
                  style: TextStyle(color: Colors.white70, fontSize: 13)),
              const SizedBox(height: 8),
              Text('${progress.toInt()}%',
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 36,
                      fontWeight: FontWeight.bold)),
              const SizedBox(height: 10),
              ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: LinearProgressIndicator(
                  value: progress / 100,
                  minHeight: 10,
                  backgroundColor: Colors.white30,
                  valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        // Stats row
        Row(
          children: [
            Expanded(
                child: _buildStatCard(theme, Icons.calendar_today_outlined,
                    'Deadline', deadline, Colors.orange)),
            const SizedBox(width: 12),
            Expanded(
                child: _buildStatCard(theme, Icons.task_alt, 'Tasks Done',
                    '$doneTasks / ${_tasks.length}', Colors.green)),
            const SizedBox(width: 12),
            Expanded(
                child: _buildStatCard(
                    theme,
                    Icons.flag_outlined,
                    'Priority',
                    (project.priority ?? 'medium').toUpperCase(),
                    theme.primary)),
          ],
        ),
        const SizedBox(height: 16),
        // Description
        GlassCard(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Icon(Icons.description_outlined,
                    color: theme.primary, size: 20),
                const SizedBox(width: 8),
                Text('Project Description', style: theme.labelMedium),
              ]),
              const SizedBox(height: 12),
              Text(description, style: theme.bodyMedium),
            ],
          ),
        ),
        const SizedBox(height: 16),
        // Reports
        GlassCard(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Icon(Icons.analytics_outlined, color: theme.primary, size: 20),
                const SizedBox(width: 8),
                Text('Reports & Analytics', style: theme.labelMedium),
              ]),
              const SizedBox(height: 12),
              _buildReportItem(theme, Icons.bar_chart, 'Task Completion Report',
                  'View task breakdown and trends'),
              const Divider(),
              _buildReportItem(theme, Icons.people_outline, 'Team Productivity',
                  'Individual contributions overview'),
              const Divider(),
              _buildReportItem(theme, Icons.timeline, 'Project Timeline',
                  'Milestones and Gantt view'),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildStatCard(FlutterFlowTheme theme, IconData icon, String label,
      String val, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: theme.secondaryBackground,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: theme.alternate),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 18),
          const SizedBox(height: 8),
          Text(val,
              style: theme.bodyMedium.copyWith(fontWeight: FontWeight.bold)),
          Text(label, style: theme.labelMedium),
        ],
      ),
    );
  }

  Widget _buildReportItem(
      FlutterFlowTheme theme, IconData icon, String title, String subtitle) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
            color: theme.primary.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8)),
        child: Icon(icon, color: theme.primary, size: 18),
      ),
      title: Text(title,
          style: theme.bodyMedium.copyWith(fontWeight: FontWeight.w600)),
      subtitle: Text(subtitle, style: theme.labelMedium),
      trailing:
          Icon(Icons.download_outlined, color: theme.secondaryText, size: 20),
      onTap: () => ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text('Generating "$title"...'))),
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
                style: theme.labelMedium),
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
