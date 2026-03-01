import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../services/api_service.dart';
import '../../flutter_flow/flutter_flow_theme.dart';

// ─────────────────────────────────────────────────────────────────────────────
// HR Employee Detail Page — mirrors HRMS Lite EmployeeDetail.jsx
// API: GET /api/users/:id  &  GET /api/attendance/employee/:id
// ─────────────────────────────────────────────────────────────────────────────

class HrEmployeeDetailPage extends StatefulWidget {
  final String userId;
  const HrEmployeeDetailPage({super.key, required this.userId});

  @override
  State<HrEmployeeDetailPage> createState() => _HrEmployeeDetailPageState();
}

class _HrEmployeeDetailPageState extends State<HrEmployeeDetailPage> {
  final _api              = ApiService();
  Map<String, dynamic>?   _user;
  List<dynamic>           _attendance = [];
  bool   _loading         = true;
  String? _selectedMonth;

  @override
  void initState() {
    super.initState();
    _selectedMonth = DateTime.now().toIso8601String().substring(0, 7);
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final [userRes, attRes] = await Future.wait([
        _api.get('/users/${widget.userId}'),
        _api.get('/attendance/employee/${widget.userId}?month=$_selectedMonth&limit=31'),
      ]);
      setState(() {
        _user       = userRes['user'];
        _attendance = attRes['records'] ?? [];
      });
    } finally { setState(() => _loading = false); }
  }

  // ─── Status presentation ────────────────────────────────────────────────
  Color _statusColor(String status) {
    switch (status) {
      case 'present':        return Colors.green;
      case 'absent':         return Colors.red;
      case 'late':           return Colors.orange;
      case 'half_day':       return Colors.purple;
      case 'work_from_home': return Colors.blue;
      case 'on_leave':       return Colors.teal;
      default:               return Colors.grey;
    }
  }

  IconData _statusIcon(String status) {
    switch (status) {
      case 'present':        return Icons.check_circle;
      case 'absent':         return Icons.cancel;
      case 'late':           return Icons.schedule;
      case 'half_day':       return Icons.timelapse;
      case 'work_from_home': return Icons.home_work_outlined;
      case 'on_leave':       return Icons.beach_access_outlined;
      default:               return Icons.help_outline;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = FlutterFlowTheme.of(context);
    return Scaffold(
      backgroundColor: theme.primaryBackground,
      appBar: AppBar(
        backgroundColor: theme.secondaryBackground,
        title: Text(_user?['name'] ?? 'Employee Profile', style: theme.titleMedium),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded),
          onPressed: () => context.go('/hr/employees'),
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsets.all(20),
                children: [
                  // ── Profile card ──────────────────────────────────────
                  _buildProfileCard(theme),
                  const SizedBox(height: 24),

                  // ── Month selector ──────────────────────────────────
                  _buildMonthSelector(theme),
                  const SizedBox(height: 12),

                  // ── Attendance summary ───────────────────────────────
                  _buildAttendanceSummary(theme),
                  const SizedBox(height: 16),

                  // ── Attendance history table ─────────────────────────
                  _buildAttendanceTable(theme),
                ],
              ),
            ),
    );
  }

  Widget _buildProfileCard(FlutterFlowTheme t) {
    final u          = _user!;
    final photoUrl   = u['photoUrl'] as String? ?? '';
    final name       = u['name'] as String? ?? '';
    final email      = u['email'] as String? ?? '';
    final dept       = u['department'] as String? ?? 'Unassigned';
    final pos        = u['position'] as String? ?? '';
    final empId      = u['employeeId'] as String? ?? '';
    final salary     = u['salary'] as num? ?? 0;
    final joinDate   = u['joinDate'] as String?;
    final leavebal   = u['leaveBalance'] as num? ?? 20;
    final isActive   = u['isActive'] as bool? ?? true;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color:        t.secondaryBackground,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)],
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // Header row
        Row(children: [
          CircleAvatar(
            radius: 36,
            backgroundColor: t.primary.withOpacity(0.1),
            backgroundImage: photoUrl.isNotEmpty ? NetworkImage(photoUrl) : null,
            child: photoUrl.isEmpty
                ? Text(name.isNotEmpty ? name[0].toUpperCase() : '?',
                    style: TextStyle(color: t.primary, fontWeight: FontWeight.w800, fontSize: 26))
                : null,
          ),
          const SizedBox(width: 16),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Expanded(child: Text(name, style: t.headlineSmall.copyWith(fontWeight: FontWeight.w700))),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color:        isActive ? Colors.green.withOpacity(0.1) : Colors.red.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(isActive ? 'Active' : 'Inactive',
                  style: TextStyle(color: isActive ? Colors.green : Colors.red, fontSize: 11, fontWeight: FontWeight.w700)),
              ),
            ]),
            const SizedBox(height: 4),
            Text(pos.isNotEmpty ? pos : dept, style: t.labelMedium),
            if (empId.isNotEmpty) Text(empId, style: t.labelMedium.copyWith(color: t.primary, fontWeight: FontWeight.w600)),
          ])),
        ]),
        Divider(height: 28, color: t.alternate),

        // Field grid
        _fieldGrid(t, [
          ('Email',         email,        Icons.email_outlined),
          ('Department',    dept,         Icons.business_outlined),
          ('Position',      pos.isEmpty ? 'N/A' : pos, Icons.work_outline),
          ('Employee ID',   empId.isEmpty ? 'N/A' : empId, Icons.badge_outlined),
          ('Salary',        salary == 0 ? 'N/A' : '₹${salary.toStringAsFixed(0)}', Icons.currency_rupee_outlined),
          ('Leave Balance', '$leavebal days', Icons.event_available_outlined),
          ('Join Date',     joinDate != null ? joinDate.substring(0, 10) : 'N/A', Icons.calendar_today_outlined),
        ]),
      ]),
    );
  }

  Widget _fieldGrid(FlutterFlowTheme t, List<(String, String, IconData)> fields) {
    return Wrap(spacing: 16, runSpacing: 12, children: fields.map((f) {
      final (label, val, icon) = f;
      return SizedBox(
        width: 200,
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Icon(icon, size: 16, color: t.secondaryText),
          const SizedBox(width: 8),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(label, style: t.labelMedium.copyWith(fontSize: 11)),
            Text(val, style: t.bodyMedium.copyWith(fontWeight: FontWeight.w600)),
          ])),
        ]),
      );
    }).toList());
  }

  Widget _buildMonthSelector(FlutterFlowTheme t) {
    // Generate last 12 months as YYYY-MM strings
    final months = List.generate(12, (i) {
      final d = DateTime.now().subtract(Duration(days: 30 * i));
      return '${d.year}-${d.month.toString().padLeft(2, '0')}';
    });

    return Row(children: [
      Text('Month:', style: t.bodyMedium),
      const SizedBox(width: 12),
      Expanded(child: DropdownButtonFormField<String>(
        value: _selectedMonth,
        items: months.map((m) => DropdownMenuItem(value: m, child: Text(m))).toList(),
        onChanged: (v) { setState(() => _selectedMonth = v); _load(); },
        decoration: InputDecoration(
          filled: true, fillColor: t.secondaryBackground,
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        ),
      )),
    ]);
  }

  Widget _buildAttendanceSummary(FlutterFlowTheme t) {
    final counts = <String, int>{
      'present': 0, 'absent': 0, 'late': 0,
      'half_day': 0, 'work_from_home': 0, 'on_leave': 0,
    };
    for (final r in _attendance) {
      final s = r['status'] as String? ?? '';
      if (counts.containsKey(s)) counts[s] = counts[s]! + 1;
    }
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: t.secondaryBackground, borderRadius: BorderRadius.circular(14)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('Month Summary', style: t.titleMedium.copyWith(fontWeight: FontWeight.w600)),
        const SizedBox(height: 12),
        Wrap(spacing: 10, runSpacing: 8, children: counts.entries.map((e) => Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
          decoration: BoxDecoration(
            color:        _statusColor(e.key).withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            Text('${e.value}', style: TextStyle(color: _statusColor(e.key), fontWeight: FontWeight.w800, fontSize: 16)),
            const SizedBox(width: 6),
            Text(e.key.replaceAll('_', ' '), style: TextStyle(color: _statusColor(e.key), fontSize: 11)),
          ]),
        )).toList()),
      ]),
    );
  }

  Widget _buildAttendanceTable(FlutterFlowTheme t) {
    if (_attendance.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: t.secondaryBackground, borderRadius: BorderRadius.circular(14),
          border: Border.all(color: t.alternate, style: BorderStyle.solid),
        ),
        child: Center(child: Column(children: [
          Icon(Icons.event_note_outlined, size: 48, color: t.secondaryText),
          const SizedBox(height: 12),
          Text('No attendance records for this month', style: t.labelMedium),
        ])),
      );
    }

    return Container(
      decoration: BoxDecoration(color: t.secondaryBackground, borderRadius: BorderRadius.circular(14)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
          child: Text('Attendance Records', style: t.titleMedium),
        ),
        ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: _attendance.length,
          separatorBuilder: (_, __) => Divider(height: 1, color: t.alternate),
          itemBuilder: (_, i) {
            final r      = _attendance[i];
            final status = r['status'] as String? ?? '';
            final color  = _statusColor(status);
            return ListTile(
              leading: CircleAvatar(
                radius: 18,
                backgroundColor: color.withOpacity(0.12),
                child: Icon(_statusIcon(status), size: 16, color: color),
              ),
              title: Text(r['date'] ?? '', style: t.bodyMedium.copyWith(fontWeight: FontWeight.w600)),
              subtitle: Row(children: [
                if ((r['checkIn'] as String? ?? '').isNotEmpty)
                  Text('In: ${r['checkIn']}', style: t.labelMedium),
                if ((r['checkOut'] as String? ?? '').isNotEmpty) ...[
                  const SizedBox(width: 10),
                  Text('Out: ${r['checkOut']}', style: t.labelMedium),
                ],
              ]),
              trailing: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                child: Text(status.replaceAll('_', ' '),
                  style: TextStyle(color: color, fontWeight: FontWeight.w700, fontSize: 12)),
              ),
            );
          },
        ),
      ]),
    );
  }
}
