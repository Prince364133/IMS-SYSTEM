import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/network/api_service.dart';
import '../../../../flutter_flow/flutter_flow_theme.dart';
import '../../../../shared/widgets/nav_wrapper.dart';

class HrEmployeesPage extends StatefulWidget {
  const HrEmployeesPage({super.key});

  @override
  State<HrEmployeesPage> createState() => _HrEmployeesPageState();
}

class _HrEmployeesPageState extends State<HrEmployeesPage> {
  final _api = ApiService();
  final _searchCtrl = TextEditingController();
  List<dynamic> _employees = [];
  bool _loading = true;
  String _dept = '';
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    if (mounted) {
      setState(() {
        _loading = true;
        _error = null;
      });
    }
    try {
      final qs = <String>[];
      qs.add('role=employee');
      if (_searchCtrl.text.trim().isNotEmpty) {
        qs.add('search=${_searchCtrl.text.trim()}');
      }
      if (_dept.isNotEmpty) qs.add('department=$_dept');
      final res = await _api.get('/users?${qs.join('&')}');
      if (mounted) setState(() => _employees = res['users'] ?? []);
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _confirmDelete(dynamic emp) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Delete Employee'),
        content: Text(
            'Are you sure you want to remove ${emp['name']}? This cannot be undone.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text('Delete',
                style: TextStyle(color: FlutterFlowTheme.of(context).error)),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await _api.delete('/users/${emp['_id']}');
      _load();
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(e.message)));
      }
    }
  }

  List<String> get _departments {
    final depts = _employees
        .map((e) => e['department'] as String? ?? '')
        .where((d) => d.isNotEmpty)
        .toSet()
        .toList()
      ..sort();
    return ['', ...depts];
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
          title: Text('Employees (${_employees.length})',
              style: theme.titleMedium),
          actions: [
            IconButton(
              icon: const Icon(Icons.person_add_outlined),
              onPressed: () => context.go('/team/new'),
              tooltip: 'Add Employee',
            ),
          ],
        ),
        body: Column(children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 6),
            child: TextField(
              controller: _searchCtrl,
              onSubmitted: (_) => _load(),
              onChanged: (_) {
                if (_searchCtrl.text.isEmpty) _load();
              },
              decoration: InputDecoration(
                hintText: 'Search by name...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _searchCtrl.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchCtrl.clear();
                          _load();
                        })
                    : null,
                filled: true,
                fillColor: theme.secondaryBackground,
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none),
              ),
            ),
          ),
          if (_departments.length > 1)
            SizedBox(
                height: 44,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  children: _departments
                      .map((d) => Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: ChoiceChip(
                              label: Text(d.isEmpty ? 'All' : d),
                              selected: _dept == d,
                              onSelected: (_) {
                                setState(() => _dept = d);
                                _load();
                              },
                              selectedColor: theme.primary,
                              labelStyle: TextStyle(
                                color: _dept == d
                                    ? Colors.white
                                    : theme.primaryText,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ))
                      .toList(),
                )),
          Expanded(
              child: _loading
                  ? const Center(child: CircularProgressIndicator())
                  : _error != null
                      ? Center(
                          child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                              Icon(Icons.error_outline,
                                  size: 48, color: theme.error),
                              const SizedBox(height: 12),
                              Text(_error!, style: theme.bodyMedium),
                              ElevatedButton(
                                  onPressed: _load, child: const Text('Retry')),
                            ]))
                      : _employees.isEmpty
                          ? Center(
                              child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                  Icon(Icons.people_outline,
                                      size: 64, color: theme.secondaryText),
                                  const SizedBox(height: 12),
                                  Text('No employees found',
                                      style: theme.labelMedium),
                                ]))
                          : RefreshIndicator(
                              onRefresh: _load,
                              child: ListView.builder(
                                padding:
                                    const EdgeInsets.fromLTRB(16, 8, 16, 80),
                                itemCount: _employees.length,
                                itemBuilder: (_, i) =>
                                    _employeeTile(theme, _employees[i]),
                              ),
                            )),
        ]),
        floatingActionButton: FloatingActionButton.extended(
          backgroundColor: theme.primary,
          onPressed: () => context.go('/team/new'),
          icon: const Icon(Icons.person_add, color: Colors.white),
          label:
              const Text('Add Employee', style: TextStyle(color: Colors.white)),
        ),
      ),
    );
  }

  Widget _employeeTile(FlutterFlowTheme t, dynamic emp) {
    final name = emp['name'] as String? ?? '';
    final email = emp['email'] as String? ?? '';
    final dept = emp['department'] as String? ?? 'Unassigned';
    final empId = emp['employeeId'] as String? ?? '';
    final photoUrl = emp['photoUrl'] as String? ?? '';
    final isActive = emp['isActive'] as bool? ?? true;

    return GestureDetector(
      onTap: () => context.go('/hr/employees/${emp['_id']}'),
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: t.secondaryBackground,
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8)
          ],
        ),
        child: Row(children: [
          CircleAvatar(
            radius: 24,
            backgroundColor: t.primary.withValues(alpha: 0.1),
            backgroundImage:
                photoUrl.isNotEmpty ? NetworkImage(photoUrl) : null,
            child: photoUrl.isEmpty
                ? Text(name.isNotEmpty ? name[0].toUpperCase() : '?',
                    style: TextStyle(
                        color: t.primary,
                        fontWeight: FontWeight.w700,
                        fontSize: 16))
                : null,
          ),
          const SizedBox(width: 14),
          Expanded(
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                Row(children: [
                  Expanded(
                      child: Text(name,
                          style: t.bodyMedium
                              .copyWith(fontWeight: FontWeight.w700))),
                  if (!isActive) _badge('Inactive', Colors.red),
                ]),
                const SizedBox(height: 2),
                Text(email, style: t.labelMedium),
                const SizedBox(height: 4),
                Row(children: [
                  Icon(Icons.business_outlined,
                      size: 12, color: t.secondaryText),
                  const SizedBox(width: 4),
                  Text(dept, style: t.labelMedium.copyWith(fontSize: 11)),
                  if (empId.isNotEmpty) ...[
                    const SizedBox(width: 12),
                    Text(empId,
                        style: t.labelMedium.copyWith(
                            fontSize: 11,
                            color: t.primary,
                            fontWeight: FontWeight.w600)),
                  ],
                ]),
              ])),
          PopupMenuButton<String>(
            icon: Icon(Icons.more_vert, color: t.secondaryText),
            onSelected: (action) {
              if (action == 'view') context.go('/hr/employees/${emp['_id']}');
              if (action == 'attend') context.go('/ams');
              if (action == 'delete') _confirmDelete(emp);
            },
            itemBuilder: (_) => [
              const PopupMenuItem(value: 'view', child: Text('View Profile')),
              const PopupMenuItem(
                  value: 'attend', child: Text('Mark Attendance')),
              const PopupMenuItem(
                  value: 'delete',
                  child: Text('Delete', style: TextStyle(color: Colors.red))),
            ],
          ),
        ]),
      ),
    );
  }

  Widget _badge(String label, Color color) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(6)),
        child: Text(label,
            style: TextStyle(
                color: color, fontSize: 10, fontWeight: FontWeight.w700)),
      );
}
