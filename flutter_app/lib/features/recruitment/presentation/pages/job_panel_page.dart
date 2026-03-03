import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/network/api_service.dart';
import '../../../../flutter_flow/flutter_flow_theme.dart';
import '../../../../shared/widgets/nav_wrapper.dart';

class JobPanelPage extends StatefulWidget {
  const JobPanelPage({super.key});
  @override
  State<JobPanelPage> createState() => _JobPanelPageState();
}

class _JobPanelPageState extends State<JobPanelPage> {
  final _api = ApiService();
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
    return NavWrapper(
      activeNav: 'jobs',
      child: Scaffold(
        backgroundColor: theme.primaryBackground,
        appBar: AppBar(
            backgroundColor: theme.secondaryBackground,
            title: Text('Job Panel', style: theme.titleMedium)),
        body: _loading
            ? const Center(child: CircularProgressIndicator())
            : RefreshIndicator(
                onRefresh: _load,
                child: _jobs.isEmpty
                    ? Center(
                        child:
                            Text('No job postings', style: theme.labelMedium))
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _jobs.length,
                        itemBuilder: (_, i) {
                          final j = _jobs[i];
                          return Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                                color: theme.secondaryBackground,
                                borderRadius: BorderRadius.circular(12)),
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
                                          color: _statusColor(j['status'] ?? '')
                                              .withValues(alpha: 0.12),
                                          borderRadius:
                                              BorderRadius.circular(6)),
                                      child: Text(
                                          (j['status'] ?? '').toUpperCase(),
                                          style: TextStyle(
                                              color: _statusColor(
                                                  j['status'] ?? ''),
                                              fontSize: 11,
                                              fontWeight: FontWeight.w600)),
                                    ),
                                  ]),
                                  const SizedBox(height: 6),
                                  Text(j['department'] ?? '',
                                      style: theme.labelMedium),
                                  Text(
                                      '${(j['type'] ?? '').replaceAll('_', ' ')} • ${j['location'] ?? ''}',
                                      style: theme.labelMedium),
                                  const SizedBox(height: 10),
                                  Row(children: [
                                    Expanded(
                                        child: OutlinedButton(
                                      onPressed: () =>
                                          context.go('/jobs/${j['_id']}/apply'),
                                      child: const Text('View Applications'),
                                    )),
                                  ]),
                                ]),
                          );
                        },
                      ),
              ),
        floatingActionButton: FloatingActionButton.extended(
          backgroundColor: theme.primary,
          onPressed: () => _showCreateJob(context, theme),
          icon: const Icon(Icons.add, color: Colors.white),
          label: const Text('Post Job', style: TextStyle(color: Colors.white)),
        ),
      ),
    );
  }

  void _showCreateJob(BuildContext context, FlutterFlowTheme theme) {
    final titleCtrl = TextEditingController();
    final deptCtrl = TextEditingController();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: theme.secondaryBackground,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (_) => Padding(
        padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 20,
            bottom: MediaQuery.of(context).viewInsets.bottom + 20),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Text('Post New Job', style: theme.titleMedium),
          const SizedBox(height: 16),
          TextField(
              controller: titleCtrl,
              decoration: InputDecoration(
                  hintText: 'Job Title',
                  filled: true,
                  fillColor: theme.primaryBackground,
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8)))),
          const SizedBox(height: 10),
          TextField(
              controller: deptCtrl,
              decoration: InputDecoration(
                  hintText: 'Department',
                  filled: true,
                  fillColor: theme.primaryBackground,
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8)))),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () async {
              final nav = Navigator.of(context);
              await _api.post('/jobs',
                  {'title': titleCtrl.text, 'department': deptCtrl.text});
              if (mounted) {
                nav.pop();
                _load();
              }
            },
            style: ElevatedButton.styleFrom(
                backgroundColor: theme.primary,
                foregroundColor: Colors.white,
                minimumSize: const Size(double.infinity, 48)),
            child: const Text('Post Job'),
          ),
        ]),
      ),
    );
  }
}
