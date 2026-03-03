import 'package:flutter/material.dart';
import '../../../../core/network/api_service.dart';
import '../../../../flutter_flow/flutter_flow_theme.dart';
import '../../../../shared/widgets/nav_wrapper.dart';

const _kStatuses = [
  ('present', 'Present', Colors.green),
  ('absent', 'Absent', Colors.red),
  ('late', 'Late', Colors.orange),
  ('half_day', 'Half Day', Colors.purple),
  ('work_from_home', 'WFH', Colors.blue),
  ('on_leave', 'On Leave', Colors.teal),
];

class AmsPageWidget extends StatefulWidget {
  const AmsPageWidget({super.key});
  static const routeName = '/ams';

  @override
  State<AmsPageWidget> createState() => _AmsPageWidgetState();
}

class _AmsPageWidgetState extends State<AmsPageWidget>
    with SingleTickerProviderStateMixin {
  late TabController _tabs;
  final _api = ApiService();
  List<dynamic> _employees = [];
  List<dynamic> _todayRecords = [];
  bool _loadingEmp = true;
  bool _loadingToday = true;
  String _date = DateTime.now().toIso8601String().substring(0, 10);
  final Map<String, String> _pending = {}; // userId → status
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
    _loadAll();
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  Future<void> _loadAll() async {
    await Future.wait([_loadEmployees(), _loadToday()]);
  }

  Future<void> _loadEmployees() async {
    if (mounted) setState(() => _loadingEmp = true);
    try {
      final res = await _api.get('/users?role=employee&isActive=true');
      if (mounted) setState(() => _employees = res['users'] ?? []);
    } finally {
      if (mounted) setState(() => _loadingEmp = false);
    }
  }

  Future<void> _loadToday() async {
    if (mounted) setState(() => _loadingToday = true);
    try {
      final res = await _api.get('/attendance/today');
      final records = res['records'] as List? ?? [];
      if (mounted) {
        setState(() {
          _todayRecords = records;
          for (final r in records) {
            final empId = r['employee']?['_id'] as String? ??
                r['employee'] as String? ??
                '';
            if (empId.isNotEmpty)
              _pending[empId] = r['status'] as String? ?? '';
          }
        });
      }
    } finally {
      if (mounted) setState(() => _loadingToday = false);
    }
  }

  Future<void> _saveAll() async {
    if (_pending.isEmpty) return;
    if (mounted) setState(() => _saving = true);

    int saved = 0;
    int failed = 0;
    for (final entry in _pending.entries) {
      if (entry.value.isEmpty) continue;
      try {
        await _api.post('/attendance', {
          'employee': entry.key,
          'date': _date,
          'status': entry.value,
        });
        saved++;
      } on ApiException catch (e) {
        if (e.statusCode == 409) {
          try {
            final existing = _todayRecords.firstWhere(
              (r) => (r['employee']?['_id'] ?? r['employee']) == entry.key,
              orElse: () => null,
            );
            if (existing != null) {
              await _api.put(
                  '/attendance/${existing['_id']}', {'status': entry.value});
              saved++;
            }
          } catch (_) {
            failed++;
          }
        } else {
          failed++;
        }
      }
    }

    if (mounted) setState(() => _saving = false);
    _loadToday();

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(failed == 0
            ? '✅ Attendance saved for $saved employee${saved != 1 ? 's' : ''}'
            : '⚠️ Saved $saved, failed $failed'),
        backgroundColor: failed == 0 ? Colors.green : Colors.orange,
      ));
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = FlutterFlowTheme.of(context);
    return NavWrapper(
      activeNav: 'ams',
      child: Scaffold(
        backgroundColor: theme.primaryBackground,
        appBar: AppBar(
          backgroundColor: theme.secondaryBackground,
          title: Text('AMS — Attendance', style: theme.titleMedium),
          actions: [
            if (_pending.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(right: 8),
                child: FilledButton.icon(
                  style: FilledButton.styleFrom(backgroundColor: theme.primary),
                  onPressed: _saving ? null : _saveAll,
                  icon: _saving
                      ? const SizedBox(
                          width: 14,
                          height: 14,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: Colors.white))
                      : const Icon(Icons.save_outlined, size: 18),
                  label: Text(
                      'Save (${_pending.values.where((v) => v.isNotEmpty).length})'),
                ),
              ),
          ],
          bottom: TabBar(
            controller: _tabs,
            indicatorColor: theme.primary,
            labelColor: theme.primary,
            unselectedLabelColor: theme.secondaryText,
            tabs: const [
              Tab(text: 'Mark Attendance'),
              Tab(text: 'Today\'s Report')
            ],
          ),
        ),
        body: TabBarView(controller: _tabs, children: [
          _buildMarkTab(theme),
          _buildReportTab(theme),
        ]),
      ),
    );
  }

  Widget _buildMarkTab(FlutterFlowTheme t) {
    return Column(children: [
      GestureDetector(
        onTap: () async {
          final d = await showDatePicker(
            context: context,
            initialDate: DateTime.parse(_date),
            firstDate: DateTime.now().subtract(const Duration(days: 30)),
            lastDate: DateTime.now(),
          );
          if (d != null) {
            setState(() {
              _date = d.toIso8601String().substring(0, 10);
              _pending.clear();
            });
            _loadToday();
          }
        },
        child: Container(
          margin: const EdgeInsets.all(16),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: t.primary.withOpacity(0.08),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: t.primary.withOpacity(0.2)),
          ),
          child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            Icon(Icons.calendar_today_outlined, color: t.primary, size: 18),
            const SizedBox(width: 8),
            Text('Marking for: $_date',
                style: t.bodyMedium
                    .copyWith(color: t.primary, fontWeight: FontWeight.w600)),
            const SizedBox(width: 6),
            Icon(Icons.edit_outlined, size: 14, color: t.primary),
          ]),
        ),
      ),
      Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Wrap(
            spacing: 6,
            runSpacing: 4,
            children: _kStatuses.map((s) {
              final (_, label, color) = s;
              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                    color: color.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(6)),
                child: Text(label,
                    style: TextStyle(
                        color: color,
                        fontSize: 11,
                        fontWeight: FontWeight.w600)),
              );
            }).toList()),
      ),
      const SizedBox(height: 8),
      Expanded(
          child: _loadingEmp
              ? const Center(child: CircularProgressIndicator())
              : _employees.isEmpty
                  ? Center(
                      child: Text('No active employees found',
                          style: t.labelMedium))
                  : ListView.builder(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 80),
                      itemCount: _employees.length,
                      itemBuilder: (_, i) {
                        final emp = _employees[i];
                        final empId = emp['_id'] as String? ?? '';
                        final status = _pending[empId] ?? '';
                        return _employeeAttendRow(t, emp, empId, status);
                      },
                    )),
    ]);
  }

  Widget _employeeAttendRow(
      FlutterFlowTheme t, dynamic emp, String empId, String currentStatus) {
    final name = emp['name'] as String? ?? '';
    final photo = emp['photoUrl'] as String? ?? '';
    final dept = emp['department'] as String? ?? '';

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
          color: t.secondaryBackground,
          borderRadius: BorderRadius.circular(12)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          CircleAvatar(
            radius: 20,
            backgroundColor: t.accent1,
            backgroundImage: photo.isNotEmpty ? NetworkImage(photo) : null,
            child: photo.isEmpty
                ? Text(name.isNotEmpty ? name[0].toUpperCase() : '?',
                    style: TextStyle(
                        color: t.primary, fontWeight: FontWeight.w700))
                : null,
          ),
          const SizedBox(width: 10),
          Expanded(
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                Text(name,
                    style: t.bodyMedium.copyWith(fontWeight: FontWeight.w600)),
                if (dept.isNotEmpty)
                  Text(dept, style: t.labelMedium.copyWith(fontSize: 11)),
              ])),
          Row(mainAxisSize: MainAxisSize.min, children: [
            _quickBtn(t, '✓', Colors.green, currentStatus == 'present',
                () => _mark(empId, 'present')),
            const SizedBox(width: 4),
            _quickBtn(t, '✗', Colors.red, currentStatus == 'absent',
                () => _mark(empId, 'absent')),
          ]),
        ]),
        const SizedBox(height: 8),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
              children: _kStatuses.map((s) {
            final (key, label, color) = s;
            final isSelected = currentStatus == key;
            return Padding(
              padding: const EdgeInsets.only(right: 6),
              child: GestureDetector(
                onTap: () => _mark(empId, key),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: isSelected ? color : color.withOpacity(0.08),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                        color: isSelected ? color : color.withOpacity(0.3)),
                  ),
                  child: Text(label,
                      style: TextStyle(
                        color: isSelected ? Colors.white : color,
                        fontWeight:
                            isSelected ? FontWeight.w800 : FontWeight.w500,
                        fontSize: 12,
                      )),
                ),
              ),
            );
          }).toList()),
        ),
      ]),
    );
  }

  void _mark(String empId, String status) {
    setState(() {
      if (_pending[empId] == status) {
        _pending.remove(empId);
      } else {
        _pending[empId] = status;
      }
    });
  }

  Widget _quickBtn(FlutterFlowTheme t, String label, Color color, bool active,
          VoidCallback onTap) =>
      GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 120),
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: active ? color : color.withOpacity(0.1),
            shape: BoxShape.circle,
          ),
          child: Center(
              child: Text(label,
                  style: TextStyle(
                      color: active ? Colors.white : color,
                      fontWeight: FontWeight.w800,
                      fontSize: 14))),
        ),
      );

  Widget _buildReportTab(FlutterFlowTheme t) {
    if (_loadingToday) return const Center(child: CircularProgressIndicator());
    final counts = <String, int>{};
    for (final (k, _, _) in _kStatuses) {
      counts[k] = 0;
    }

    for (final r in _todayRecords) {
      final s = r['status'] as String? ?? '';
      if (counts.containsKey(s)) counts[s] = counts[s]! + 1;
    }
    final total = _employees.length;
    final marked = _todayRecords.length;
    final unmarked = total - marked;

    return Column(children: [
      Container(
        margin: const EdgeInsets.all(16),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
            color: t.secondaryBackground,
            borderRadius: BorderRadius.circular(14)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text('$_date Report', style: t.titleMedium),
            Text('$marked/$total marked',
                style: t.labelMedium.copyWith(color: t.primary)),
          ]),
          const SizedBox(height: 12),
          Wrap(spacing: 8, runSpacing: 8, children: [
            ..._kStatuses.map((s) {
              final (key, label, color) = s;
              final c = counts[key] ?? 0;
              if (c == 0) return const SizedBox.shrink();
              return _summaryChip(t, label, c, color);
            }),
            if (unmarked > 0)
              _summaryChip(t, 'Unmarked', unmarked, Colors.grey),
          ]),
        ]),
      ),
      Expanded(
          child: _todayRecords.isEmpty
              ? Center(
                  child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                      Icon(Icons.event_note_outlined,
                          size: 64, color: t.secondaryText),
                      const SizedBox(height: 12),
                      Text('No attendance marked yet today',
                          style: t.labelMedium),
                    ]))
              : RefreshIndicator(
                  onRefresh: _loadToday,
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: _todayRecords.length,
                    itemBuilder: (_, i) {
                      final r = _todayRecords[i];
                      final emp = r['employee'] as Map? ?? {};
                      final status = r['status'] as String? ?? '';
                      final color = _kStatuses
                          .firstWhere((s) => s.$1 == status,
                              orElse: () => ('', '', Colors.grey))
                          .$3;
                      return Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                            color: t.secondaryBackground,
                            borderRadius: BorderRadius.circular(12)),
                        child: Row(children: [
                          CircleAvatar(
                            radius: 18,
                            backgroundColor: color.withOpacity(0.12),
                            child: Text(
                              (emp['name'] as String? ?? '?')[0].toUpperCase(),
                              style: TextStyle(
                                  color: color, fontWeight: FontWeight.w700),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                              child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                Text(emp['name'] ?? '',
                                    style: t.bodyMedium
                                        .copyWith(fontWeight: FontWeight.w600)),
                                Text(
                                    emp['department'] ??
                                        emp['employeeId'] ??
                                        '',
                                    style: t.labelMedium),
                              ])),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                                color: color.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(8)),
                            child: Text(status.replaceAll('_', ' '),
                                style: TextStyle(
                                    color: color,
                                    fontWeight: FontWeight.w700,
                                    fontSize: 12)),
                          ),
                        ]),
                      );
                    },
                  ),
                )),
    ]);
  }

  Widget _summaryChip(
          FlutterFlowTheme t, String label, int count, Color color) =>
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8)),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Text('$count',
              style: TextStyle(
                  color: color, fontWeight: FontWeight.w800, fontSize: 16)),
          const SizedBox(width: 6),
          Text(label, style: TextStyle(color: color, fontSize: 12)),
        ]),
      );
}
