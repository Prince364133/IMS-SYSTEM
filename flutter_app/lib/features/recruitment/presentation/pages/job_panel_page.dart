import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/network/api_service.dart';
import '../../../../core/di/service_locator.dart';
import '../../../../flutter_flow/flutter_flow_theme.dart';
import '../../../../shared/widgets/nav_wrapper.dart';
import '../../../auth/application/auth_provider.dart';

class JobPanelPage extends ConsumerStatefulWidget {
  const JobPanelPage({super.key});

  @override
  ConsumerState<JobPanelPage> createState() => _JobPanelPageState();
}

class _JobPanelPageState extends ConsumerState<JobPanelPage> {
  final _api = locator<ApiService>();
  List<dynamic> _jobs = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    if (mounted) setState(() => _loading = true);
    try {
      final res = await _api.get('/jobs');
      if (mounted) setState(() => _jobs = res['jobs'] ?? []);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  bool _canManage() {
    final role = ref.read(authProvider).user?.role;
    return role == 'admin' || role == 'hr';
  }

  Future<void> _deleteJob(String id) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Job'),
        content: const Text('This will permanently remove the job posting.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
    if (confirm == true) {
      try {
        await _api.delete('/jobs/$id');
        _load();
      } catch (e) {
        if (mounted)
          ScaffoldMessenger.of(context)
              .showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  Color _statusColor(String s) {
    switch (s) {
      case 'open':
        return Colors.green;
      case 'closed':
        return Colors.red;
      case 'paused':
        return Colors.orange;
      case 'filled':
        return Colors.blue;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = FlutterFlowTheme.of(context);
    final canMgr = _canManage();

    return NavWrapper(
      activeNav: 'jobs',
      child: Scaffold(
        backgroundColor: theme.primaryBackground,
        appBar: AppBar(
          backgroundColor: theme.secondaryBackground,
          title: Text('Job Panel', style: theme.titleMedium),
        ),
        body: _loading
            ? const Center(child: CircularProgressIndicator())
            : RefreshIndicator(
                onRefresh: _load,
                child: _jobs.isEmpty
                    ? Center(
                        child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.work_off_outlined,
                                  size: 64,
                                  color: theme.secondaryText
                                      .withValues(alpha: 0.4)),
                              const SizedBox(height: 16),
                              Text('No job postings yet',
                                  style: theme.titleMedium),
                              if (canMgr) ...[
                                const SizedBox(height: 16),
                                ElevatedButton.icon(
                                  onPressed: () => _showJobForm(context, theme),
                                  icon: const Icon(Icons.add),
                                  label: const Text('Post a Job'),
                                  style: ElevatedButton.styleFrom(
                                      backgroundColor: theme.primary,
                                      foregroundColor: Colors.white),
                                )
                              ],
                            ]),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _jobs.length,
                        itemBuilder: (_, i) {
                          final j = _jobs[i];
                          final id = j['_id'] ?? j['id'] ?? '';
                          final sc = _statusColor(j['status'] ?? '');
                          return Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: theme.secondaryBackground,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: theme.alternate),
                            ),
                            child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(children: [
                                    Expanded(
                                        child: Text(j['title'] ?? '',
                                            style: theme.titleMedium)),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                          color: sc.withValues(alpha: 0.12),
                                          borderRadius:
                                              BorderRadius.circular(6)),
                                      child: Text(
                                          (j['status'] ?? '').toUpperCase(),
                                          style: TextStyle(
                                              color: sc,
                                              fontSize: 11,
                                              fontWeight: FontWeight.w600)),
                                    ),
                                    if (canMgr)
                                      PopupMenuButton<String>(
                                        icon: Icon(Icons.more_vert,
                                            size: 18,
                                            color: theme.secondaryText),
                                        onSelected: (val) async {
                                          if (val == 'delete')
                                            await _deleteJob(id);
                                          if (val == 'edit')
                                            _showJobForm(context, theme,
                                                job: j);
                                        },
                                        itemBuilder: (_) => [
                                          const PopupMenuItem(
                                              value: 'edit',
                                              child: Text('Edit')),
                                          const PopupMenuItem(
                                              value: 'delete',
                                              child: Text('Delete',
                                                  style: TextStyle(
                                                      color: Colors.red))),
                                        ],
                                      ),
                                  ]),
                                  const SizedBox(height: 6),
                                  if ((j['department'] ?? '').isNotEmpty)
                                    Text(j['department'],
                                        style: theme.labelMedium),
                                  Text(
                                    [
                                      (j['employment_type'] ?? j['type'] ?? '')
                                          .toString()
                                          .replaceAll('_', ' '),
                                      j['location'] ?? '',
                                      if (j['salary_range'] != null)
                                        j['salary_range'],
                                    ].where((s) => s.isNotEmpty).join(' • '),
                                    style: theme.labelMedium,
                                  ),
                                  if ((j['description'] ?? '').isNotEmpty) ...[
                                    const SizedBox(height: 8),
                                    Text(j['description'],
                                        style: theme.bodyMedium,
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis),
                                  ],
                                  const SizedBox(height: 10),
                                  Row(children: [
                                    Expanded(
                                      child: OutlinedButton.icon(
                                        onPressed: () =>
                                            context.go('/jobs/$id/apply'),
                                        icon: const Icon(Icons.people_outline,
                                            size: 16),
                                        label: const Text('View Applicants'),
                                      ),
                                    ),
                                    if (canMgr) ...[
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: FilledButton.icon(
                                          style: FilledButton.styleFrom(
                                              backgroundColor: theme.primary),
                                          onPressed: () => _showJobForm(
                                              context, theme,
                                              job: j),
                                          icon: const Icon(Icons.edit,
                                              size: 16, color: Colors.white),
                                          label: const Text('Edit',
                                              style: TextStyle(
                                                  color: Colors.white)),
                                        ),
                                      ),
                                    ],
                                  ]),
                                ]),
                          );
                        },
                      ),
              ),
        floatingActionButton: canMgr
            ? FloatingActionButton.extended(
                backgroundColor: theme.primary,
                onPressed: () => _showJobForm(context, theme),
                icon: const Icon(Icons.add, color: Colors.white),
                label: const Text('Post Job',
                    style: TextStyle(color: Colors.white)),
              )
            : null,
      ),
    );
  }

  void _showJobForm(BuildContext context, FlutterFlowTheme theme, {Map? job}) {
    final isEdit = job != null;
    final titleCtrl = TextEditingController(text: job?['title'] ?? '');
    final descCtrl = TextEditingController(text: job?['description'] ?? '');
    final deptCtrl = TextEditingController(text: job?['department'] ?? '');
    final locCtrl = TextEditingController(text: job?['location'] ?? '');
    final salaryCtrl = TextEditingController(text: job?['salary_range'] ?? '');
    final reqCtrl = TextEditingController(text: job?['requirements'] ?? '');
    String empType = job?['employment_type'] ?? job?['type'] ?? 'full_time';

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
            bottom: MediaQuery.of(context).viewInsets.bottom + 20,
          ),
          child: SingleChildScrollView(
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Text(isEdit ? 'Edit Job' : 'Post New Job',
                    style: theme.titleMedium),
                IconButton(
                    onPressed: () => Navigator.pop(ctx),
                    icon: const Icon(Icons.close)),
              ]),
              const SizedBox(height: 16),

              _field(titleCtrl, 'Job Title *', theme),
              const SizedBox(height: 10),
              _field(deptCtrl, 'Department', theme),
              const SizedBox(height: 10),
              _field(locCtrl, 'Location', theme),
              const SizedBox(height: 10),
              _field(salaryCtrl, 'Salary Range (e.g. Rs 12-20 LPA)', theme),
              const SizedBox(height: 10),

              // Employment type
              DropdownButtonFormField<String>(
                value: empType,
                decoration: InputDecoration(
                  labelText: 'Employment Type',
                  filled: true,
                  fillColor: theme.primaryBackground,
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8)),
                ),
                items: const [
                  DropdownMenuItem(
                      value: 'full_time', child: Text('Full Time')),
                  DropdownMenuItem(
                      value: 'part_time', child: Text('Part Time')),
                  DropdownMenuItem(value: 'contract', child: Text('Contract')),
                  DropdownMenuItem(
                      value: 'internship', child: Text('Internship')),
                ],
                onChanged: (v) => setModal(() => empType = v ?? empType),
              ),
              const SizedBox(height: 10),

              _field(reqCtrl, 'Requirements', theme, maxLines: 3),
              const SizedBox(height: 10),
              _field(descCtrl, 'Description', theme, maxLines: 4),
              const SizedBox(height: 16),

              ElevatedButton(
                onPressed: () async {
                  if (titleCtrl.text.trim().isEmpty) return;
                  final nav = Navigator.of(ctx);
                  final payload = {
                    'title': titleCtrl.text.trim(),
                    'description': descCtrl.text.trim(),
                    'department': deptCtrl.text.trim(),
                    'location': locCtrl.text.trim(),
                    'salary_range': salaryCtrl.text.trim(),
                    'requirements': reqCtrl.text.trim(),
                    'employment_type': empType,
                    'is_active': true,
                  };
                  try {
                    if (isEdit) {
                      await _api.put(
                          '/jobs/${job!['_id'] ?? job['id']}', payload);
                    } else {
                      await _api.post('/jobs', payload);
                    }
                    nav.pop();
                    _load();
                  } catch (e) {
                    if (mounted)
                      ScaffoldMessenger.of(context)
                          .showSnackBar(SnackBar(content: Text('Error: $e')));
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: theme.primary,
                  foregroundColor: Colors.white,
                  minimumSize: const Size(double.infinity, 48),
                ),
                child: Text(isEdit ? 'Update Job' : 'Post Job'),
              ),
            ]),
          ),
        ),
      ),
    );
  }

  Widget _field(TextEditingController ctrl, String hint, FlutterFlowTheme theme,
          {int maxLines = 1}) =>
      TextField(
        controller: ctrl,
        maxLines: maxLines,
        decoration: InputDecoration(
          hintText: hint,
          filled: true,
          fillColor: theme.primaryBackground,
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        ),
      );
}
