import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../services/api_service.dart';
import '../../flutter_flow/flutter_flow_theme.dart';
import '../../widgets/nav_wrapper.dart';

class ProjectListPage extends StatefulWidget {
  const ProjectListPage({super.key});
  @override
  State<ProjectListPage> createState() => _ProjectListPageState();
}

class _ProjectListPageState extends State<ProjectListPage> {
  final _api            = ApiService();
  final _searchCtrl     = TextEditingController();
  List<dynamic> _projects = [];
  bool   _loading        = true;
  String _statusFilter   = '';

  final _statuses = ['', 'not_started', 'in_progress', 'on_hold', 'completed'];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final q = [
        if (_statusFilter.isNotEmpty) 'status=$_statusFilter',
        if (_searchCtrl.text.isNotEmpty) 'search=${_searchCtrl.text}',
      ].join('&');
      final res = await _api.get('/projects${q.isEmpty ? '' : '?$q'}');
      setState(() => _projects = res['projects'] ?? []);
    } finally {
      setState(() => _loading = false);
    }
  }

  Color _statusColor(String s) {
    switch (s) {
      case 'completed':  return Colors.green;
      case 'in_progress': return Colors.blue;
      case 'on_hold':    return Colors.orange;
      case 'cancelled':  return Colors.red;
      default:           return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = FlutterFlowTheme.of(context);
    return NavWrapper(
      activeNav: 'projects',
      child: Scaffold(
        backgroundColor: theme.primaryBackground,
        appBar: AppBar(
          backgroundColor: theme.secondaryBackground,
          title: Text('Projects', style: theme.titleMedium),
          actions: [
            IconButton(
              icon: const Icon(Icons.add),
              onPressed: () => context.go('/projects/new'),
            ),
          ],
        ),
        body: Column(
          children: [
            // ── Search ────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.all(16),
              child: TextField(
                controller: _searchCtrl,
                onSubmitted: (_) => _load(),
                decoration: InputDecoration(
                  hintText:  'Search projects...',
                  prefixIcon: const Icon(Icons.search),
                  filled:    true,
                  fillColor: theme.secondaryBackground,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
                ),
              ),
            ),
            // ── Status filter chips ────────────────────────────────────
            SizedBox(
              height: 40,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                children: _statuses.map((s) {
                  final label = s.isEmpty ? 'All' : s.replaceAll('_', ' ').toUpperCase();
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label:    Text(label),
                      selected: _statusFilter == s,
                      onSelected: (_) {
                        setState(() => _statusFilter = s);
                        _load();
                      },
                      selectedColor: theme.primary,
                      labelStyle: TextStyle(
                        color: _statusFilter == s ? Colors.white : theme.primaryText,
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
            const SizedBox(height: 8),
            // ── List ────────────────────────────────────────────────────
            Expanded(
              child: _loading
                  ? const Center(child: CircularProgressIndicator())
                  : _projects.isEmpty
                      ? Center(child: Text('No projects found', style: theme.labelMedium))
                      : RefreshIndicator(
                          onRefresh: _load,
                          child: ListView.builder(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            itemCount: _projects.length,
                            itemBuilder: (_, i) {
                              final p = _projects[i];
                              return GestureDetector(
                                onTap: () => context.go('/projects/${p['_id']}'),
                                child: Container(
                                  margin: const EdgeInsets.only(bottom: 12),
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(
                                    color:        theme.secondaryBackground,
                                    borderRadius: BorderRadius.circular(14),
                                    boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 6)],
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          Expanded(child: Text(p['name'] ?? '', style: theme.titleMedium)),
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                            decoration: BoxDecoration(
                                              color:        _statusColor(p['status'] ?? '').withOpacity(0.12),
                                              borderRadius: BorderRadius.circular(6),
                                            ),
                                            child: Text(
                                              (p['status'] ?? '').replaceAll('_', ' '),
                                              style: TextStyle(
                                                color:    _statusColor(p['status'] ?? ''),
                                                fontSize: 11,
                                                fontWeight: FontWeight.w600,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                      if ((p['description'] ?? '').isNotEmpty) ...[
                                        const SizedBox(height: 6),
                                        Text(p['description'], style: theme.labelMedium, maxLines: 2, overflow: TextOverflow.ellipsis),
                                      ],
                                      const SizedBox(height: 10),
                                      Row(
                                        children: [
                                          Icon(Icons.calendar_today_outlined, size: 14, color: theme.secondaryText),
                                          const SizedBox(width: 4),
                                          Text(
                                            p['deadline'] != null
                                                ? p['deadline'].toString().substring(0, 10)
                                                : 'No deadline',
                                            style: theme.labelMedium,
                                          ),
                                          const Spacer(),
                                          Icon(Icons.chevron_right, color: theme.secondaryText),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
            ),
          ],
        ),
      ),
    );
  }
}
