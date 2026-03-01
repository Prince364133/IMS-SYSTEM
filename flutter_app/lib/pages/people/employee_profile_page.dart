import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../services/api_service.dart';
import '../../flutter_flow/flutter_flow_theme.dart';

class EmployeeProfilePage extends StatefulWidget {
  final String employeeId;
  const EmployeeProfilePage({super.key, required this.employeeId});
  @override
  State<EmployeeProfilePage> createState() => _EmployeeProfilePageState();
}

class _EmployeeProfilePageState extends State<EmployeeProfilePage> {
  final _api = ApiService();
  Map<String, dynamic>? _user;
  List<dynamic> _goals = [];
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    try {
      final [userRes, goalsRes] = await Future.wait([
        _api.get('/users/${widget.employeeId}'),
        _api.get('/goals?employeeId=${widget.employeeId}'),
      ]);
      setState(() {
        _user  = userRes['user'];
        _goals = goalsRes['goals'] ?? [];
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = FlutterFlowTheme.of(context);
    if (_loading) return const Scaffold(body: Center(child: CircularProgressIndicator()));

    return Scaffold(
      backgroundColor: theme.primaryBackground,
      appBar: AppBar(
        backgroundColor: theme.secondaryBackground,
        title: Text(_user?['name'] ?? 'Employee', style: theme.titleMedium),
        leading: BackButton(onPressed: () => context.go('/team')),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // ── Profile avatar ─────────────────────────────────────────
          Center(
            child: Column(
              children: [
                CircleAvatar(
                  radius: 48,
                  backgroundImage: (_user?['photoUrl'] ?? '').isNotEmpty ? NetworkImage(_user!['photoUrl']) : null,
                  backgroundColor: theme.primary,
                  child: (_user?['photoUrl'] ?? '').isEmpty ? Text((_user?['name'] ?? 'U')[0], style: const TextStyle(color: Colors.white, fontSize: 28)) : null,
                ),
                const SizedBox(height: 12),
                Text(_user?['name'] ?? '', style: theme.headlineSmall),
                Text((_user?['role'] ?? '').toUpperCase(), style: TextStyle(color: theme.primary, fontWeight: FontWeight.w600)),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // ── Info cards ────────────────────────────────────────────
          _infoRow(theme, Icons.email_outlined,    'Email',      _user?['email']      ?? '-'),
          _infoRow(theme, Icons.phone_outlined,    'Phone',      _user?['phone']      ?? '-'),
          _infoRow(theme, Icons.business_outlined, 'Department', _user?['department'] ?? '-'),
          _infoRow(theme, Icons.work_outline,      'Position',   _user?['position']   ?? '-'),
          const SizedBox(height: 20),

          // ── Goals ─────────────────────────────────────────────────
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Goals & KPIs', style: theme.titleMedium),
              TextButton.icon(
                onPressed: () => context.go('/goals/new?employeeId=${widget.employeeId}'),
                icon: const Icon(Icons.add, size: 16),
                label: const Text('Add Goal'),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ..._goals.map((g) => Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(color: theme.secondaryBackground, borderRadius: BorderRadius.circular(10)),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(g['name'] ?? '', style: theme.bodyMedium.copyWith(fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              LinearProgressIndicator(
                value: (g['progress'] ?? 0) / 100,
                backgroundColor: theme.alternate,
                color: theme.primary,
                borderRadius: BorderRadius.circular(4),
              ),
              const SizedBox(height: 4),
              Text('Progress: ${g['progress'] ?? 0}%', style: theme.labelMedium),
            ]),
          )),
        ],
      ),
    );
  }

  Widget _infoRow(FlutterFlowTheme t, IconData icon, String label, String value) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: t.secondaryBackground, borderRadius: BorderRadius.circular(10)),
      child: Row(children: [
        Icon(icon, color: t.primary, size: 20),
        const SizedBox(width: 12),
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(label, style: t.labelMedium),
          Text(value,  style: t.bodyMedium),
        ]),
      ]),
    );
  }
}
