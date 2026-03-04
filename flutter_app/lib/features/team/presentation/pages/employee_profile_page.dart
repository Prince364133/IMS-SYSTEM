import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/network/api_service.dart';
import '../../../../core/di/service_locator.dart';
import '../../../../flutter_flow/flutter_flow_theme.dart';
import '../../../../shared/widgets/glass_card.dart';
import '../../../auth/application/auth_provider.dart';

class EmployeeProfilePage extends ConsumerStatefulWidget {
  final String employeeId;
  const EmployeeProfilePage({super.key, required this.employeeId});

  @override
  ConsumerState<EmployeeProfilePage> createState() =>
      _EmployeeProfilePageState();
}

class _EmployeeProfilePageState extends ConsumerState<EmployeeProfilePage>
    with SingleTickerProviderStateMixin {
  final _api = locator<ApiService>();
  late TabController _tabs;

  Map<String, dynamic>? _user;
  List<dynamic> _goals = [];
  List<dynamic> _userProjects = [];
  List<dynamic> _attendance = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 3, vsync: this);
    _load();
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final userRes = await _api
          .get('/users/${widget.employeeId}')
          .catchError((_) => <String, dynamic>{});
      final goalsRes = await _api
          .get('/goals?employeeId=${widget.employeeId}')
          .catchError((_) => <String, dynamic>{});
      final projRes = await _api
          .get('/projects?limit=50')
          .catchError((_) => <String, dynamic>{});
      final attRes = await _api
          .get('/attendance?userId=${widget.employeeId}&limit=30')
          .catchError((_) => <String, dynamic>{});

      if (mounted) {
        final allProjects = (projRes['projects'] as List?) ?? [];
        final uid = widget.employeeId;
        final myProjects = allProjects.where((p) {
          final members = p['members'] ?? p['assigned_employees'] ?? [];
          return members.any((m) =>
              m.toString() == uid || (m is Map && m['id']?.toString() == uid));
        }).toList();

        setState(() {
          _user = userRes['user'] ?? userRes;
          _goals = (goalsRes['goals'] as List?) ?? [];
          _userProjects = myProjects;
          _attendance = (attRes['attendance'] as List?) ?? [];
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  bool _canEdit() {
    final role = ref.read(authProvider).user?.role;
    return role == 'admin' || role == 'hr' || role == 'manager';
  }

  Future<void> _deactivate() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Deactivate Employee'),
        content: Text('Deactivate ${_user?['name']}? They will lose access.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.pop(ctx, true),
            child:
                const Text('Deactivate', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
    if (confirm == true) {
      try {
        await _api.put('/users/${widget.employeeId}', {'is_active': false});
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Employee deactivated')));
          _load();
        }
      } catch (e) {
        if (mounted)
          ScaffoldMessenger.of(context)
              .showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  int get _presentDays =>
      _attendance.where((a) => a['status'] == 'present').length;
  double get _attendancePct =>
      _attendance.isEmpty ? 0 : (_presentDays / _attendance.length * 100);
  int get _completedGoals =>
      _goals.where((g) => (g['progress'] ?? 0) >= 100).length;

  @override
  Widget build(BuildContext context) {
    final theme = FlutterFlowTheme.of(context);
    if (_loading)
      return const Scaffold(body: Center(child: CircularProgressIndicator()));

    final name = _user?['name'] ?? 'Employee';
    final role = (_user?['role'] ?? '').toString().toUpperCase();
    final email = _user?['email'] ?? '-';
    final phone = _user?['phone'] ?? '-';
    final dept = _user?['department'] ?? '-';
    final pos = _user?['position'] ?? _user?['role'] ?? '-';
    final salary = _user?['salary'] != null ? '₹${_user!['salary']}' : '-';
    final joinDate = _user?['join_date'] ?? _user?['created_at'] ?? '-';
    final isActive = _user?['is_active'] ?? true;

    return Scaffold(
      backgroundColor: theme.primaryBackground,
      appBar: AppBar(
        backgroundColor: theme.secondaryBackground,
        title: Text(name, style: theme.titleMedium),
        leading: BackButton(onPressed: () => context.go('/team')),
        actions: [
          if (_canEdit())
            PopupMenuButton<String>(
              icon: const Icon(Icons.more_vert),
              onSelected: (val) async {
                if (val == 'deactivate') await _deactivate();
                if (val == 'edit') {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                      content: Text('Edit employee coming soon')));
                }
              },
              itemBuilder: (_) => [
                const PopupMenuItem(
                    value: 'edit', child: Text('Edit Employee')),
                const PopupMenuItem(
                    value: 'deactivate',
                    child: Text('Deactivate',
                        style: TextStyle(color: Colors.red))),
              ],
            ),
        ],
        bottom: TabBar(
          controller: _tabs,
          labelColor: theme.primary,
          unselectedLabelColor: theme.secondaryText,
          indicatorColor: theme.primary,
          tabs: const [
            Tab(text: 'Profile'),
            Tab(text: 'Projects'),
            Tab(text: 'Goals'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabs,
        children: [
          _buildProfile(theme, name, role, email, phone, dept, pos, salary,
              joinDate, isActive),
          _buildProjects(theme),
          _buildGoals(theme),
        ],
      ),
    );
  }

  Widget _buildProfile(
      FlutterFlowTheme theme,
      String name,
      String role,
      String email,
      String phone,
      String dept,
      String pos,
      String salary,
      String joinDate,
      bool isActive) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        // Avatar + status
        Center(
          child: Stack(children: [
            CircleAvatar(
              radius: 52,
              backgroundColor: theme.primary,
              child: Text(name.isNotEmpty ? name[0].toUpperCase() : 'U',
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 32,
                      fontWeight: FontWeight.bold)),
            ),
            Positioned(
              bottom: 4,
              right: 4,
              child: Container(
                width: 16,
                height: 16,
                decoration: BoxDecoration(
                  color: isActive ? Colors.green : Colors.red,
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 2),
                ),
              ),
            )
          ]),
        ),
        const SizedBox(height: 12),
        Center(child: Text(name, style: theme.headlineSmall)),
        Center(
            child: Text(role,
                style: TextStyle(
                    color: theme.primary, fontWeight: FontWeight.w600))),
        const SizedBox(height: 20),

        // Stats row
        Row(children: [
          Expanded(
              child: _statBox(theme, Icons.task_alt, 'Goals Done',
                  '$_completedGoals/${_goals.length}', Colors.green)),
          const SizedBox(width: 10),
          Expanded(
              child: _statBox(theme, Icons.folder_outlined, 'Projects',
                  '${_userProjects.length}', Colors.orange)),
          const SizedBox(width: 10),
          Expanded(
              child: _statBox(theme, Icons.calendar_month, 'Attendance',
                  '${_attendancePct.toInt()}%', theme.primary)),
        ]),
        const SizedBox(height: 20),

        // Info cards
        GlassCard(
          padding: const EdgeInsets.all(16),
          child: Column(children: [
            _infoRow(theme, Icons.email_outlined, 'Email', email),
            const Divider(),
            _infoRow(theme, Icons.phone_outlined, 'Phone', phone),
            const Divider(),
            _infoRow(theme, Icons.business_outlined, 'Department', dept),
            const Divider(),
            _infoRow(theme, Icons.work_outline, 'Position', pos),
            const Divider(),
            _infoRow(theme, Icons.attach_money, 'Salary', salary),
            const Divider(),
            _infoRow(theme, Icons.calendar_today, 'Joined',
                joinDate.toString().substring(0, 10)),
          ]),
        ),

        if (_canEdit()) ...[
          const SizedBox(height: 20),
          ElevatedButton.icon(
            onPressed: _deactivate,
            icon: const Icon(Icons.block, color: Colors.white),
            label: const Text('Deactivate Employee',
                style: TextStyle(color: Colors.white)),
            style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
                minimumSize: const Size.fromHeight(48)),
          ),
        ],
      ],
    );
  }

  Widget _buildProjects(FlutterFlowTheme theme) {
    if (_userProjects.isEmpty) {
      return Center(
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Icon(Icons.folder_off_outlined,
              size: 64, color: theme.secondaryText.withValues(alpha: 0.4)),
          const SizedBox(height: 16),
          Text('No projects assigned', style: theme.titleMedium),
        ]),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _userProjects.length,
      itemBuilder: (context, i) {
        final p = _userProjects[i];
        final progress = (p['progress'] ?? 0).toDouble();
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: theme.secondaryBackground,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: theme.alternate),
          ),
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Icon(Icons.folder_rounded, color: theme.primary, size: 18),
              const SizedBox(width: 8),
              Expanded(
                  child: Text(p['name'] ?? '',
                      style: theme.bodyMedium
                          .copyWith(fontWeight: FontWeight.bold))),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                    color: theme.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(6)),
                child: Text(p['status'] ?? '',
                    style: TextStyle(
                        color: theme.primary,
                        fontSize: 11,
                        fontWeight: FontWeight.bold)),
              ),
            ]),
            const SizedBox(height: 8),
            LinearProgressIndicator(
              value: progress / 100,
              backgroundColor: theme.alternate,
              color: theme.primary,
              borderRadius: BorderRadius.circular(4),
            ),
            const SizedBox(height: 4),
            Text('${progress.toInt()}% complete', style: theme.labelMedium),
          ]),
        );
      },
    );
  }

  Widget _buildGoals(FlutterFlowTheme theme) {
    if (_goals.isEmpty) {
      return Center(
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Icon(Icons.flag_outlined,
              size: 64, color: theme.secondaryText.withValues(alpha: 0.4)),
          const SizedBox(height: 16),
          Text('No goals assigned', style: theme.titleMedium),
          const SizedBox(height: 16),
          if (_canEdit())
            ElevatedButton.icon(
              onPressed: () =>
                  context.go('/goals/new?employeeId=${widget.employeeId}'),
              icon: const Icon(Icons.add),
              label: const Text('Add Goal'),
              style: ElevatedButton.styleFrom(
                  backgroundColor: theme.primary,
                  foregroundColor: Colors.white),
            ),
        ]),
      );
    }
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        if (_canEdit())
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: OutlinedButton.icon(
              onPressed: () =>
                  context.go('/goals/new?employeeId=${widget.employeeId}'),
              icon: const Icon(Icons.add),
              label: const Text('Add Goal'),
            ),
          ),
        ..._goals.map((g) => Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: theme.secondaryBackground,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(g['name'] ?? g['title'] ?? '',
                        style: theme.bodyMedium
                            .copyWith(fontWeight: FontWeight.w600)),
                    const SizedBox(height: 8),
                    LinearProgressIndicator(
                      value: (g['progress'] ?? 0) / 100,
                      backgroundColor: theme.alternate,
                      color: (g['progress'] ?? 0) >= 100
                          ? Colors.green
                          : theme.primary,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    const SizedBox(height: 4),
                    Text(
                        '${g['progress'] ?? 0}% — ${g['status'] ?? 'in progress'}',
                        style: theme.labelMedium),
                  ]),
            )),
      ],
    );
  }

  Widget _statBox(FlutterFlowTheme theme, IconData icon, String label,
          String val, Color color) =>
      Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
            color: theme.secondaryBackground,
            borderRadius: BorderRadius.circular(12)),
        child: Column(children: [
          Icon(icon, color: color, size: 22),
          const SizedBox(height: 6),
          Text(val,
              style: theme.bodyMedium.copyWith(fontWeight: FontWeight.bold)),
          Text(label, style: theme.labelMedium, textAlign: TextAlign.center),
        ]),
      );

  Widget _infoRow(
          FlutterFlowTheme t, IconData icon, String label, String value) =>
      Padding(
        padding: const EdgeInsets.symmetric(vertical: 6),
        child: Row(children: [
          Icon(icon, color: t.primary, size: 18),
          const SizedBox(width: 12),
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(label, style: t.labelMedium),
            Text(value, style: t.bodyMedium),
          ]),
        ]),
      );
}
