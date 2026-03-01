import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../services/api_service.dart';
import '../../flutter_flow/flutter_flow_theme.dart';

class ClientProfilePage extends StatefulWidget {
  final String clientId;
  const ClientProfilePage({super.key, required this.clientId});
  @override
  State<ClientProfilePage> createState() => _ClientProfilePageState();
}

class _ClientProfilePageState extends State<ClientProfilePage> {
  final _api = ApiService();
  Map<String, dynamic>? _client;
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    try {
      final res = await _api.get('/clients/${widget.clientId}');
      setState(() { _client = res['client']; _loading = false; });
    } catch (_) { setState(() => _loading = false); }
  }

  @override
  Widget build(BuildContext context) {
    final theme = FlutterFlowTheme.of(context);
    if (_loading) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    return Scaffold(
      backgroundColor: theme.primaryBackground,
      appBar: AppBar(
        backgroundColor: theme.secondaryBackground,
        title: Text(_client?['name'] ?? 'Client', style: theme.titleMedium),
        leading: BackButton(onPressed: () => context.go('/clients')),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Center(child: Column(children: [
            CircleAvatar(radius: 40, backgroundColor: theme.accent1,
              child: Text((_client?['name'] ?? 'C')[0], style: TextStyle(color: theme.primary, fontSize: 24, fontWeight: FontWeight.w700))),
            const SizedBox(height: 10),
            Text(_client?['name'] ?? '', style: theme.headlineSmall),
            Text(_client?['company'] ?? '', style: theme.labelMedium),
          ])),
          const SizedBox(height: 24),
          _row(theme, Icons.email_outlined,    'Email',   _client?['email']   ?? '-'),
          _row(theme, Icons.phone_outlined,    'Phone',   _client?['phone']   ?? '-'),
          _row(theme, Icons.business_outlined, 'Company', _client?['company'] ?? '-'),
          _row(theme, Icons.location_on_outlined, 'Address', _client?['address'] ?? '-'),
          const SizedBox(height: 20),
          if ((_client?['notes'] ?? '').isNotEmpty) ...[
            Text('Notes', style: theme.titleMedium),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(color: theme.secondaryBackground, borderRadius: BorderRadius.circular(10)),
              child: Text(_client!['notes'], style: theme.bodyMedium),
            ),
          ],
        ],
      ),
    );
  }

  Widget _row(FlutterFlowTheme t, IconData icon, String label, String value) =>
    Container(margin: const EdgeInsets.only(bottom: 8), padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: t.secondaryBackground, borderRadius: BorderRadius.circular(10)),
      child: Row(children: [
        Icon(icon, color: t.primary, size: 20), const SizedBox(width: 12),
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(label, style: t.labelMedium), Text(value, style: t.bodyMedium),
        ]),
      ]),
    );
}
