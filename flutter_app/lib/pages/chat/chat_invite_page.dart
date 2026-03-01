import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../services/api_service.dart';
import '../../flutter_flow/flutter_flow_theme.dart';
import '../../flutter_flow/flutter_flow_widgets.dart';

class ChatInvitePage extends StatefulWidget {
  final String groupId;
  const ChatInvitePage({super.key, required this.groupId});
  @override
  State<ChatInvitePage> createState() => _ChatInvitePageState();
}

class _ChatInvitePageState extends State<ChatInvitePage> {
  final _api        = ApiService();
  List<dynamic>   _users    = [];
  Set<String>     _selected = {};
  bool            _loading  = true;
  bool            _saving   = false;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    try {
      final res = await _api.get('/users');
      setState(() { _users = res['users'] ?? []; _loading = false; });
    } catch (_) { setState(() => _loading = false); }
  }

  Future<void> _invite() async {
    if (_selected.isEmpty) return;
    setState(() => _saving = true);
    try {
      await _api.put('/chat/group/${widget.groupId}/members', {'addMembers': _selected.toList()});
      if (mounted) context.pop();
    } finally { setState(() => _saving = false); }
  }

  @override
  Widget build(BuildContext context) {
    final theme = FlutterFlowTheme.of(context);
    return Scaffold(
      backgroundColor: theme.primaryBackground,
      appBar: AppBar(
        backgroundColor: theme.secondaryBackground,
        title: Text('Invite Members', style: theme.titleMedium),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                Expanded(
                  child: ListView.builder(
                    itemCount: _users.length,
                    itemBuilder: (_, i) {
                      final u     = _users[i];
                      final id    = u['_id'] ?? '';
                      final isSelected = _selected.contains(id);
                      return CheckboxListTile(
                        value:    isSelected,
                        onChanged: (v) => setState(() => v == true ? _selected.add(id) : _selected.remove(id)),
                        activeColor: theme.primary,
                        title:    Text(u['name'] ?? '', style: theme.bodyMedium),
                        subtitle: Text(u['email'] ?? '', style: theme.labelMedium),
                        secondary: CircleAvatar(
                          backgroundColor: theme.accent1,
                          child: Text((u['name'] ?? 'U')[0], style: TextStyle(color: theme.primary)),
                        ),
                      );
                    },
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: FFButtonWidget(
                    onPressed: (_selected.isEmpty || _saving) ? null : _invite,
                    text: 'Add ${_selected.length} Member${_selected.length != 1 ? 's' : ''}',
                    showLoadingIndicator: _saving,
                    options: FFButtonOptions(
                      color: theme.primary, height: 52, borderRadius: BorderRadius.circular(10),
                      textStyle: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600),
                    ),
                  ),
                ),
              ],
            ),
    );
  }
}
