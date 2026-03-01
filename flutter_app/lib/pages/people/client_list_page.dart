import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../services/api_service.dart';
import '../../flutter_flow/flutter_flow_theme.dart';
import '../../widgets/nav_wrapper.dart';

class ClientListPage extends StatefulWidget {
  const ClientListPage({super.key});
  @override
  State<ClientListPage> createState() => _ClientListPageState();
}

class _ClientListPageState extends State<ClientListPage> {
  final _api    = ApiService();
  final _search = TextEditingController();
  List<dynamic> _clients = [];
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final q = _search.text.isNotEmpty ? '?search=${_search.text}' : '';
      final res = await _api.get('/clients$q');
      setState(() => _clients = res['clients'] ?? []);
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = FlutterFlowTheme.of(context);
    return NavWrapper(
      activeNav: 'clients',
      child: Scaffold(
        backgroundColor: theme.primaryBackground,
        appBar: AppBar(
          backgroundColor: theme.secondaryBackground,
          title: Text('Clients', style: theme.titleMedium),
        ),
        body: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: TextField(
                controller: _search,
                onSubmitted: (_) => _load(),
                decoration: InputDecoration(
                  hintText: 'Search clients...',
                  prefixIcon: const Icon(Icons.search),
                  filled: true,
                  fillColor: theme.secondaryBackground,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
                ),
              ),
            ),
            Expanded(
              child: _loading
                  ? const Center(child: CircularProgressIndicator())
                  : _clients.isEmpty
                      ? Center(child: Text('No clients yet', style: theme.labelMedium))
                      : ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: _clients.length,
                          itemBuilder: (_, i) {
                            final c = _clients[i];
                            return GestureDetector(
                              onTap: () => context.go('/clients/${c['_id']}'),
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
                                      backgroundColor: theme.accent1,
                                      child: Text((c['name'] ?? 'C')[0], style: TextStyle(color: theme.primary, fontWeight: FontWeight.w700)),
                                    ),
                                    const SizedBox(width: 14),
                                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                      Text(c['name'] ?? '', style: theme.titleMedium),
                                      Text(c['company'] ?? c['email'] ?? '', style: theme.labelMedium),
                                    ])),
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
        floatingActionButton: FloatingActionButton(
          backgroundColor: theme.primary,
          onPressed: () => _showAddClient(context, theme),
          child: const Icon(Icons.add, color: Colors.white),
        ),
      ),
    );
  }

  void _showAddClient(BuildContext context, FlutterFlowTheme theme) {
    final nameCtrl    = TextEditingController();
    final emailCtrl   = TextEditingController();
    final companyCtrl = TextEditingController();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: theme.secondaryBackground,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (_) => Padding(
        padding: EdgeInsets.only(left: 20, right: 20, top: 20, bottom: MediaQuery.of(context).viewInsets.bottom + 20),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Text('Add Client', style: theme.titleMedium),
          const SizedBox(height: 16),
          TextField(controller: nameCtrl,    decoration: InputDecoration(hintText: 'Name',    filled: true, fillColor: theme.primaryBackground, border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)))),
          const SizedBox(height: 10),
          TextField(controller: emailCtrl,   decoration: InputDecoration(hintText: 'Email',   filled: true, fillColor: theme.primaryBackground, border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)))),
          const SizedBox(height: 10),
          TextField(controller: companyCtrl, decoration: InputDecoration(hintText: 'Company', filled: true, fillColor: theme.primaryBackground, border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)))),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () async {
              await _api.post('/clients', {'name': nameCtrl.text, 'email': emailCtrl.text, 'company': companyCtrl.text});
              if (mounted) { Navigator.pop(context); _load(); }
            },
            style: ElevatedButton.styleFrom(backgroundColor: theme.primary, foregroundColor: Colors.white, minimumSize: const Size(double.infinity, 48)),
            child: const Text('Save Client'),
          ),
        ]),
      ),
    );
  }
}
