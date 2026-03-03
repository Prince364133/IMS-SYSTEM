import 'package:flutter/material.dart';
import '../../../../core/network/api_service.dart';
import '../../../../flutter_flow/flutter_flow_theme.dart';
import '../../../../flutter_flow/flutter_flow_widgets.dart';
import '../../../../shared/widgets/glass_card.dart';

class ChatInvitePage extends StatefulWidget {
  final String groupId;
  const ChatInvitePage({super.key, required this.groupId});
  @override
  State<ChatInvitePage> createState() => _ChatInvitePageState();
}

class _ChatInvitePageState extends State<ChatInvitePage> {
  final _api = ApiService();
  List<dynamic> _users = [];
  final Set<String> _selected = {};
  bool _loading = true;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final res = await _api.get('/users');
      if (mounted) {
        setState(() {
          _users = res['users'] ?? [];
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _invite() async {
    if (_selected.isEmpty) return;
    if (mounted) setState(() => _saving = true);
    final nav = Navigator.of(context);
    try {
      await _api.put('/chat/group/${widget.groupId}/members',
          {'addMembers': _selected.toList()});
      if (mounted) nav.pop();
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = FlutterFlowTheme.of(context);
    return Scaffold(
      extendBodyBehindAppBar: true,
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text('Invite Members',
            style: theme.titleMedium.copyWith(color: Colors.white)),
        leading: const BackButton(color: Colors.white),
      ),
      body: Container(
        height: double.infinity,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              theme.primary,
              const Color(0xFF1D2428),
              Colors.black,
            ],
          ),
        ),
        child: _loading
            ? const Center(
                child: CircularProgressIndicator(color: Colors.white))
            : Column(
                children: [
                  const SizedBox(height: 100), // Space for AppBar
                  Expanded(
                    child: ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: _users.length,
                      itemBuilder: (_, i) {
                        final u = _users[i];
                        final id = u['_id'] ?? '';
                        final isSelected = _selected.contains(id);
                        return Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          decoration: BoxDecoration(
                            color: Colors.white
                                .withValues(alpha: isSelected ? 0.1 : 0.05),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: isSelected
                                  ? theme.primary.withValues(alpha: 0.5)
                                  : Colors.white.withValues(alpha: 0.1),
                            ),
                          ),
                          child: CheckboxListTile(
                            value: isSelected,
                            onChanged: (v) => setState(() => v == true
                                ? _selected.add(id)
                                : _selected.remove(id)),
                            activeColor: theme.primary,
                            checkColor: Colors.white,
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16)),
                            title: Text(u['name'] ?? '',
                                style: theme.bodyMedium.copyWith(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold)),
                            subtitle: Text(u['email'] ?? '',
                                style: theme.labelMedium
                                    .copyWith(color: Colors.white70)),
                            secondary: CircleAvatar(
                              backgroundColor:
                                  theme.primary.withValues(alpha: 0.2),
                              child: Text((u['name'] ?? 'U')[0].toUpperCase(),
                                  style: TextStyle(
                                      color: theme.primary,
                                      fontWeight: FontWeight.bold)),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(24),
                    child: GlassCard(
                      padding: const EdgeInsets.all(8),
                      opacity: 0.1,
                      child: SizedBox(
                        width: double.infinity,
                        child: FFButtonWidget(
                          onPressed:
                              (_selected.isEmpty || _saving) ? null : _invite,
                          text:
                              'Add ${_selected.length} Member${_selected.length != 1 ? 's' : ''}',
                          showLoadingIndicator: _saving,
                          options: FFButtonOptions(
                            color: theme.primary,
                            height: 56,
                            borderRadius: BorderRadius.circular(16),
                            textStyle: const TextStyle(
                                color: Colors.white,
                                fontSize: 17,
                                fontWeight: FontWeight.bold),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}
