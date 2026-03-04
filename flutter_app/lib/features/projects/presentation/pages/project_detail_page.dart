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
  List<dynamic> _team = []; // all org employees
  List<dynamic> _members = []; // employees assigned to this project
  Map<String, dynamic>? _client;
  bool _loading = true;
  int _tabIndex = 0;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _tabController.addListener(() {
      if (mounted) setState(() => _tabIndex = _tabController.index);
    });
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

      final projRes = await _api
          .get('/projects/${widget.projectId}')
          .catchError((_) => <String, dynamic>{} as Map<String, dynamic>);
      final taskRes = await _api
          .get('/tasks?projectId=${widget.projectId}')
          .catchError((_) => <String, dynamic>{} as Map<String, dynamic>);
      final usersRes = await _api
          .get('/users?limit=200')
          .catchError((_) => <String, dynamic>{} as Map<String, dynamic>);

      if (mounted) {
        final projectData = projRes['project'] ?? projRes;
        final allUsers = (usersRes['users'] as List?) ?? [];

        // Determine assigned member IDs from project data
        final rawMembers =
            projectData['members'] ?? projectData['assigned_employees'] ?? [];
        final memberIds = (rawMembers as List).map((m) {
          if (m is Map)
            return m['id']?.toString() ?? m['_id']?.toString() ?? '';
          return m.toString();
        }).toSet();

        final members = memberIds.isEmpty
            ? <dynamic>[]
            : allUsers.where((u) {
                final uid = u['id']?.toString() ?? u['_id']?.toString() ?? '';
                return memberIds.contains(uid);
              }).toList();

        setState(() {
          _project = ProjectModel.fromJson(projectData);
          _tasks = (taskRes['tasks'] as List?) ?? [];
          _team = allUsers;
          _members = members;
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

  // ── status / priority helpers ──────────────────────────────────────────────
  Color _taskStatusColor(String s) {
    switch (s) {
      case 'done':
      case 'completed':
        return Colors.green;
      case 'in_progress':
        return Colors.blue;
      case 'todo':
        return Colors.orange;
      default:
        return Colors.grey;
    }
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

  // ── Tasks tab ─────────────────────────────────────────────────────────────
  Widget _buildTasksTab(FlutterFlowTheme theme) {
    if (_tasks.isEmpty) {
      return Center(
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Icon(Icons.task_alt,
              size: 64, color: theme.secondaryText.withValues(alpha: 0.4)),
          const SizedBox(height: 16),
          Text('No tasks yet', style: theme.titleMedium),
          const SizedBox(height: 16),
          if (_canEdit())
            ElevatedButton.icon(
              onPressed: () => _showAddTaskSheet(theme),
              icon: const Icon(Icons.add),
              label: const Text('Add First Task'),
              style: ElevatedButton.styleFrom(
                  backgroundColor: theme.primary,
                  foregroundColor: Colors.white),
            ),
        ]),
      );
    }

    // Count done tasks for header
    final done = _tasks
        .where((t) => t['status'] == 'done' || t['status'] == 'completed')
        .length;
    final total = _tasks.length;

    return Column(children: [
      // Progress summary bar
      Container(
        margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: theme.secondaryBackground,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: theme.alternate),
        ),
        child: Row(children: [
          Icon(Icons.checklist, color: theme.primary, size: 18),
          const SizedBox(width: 8),
          Text('$done / $total completed',
              style: theme.bodyMedium.copyWith(fontWeight: FontWeight.w600)),
          const Spacer(),
          SizedBox(
            width: 120,
            child: LinearProgressIndicator(
              value: total > 0 ? done / total : 0,
              color: Colors.green,
              backgroundColor: theme.alternate,
              borderRadius: BorderRadius.circular(4),
            ),
          ),
        ]),
      ),
      Expanded(
        child: ListView.builder(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 80),
          itemCount: _tasks.length,
          itemBuilder: (context, i) {
            final task = _tasks[i];
            final taskId =
                task['id']?.toString() ?? task['_id']?.toString() ?? '';
            final isDone =
                task['status'] == 'done' || task['status'] == 'completed';
            final priority = task['priority'] ?? 'medium';
            final status = task['status'] ?? 'todo';

            return Container(
              margin: const EdgeInsets.only(bottom: 10),
              decoration: BoxDecoration(
                color: theme.secondaryBackground,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isDone
                      ? Colors.green.withValues(alpha: 0.3)
                      : theme.alternate,
                ),
              ),
              child: ListTile(
                leading: GestureDetector(
                  onTap: () async {
                    final newStatus = isDone ? 'todo' : 'done';
                    try {
                      await _api.put('/tasks/$taskId', {'status': newStatus});
                      _load();
                    } catch (_) {
                      if (mounted)
                        ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                                content: Text('Failed to update task')));
                    }
                  },
                  child: Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: isDone ? Colors.green : Colors.transparent,
                      border: Border.all(
                          color: isDone ? Colors.green : theme.secondaryText,
                          width: 2),
                    ),
                    child: isDone
                        ? const Icon(Icons.check, color: Colors.white, size: 16)
                        : null,
                  ),
                ),
                title: Text(
                  task['title'] ?? 'Untitled',
                  style: TextStyle(
                    decoration: isDone ? TextDecoration.lineThrough : null,
                    color: isDone ? theme.secondaryText : theme.primaryText,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                subtitle: Row(children: [
                  Container(
                    margin: const EdgeInsets.only(top: 4, right: 6),
                    padding:
                        const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: _taskStatusColor(status).withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(status.replaceAll('_', ' '),
                        style: TextStyle(
                            color: _taskStatusColor(status),
                            fontSize: 10,
                            fontWeight: FontWeight.bold)),
                  ),
                  Container(
                    margin: const EdgeInsets.only(top: 4),
                    padding:
                        const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: _priorityColor(priority).withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(priority,
                        style: TextStyle(
                            color: _priorityColor(priority),
                            fontSize: 10,
                            fontWeight: FontWeight.bold)),
                  ),
                ]),
                trailing: _canEdit()
                    ? PopupMenuButton<String>(
                        icon: Icon(Icons.more_vert,
                            size: 18, color: theme.secondaryText),
                        itemBuilder: (_) => [
                          const PopupMenuItem(
                              value: 'edit', child: Text('Edit Task')),
                          const PopupMenuItem(
                              value: 'delete',
                              child: Text('Delete',
                                  style: TextStyle(color: Colors.red))),
                        ],
                        onSelected: (val) async {
                          if (val == 'delete' && taskId.isNotEmpty) {
                            await _api
                                .delete('/tasks/$taskId')
                                .catchError((_) {});
                            _load();
                          }
                        },
                      )
                    : null,
              ),
            );
          },
        ),
      ),
    ]);
  }

  // ── Add Task bottom sheet ─────────────────────────────────────────────────
  void _showAddTaskSheet(FlutterFlowTheme theme) {
    final titleCtrl = TextEditingController();
    final descCtrl = TextEditingController();
    String priority = 'medium';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: theme.secondaryBackground,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => StatefulBuilder(
        builder: (ctx, setModal) => Padding(
          padding: EdgeInsets.only(
              left: 20,
              right: 20,
              top: 20,
              bottom: MediaQuery.of(ctx).viewInsets.bottom + 20),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              Text('Add Task', style: theme.titleMedium),
              IconButton(
                  onPressed: () => Navigator.pop(ctx),
                  icon: const Icon(Icons.close)),
            ]),
            const SizedBox(height: 12),
            TextField(
              controller: titleCtrl,
              decoration: InputDecoration(
                hintText: 'Task title *',
                filled: true,
                fillColor: theme.primaryBackground,
                border:
                    OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
              ),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: descCtrl,
              maxLines: 3,
              decoration: InputDecoration(
                hintText: 'Description (optional)',
                filled: true,
                fillColor: theme.primaryBackground,
                border:
                    OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
              ),
            ),
            const SizedBox(height: 10),
            DropdownButtonFormField<String>(
              value: priority,
              decoration: InputDecoration(
                labelText: 'Priority',
                filled: true,
                fillColor: theme.primaryBackground,
                border:
                    OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
              ),
              items: const [
                DropdownMenuItem(value: 'low', child: Text('Low')),
                DropdownMenuItem(value: 'medium', child: Text('Medium')),
                DropdownMenuItem(value: 'high', child: Text('High')),
                DropdownMenuItem(value: 'critical', child: Text('Critical')),
              ],
              onChanged: (v) => setModal(() => priority = v ?? priority),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () async {
                if (titleCtrl.text.trim().isEmpty) return;
                final nav = Navigator.of(ctx);
                await _api.post('/tasks', {
                  'title': titleCtrl.text.trim(),
                  'description': descCtrl.text.trim(),
                  'priority': priority,
                  'status': 'todo',
                  'project_id': widget.projectId,
                }).catchError((e) {
                  if (mounted)
                    ScaffoldMessenger.of(context)
                        .showSnackBar(SnackBar(content: Text('Error: $e')));
                });
                nav.pop();
                _load();
              },
              style: ElevatedButton.styleFrom(
                  backgroundColor: theme.primary,
                  foregroundColor: Colors.white,
                  minimumSize: const Size(double.infinity, 48)),
              child: const Text('Add Task'),
            ),
          ]),
        ),
      ),
    );
  }

  // ── Team tab ─────────────────────────────────────────────────────────────
  Widget _buildTeamTab(FlutterFlowTheme theme) {
    return Column(children: [
      // Header: assigned count
      Container(
        margin: const EdgeInsets.all(16),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: theme.secondaryBackground,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: theme.alternate),
        ),
        child: Row(children: [
          Icon(Icons.groups_rounded, color: theme.primary, size: 22),
          const SizedBox(width: 10),
          Text(
              '${_members.length} Team Member${_members.length != 1 ? 's' : ''}',
              style: theme.titleMedium),
          const Spacer(),
          if (_canEdit())
            TextButton.icon(
              onPressed: () => _showAssignMemberSheet(theme),
              icon: const Icon(Icons.person_add, size: 16),
              label: const Text('Assign'),
            ),
        ]),
      ),
      Expanded(
        child: _members.isEmpty
            ? Center(
                child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.groups_outlined,
                          size: 64,
                          color: theme.secondaryText.withValues(alpha: 0.3)),
                      const SizedBox(height: 16),
                      Text('No members assigned yet', style: theme.titleMedium),
                      if (_canEdit()) ...[
                        const SizedBox(height: 12),
                        OutlinedButton.icon(
                          onPressed: () => _showAssignMemberSheet(theme),
                          icon: const Icon(Icons.person_add),
                          label: const Text('Assign Member'),
                        )
                      ],
                    ]),
              )
            : ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: _members.length,
                itemBuilder: (_, i) {
                  final m = _members[i];
                  final name = m['name'] ?? 'Unknown';
                  final role = (m['role'] ?? 'employee').toString();
                  return Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: theme.secondaryBackground,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: theme.alternate),
                    ),
                    child: Row(children: [
                      CircleAvatar(
                        radius: 24,
                        backgroundColor: theme.primary.withValues(alpha: 0.1),
                        child: Text(name[0].toUpperCase(),
                            style: TextStyle(
                                color: theme.primary,
                                fontWeight: FontWeight.bold,
                                fontSize: 18)),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                          child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                            Text(name,
                                style: theme.bodyMedium
                                    .copyWith(fontWeight: FontWeight.bold)),
                            Text(m['email'] ?? '', style: theme.labelMedium),
                          ])),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: theme.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(role.toUpperCase(),
                            style: TextStyle(
                                color: theme.primary,
                                fontSize: 10,
                                fontWeight: FontWeight.bold)),
                      ),
                    ]),
                  );
                },
              ),
      ),
    ]);
  }

  // ── Assign member sheet ───────────────────────────────────────────────────
  void _showAssignMemberSheet(FlutterFlowTheme theme) {
    final assignedIds = _members
        .map((m) => m['id']?.toString() ?? m['_id']?.toString() ?? '')
        .toSet();
    final available = _team.where((u) {
      final uid = u['id']?.toString() ?? u['_id']?.toString() ?? '';
      return !assignedIds.contains(uid) && u['role'] != 'client';
    }).toList();

    showModalBottomSheet(
      context: context,
      backgroundColor: theme.secondaryBackground,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => Column(children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child:
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text('Assign Team Member', style: theme.titleMedium),
            IconButton(
                onPressed: () => Navigator.pop(_),
                icon: const Icon(Icons.close)),
          ]),
        ),
        Expanded(
          child: available.isEmpty
              ? Center(
                  child: Text('All employees are already assigned',
                      style: theme.labelMedium))
              : ListView.builder(
                  itemCount: available.length,
                  itemBuilder: (ctx, i) {
                    final u = available[i];
                    return ListTile(
                      leading: CircleAvatar(
                        backgroundColor: theme.primary.withValues(alpha: 0.1),
                        child: Text((u['name'] ?? '?')[0].toUpperCase(),
                            style: TextStyle(color: theme.primary)),
                      ),
                      title: Text(u['name'] ?? '', style: theme.bodyMedium),
                      subtitle: Text(u['role'] ?? '', style: theme.labelMedium),
                      onTap: () async {
                        final nav = Navigator.of(ctx);
                        final uid =
                            u['id']?.toString() ?? u['_id']?.toString() ?? '';
                        await _api.post('/projects/${widget.projectId}/members',
                            {'user_id': uid}).catchError((_) {});
                        nav.pop();
                        _load();
                      },
                    );
                  },
                ),
        ),
      ]),
    );
  }

  // ── Client tab ───────────────────────────────────────────────────────────
  Widget _buildClientTab(FlutterFlowTheme theme) {
    final clientId = _project?.toJson()['client_id']?.toString() ?? '';
    return ListView(padding: const EdgeInsets.all(20), children: [
      GlassCard(
        padding: const EdgeInsets.all(20),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Icon(Icons.business_center_outlined,
                color: theme.primary, size: 22),
            const SizedBox(width: 10),
            Text('Client Information', style: theme.titleMedium),
          ]),
          const SizedBox(height: 16),
          if (clientId.isEmpty)
            Column(children: [
              Icon(Icons.person_search,
                  size: 48, color: theme.secondaryText.withValues(alpha: 0.4)),
              const SizedBox(height: 12),
              Text('No client linked to this project',
                  style: theme.labelMedium),
              const SizedBox(height: 12),
              if (_canEdit())
                OutlinedButton.icon(
                  onPressed: () => context.go('/clients'),
                  icon: const Icon(Icons.link),
                  label: const Text('Go to Clients'),
                ),
            ])
          else ...[
            _infoTile(theme, Icons.badge_outlined, 'Client ID', clientId),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: () => context.go('/clients/$clientId'),
              icon: const Icon(Icons.open_in_new, size: 16),
              label: const Text('View Client Profile'),
            ),
          ],
        ]),
      ),
      const SizedBox(height: 16),
      GlassCard(
        padding: const EdgeInsets.all(20),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Icon(Icons.chat_bubble_outline, color: theme.primary, size: 22),
            const SizedBox(width: 10),
            Text('Client Updates', style: theme.titleMedium),
          ]),
          const SizedBox(height: 12),
          Text('Share progress updates with your client.',
              style: theme.labelMedium),
          const SizedBox(height: 12),
          ElevatedButton.icon(
            onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Client portal coming in v2'))),
            icon: const Icon(Icons.send_outlined, size: 16),
            label: const Text('Send Update'),
            style: ElevatedButton.styleFrom(
                backgroundColor: theme.primary, foregroundColor: Colors.white),
          ),
        ]),
      ),
    ]);
  }

  Widget _infoTile(
          FlutterFlowTheme t, IconData icon, String label, String val) =>
      Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Row(children: [
          Icon(icon, color: t.primary, size: 18),
          const SizedBox(width: 10),
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(label, style: t.labelMedium),
            Text(val, style: t.bodyMedium),
          ]),
        ]),
      );

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
      floatingActionButton: _tabIndex == 1 && _canEdit()
          ? FloatingActionButton.extended(
              backgroundColor: theme.primary,
              onPressed: () => _showAddTaskSheet(theme),
              icon: const Icon(Icons.add, color: Colors.white),
              label:
                  const Text('Add Task', style: TextStyle(color: Colors.white)),
            )
          : null,
    );
  }
}
