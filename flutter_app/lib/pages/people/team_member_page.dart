import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../services/api_service.dart';
import '../../flutter_flow/flutter_flow_theme.dart';
import '../../widgets/nav_wrapper.dart';

class TeamMemberPage extends StatefulWidget {
  const TeamMemberPage({super.key});
  @override
  State<TeamMemberPage> createState() => _TeamMemberPageState();
}

class _TeamMemberPageState extends State<TeamMemberPage> {
  final _api    = ApiService();
  final _search = TextEditingController();
  List<dynamic> _members = [];
  bool _loading = true;
  String _role  = '';

  final _roles = ['', 'admin', 'manager', 'employee'];

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final q = [
        if (_role.isNotEmpty) 'role=$_role',
        if (_search.text.isNotEmpty) 'search=${_search.text}',
      ].join('&');
      final res = await _api.get('/users${q.isEmpty ? '' : '?$q'}');
      setState(() => _members = res['users'] ?? []);
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = FlutterFlowTheme.of(context);
    return NavWrapper(
      activeNav: 'team',
      child: Scaffold(
        backgroundColor: theme.primaryBackground,
        appBar: AppBar(
          backgroundColor: theme.secondaryBackground,
          title: Text('Team Members', style: theme.titleMedium),
        ),
        body: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: TextField(
                controller: _search,
                onSubmitted: (_) => _load(),
                decoration: InputDecoration(
                  hintText: 'Search members...',
                  prefixIcon: const Icon(Icons.search),
                  filled: true,
                  fillColor: theme.secondaryBackground,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
                ),
              ),
            ),
            SizedBox(
              height: 40,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                children: _roles.map((r) => Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(r.isEmpty ? 'All' : r.toUpperCase()),
                    selected: _role == r,
                    onSelected: (_) { setState(() => _role = r); _load(); },
                    selectedColor: theme.primary,
                    labelStyle: TextStyle(color: _role == r ? Colors.white : theme.primaryText),
                  ),
                )).toList(),
              ),
            ),
            const SizedBox(height: 8),
            Expanded(
              child: _loading
                  ? const Center(child: CircularProgressIndicator())
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _members.length,
                      itemBuilder: (_, i) {
                        final m = _members[i];
                        return GestureDetector(
                          onTap: () => context.go('/team/${m['_id']}'),
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 10),
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: theme.secondaryBackground,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Row(
                              children: [
                                CircleAvatar(
                                  radius: 24,
                                  backgroundImage: (m['photoUrl'] ?? '').isNotEmpty ? NetworkImage(m['photoUrl']) : null,
                                  backgroundColor: theme.primary,
                                  child: (m['photoUrl'] ?? '').isEmpty ? Text((m['name'] ?? 'U')[0], style: const TextStyle(color: Colors.white)) : null,
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                    Text(m['name'] ?? '', style: theme.titleMedium),
                                    Text(m['email'] ?? '', style: theme.labelMedium),
                                    Text((m['role'] ?? '').toUpperCase(), style: TextStyle(color: theme.primary, fontSize: 11, fontWeight: FontWeight.w600)),
                                  ]),
                                ),
                                Icon(Icons.chevron_right, color: theme.secondaryText),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
