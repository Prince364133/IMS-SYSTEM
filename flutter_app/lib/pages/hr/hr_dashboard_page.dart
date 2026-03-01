import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../services/api_service.dart';
import '../../flutter_flow/flutter_flow_theme.dart';
import '../../widgets/nav_wrapper.dart';

// ─────────────────────────────────────────────────────────────────────────────
// HR Dashboard Page — mirrors HRMS Lite Dashboard.jsx
// API: GET /api/hrms/dashboard
// ─────────────────────────────────────────────────────────────────────────────

class HrDashboardPage extends StatefulWidget {
  const HrDashboardPage({super.key});

  @override
  State<HrDashboardPage> createState() => _HrDashboardPageState();
}

class _HrDashboardPageState extends State<HrDashboardPage> {
  final _api = ApiService();
  Map<String, dynamic>? _data;
  bool   _loading = true;
  String? _error;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final res = await _api.get('/hrms/dashboard');
      setState(() => _data = res);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally { setState(() => _loading = false); }
  }

  @override
  Widget build(BuildContext context) {
    final theme = FlutterFlowTheme.of(context);
    return NavWrapper(
      activeNav: 'hr',
      child: Scaffold(
        backgroundColor: theme.primaryBackground,
        appBar: AppBar(
          backgroundColor: theme.secondaryBackground,
          title: Text('HR Dashboard', style: theme.titleMedium),
        ),
        body: _loading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
                ? _buildError(theme)
                : RefreshIndicator(
                    onRefresh: _load,
                    child: ListView(
                      padding: const EdgeInsets.all(20),
                      children: [
                        // ── Attendance stat cards ──────────────────────────
                        Text('Today\'s Attendance', style: theme.titleMedium),
                        const SizedBox(height: 12),
                        _buildAttendanceRow(theme),
                        const SizedBox(height: 24),

                        // ── Employee summary ───────────────────────────────
                        Text('Workforce Overview', style: theme.titleMedium),
                        const SizedBox(height: 12),
                        Row(children: [
                          _statCard(theme,'Total Employees',
                            '${_data?['employees']?['total'] ?? 0}',
                            Icons.groups_rounded, theme.primary),
                          const SizedBox(width: 12),
                          _statCard(theme, 'Open Tasks',
                            '${_data?['openTasks'] ?? 0}',
                            Icons.check_circle_outline, theme.secondary),
                        ]),
                        const SizedBox(height: 24),

                        // ── Dept breakdown ─────────────────────────────────
                        _buildDeptBreakdown(theme),
                        const SizedBox(height: 24),

                        // ── Project overview ───────────────────────────────
                        _buildProjectSummary(theme),
                      ],
                    ),
                  ),
      ),
    );
  }

  Widget _buildAttendanceRow(FlutterFlowTheme t) {
    final att = (_data?['todayAttendance'] as Map?) ?? {};
    final cards = [
      ('Present',  att['present']  ?? 0, Colors.green),
      ('Absent',   att['absent']   ?? 0, Colors.red),
      ('Late',     att['late']     ?? 0, Colors.orange),
      ('Half Day', att['half_day'] ?? 0, Colors.purple),
      ('WFH',      att['work_from_home'] ?? 0, Colors.blue),
      ('Leave',    att['on_leave'] ?? 0, Colors.teal),
      ('Unmarked', att['unmarked'] ?? 0, Colors.grey),
    ];
    return SizedBox(
      height: 90,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: cards.length,
        separatorBuilder: (_, __) => const SizedBox(width: 10),
        itemBuilder: (_, i) {
          final (label, count, color) = cards[i];
          return Container(
            width: 90,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color:        t.secondaryBackground,
              borderRadius: BorderRadius.circular(14),
              border:       Border.all(color: color.withOpacity(0.3)),
            ),
            child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
              Text('$count', style: t.headlineSmall.copyWith(color: color, fontWeight: FontWeight.w800)),
              const SizedBox(height: 4),
              Text(label, style: t.labelMedium.copyWith(fontSize: 10), textAlign: TextAlign.center),
            ]),
          );
        },
      ),
    );
  }

  Widget _buildDeptBreakdown(FlutterFlowTheme t) {
    final dept = (_data?['employees']?['byDepartment'] as Map?) ?? {};
    if (dept.isEmpty) return const SizedBox.shrink();
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        Icon(Icons.business, color: t.secondary, size: 20),
        const SizedBox(width: 8),
        Text('Department Breakdown', style: t.titleMedium),
      ]),
      const SizedBox(height: 12),
      Wrap(
        spacing: 10, runSpacing: 10,
        children: dept.entries.map((e) => Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color:        t.secondaryBackground,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(children: [
            Text('${e.value}', style: t.headlineSmall),
            Text(e.key, style: t.labelMedium),
          ]),
        )).toList(),
      ),
    ]);
  }

  Widget _buildProjectSummary(FlutterFlowTheme t) {
    final p = (_data?['projects'] as Map?) ?? {};
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: t.secondaryBackground, borderRadius: BorderRadius.circular(14)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Icon(Icons.grain_sharp, color: t.primary, size: 20),
          const SizedBox(width: 8),
          Text('Projects', style: t.titleMedium),
        ]),
        const SizedBox(height: 14),
        Row(mainAxisAlignment: MainAxisAlignment.spaceAround, children: [
          _miniStat(t, 'Total',       '${p['total']      ?? 0}', t.primaryText),
          _miniStat(t, 'In Progress', '${p['inProgress'] ?? 0}', Colors.blue),
          _miniStat(t, 'Completed',   '${p['completed']  ?? 0}', Colors.green),
        ]),
      ]),
    );
  }

  Widget _statCard(FlutterFlowTheme t, String label, String val, IconData icon, Color color) =>
      Expanded(child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: t.secondaryBackground, borderRadius: BorderRadius.circular(14)),
        child: Row(children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
            child: Icon(icon, color: color, size: 22),
          ),
          const SizedBox(width: 12),
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(val,   style: t.headlineSmall),
            Text(label, style: t.labelMedium),
          ]),
        ]),
      ));

  Widget _miniStat(FlutterFlowTheme t, String label, String val, Color color) =>
      Column(children: [
        Text(val, style: t.headlineSmall.copyWith(color: color, fontWeight: FontWeight.w800)),
        Text(label, style: t.labelMedium),
      ]);

  Widget _buildError(FlutterFlowTheme t) => Center(child: Column(
    mainAxisAlignment: MainAxisAlignment.center,
    children: [
      Icon(Icons.error_outline, color: t.error, size: 48),
      const SizedBox(height: 12),
      Text(_error!, style: t.bodyMedium),
      const SizedBox(height: 16),
      ElevatedButton(onPressed: _load, child: const Text('Retry')),
    ],
  ));
}
