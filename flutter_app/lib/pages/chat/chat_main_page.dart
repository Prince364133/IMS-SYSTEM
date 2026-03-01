import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../services/api_service.dart';
import '../../flutter_flow/flutter_flow_theme.dart';
import '../../widgets/nav_wrapper.dart';

class ChatMainPage extends StatefulWidget {
  const ChatMainPage({super.key});
  @override
  State<ChatMainPage> createState() => _ChatMainPageState();
}

class _ChatMainPageState extends State<ChatMainPage> {
  final _api = ApiService();
  List<dynamic> _chats  = [];
  bool _loading         = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final res = await _api.get('/chat');
      setState(() => _chats = res['chats'] ?? []);
    } finally { setState(() => _loading = false); }
  }

  String _timeAgo(String? ts) {
    if (ts == null) return '';
    final dt   = DateTime.tryParse(ts);
    if (dt == null) return '';
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1)  return 'just now';
    if (diff.inHours   < 1)  return '${diff.inMinutes}m ago';
    if (diff.inDays    < 1)  return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }

  @override
  Widget build(BuildContext context) {
    final theme = FlutterFlowTheme.of(context);
    return NavWrapper(
      activeNav: 'chat',
      child: Scaffold(
        backgroundColor: theme.primaryBackground,
        appBar: AppBar(
          backgroundColor: theme.secondaryBackground,
          title: Text('Messages', style: theme.titleMedium),
        ),
        body: _loading
            ? const Center(child: CircularProgressIndicator())
            : RefreshIndicator(
                onRefresh: _load,
                child: _chats.isEmpty
                    ? Center(child: Text('No conversations yet', style: theme.labelMedium))
                    : ListView.builder(
                        padding: const EdgeInsets.all(12),
                        itemCount: _chats.length,
                        itemBuilder: (_, i) {
                          final c    = _chats[i];
                          final isGrp = c['type'] == 'group';
                          final name  = isGrp
                              ? (c['groupName'] ?? 'Group')
                              : ((c['memberIds'] as List?)?.firstWhere(
                                      (m) => m != null, orElse: () => {})?['name'] ?? 'Chat');
                          final last  = c['lastMessage']?['text'] ?? 'No messages yet';
                          final ts    = c['lastMessage']?['timestamp'];
                          return GestureDetector(
                            onTap: () => isGrp
                                ? context.go('/chat/group/${c['_id']}')
                                : context.go('/chat/${c['_id']}'),
                            child: Container(
                              margin: const EdgeInsets.only(bottom: 8),
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color:        theme.secondaryBackground,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Row(children: [
                                CircleAvatar(
                                  radius: 24,
                                  backgroundColor: theme.accent1,
                                  child: Icon(isGrp ? Icons.group : Icons.person, color: theme.primary),
                                ),
                                const SizedBox(width: 14),
                                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                  Text(name, style: theme.bodyMedium.copyWith(fontWeight: FontWeight.w600)),
                                  Text(last, style: theme.labelMedium, overflow: TextOverflow.ellipsis),
                                ])),
                                Text(_timeAgo(ts?.toString()), style: theme.labelMedium.copyWith(fontSize: 11)),
                              ]),
                            ),
                          );
                        },
                      ),
              ),
        floatingActionButton: FloatingActionButton(
          backgroundColor: theme.primary,
          onPressed: () => _showNewChat(context, theme),
          child: const Icon(Icons.edit, color: Colors.white),
        ),
      ),
    );
  }

  void _showNewChat(BuildContext context, FlutterFlowTheme theme) {
    showModalBottomSheet(
      context: context,
      backgroundColor: theme.secondaryBackground,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (_) => Padding(
        padding: const EdgeInsets.all(20),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Text('New Conversation', style: theme.titleMedium),
          const SizedBox(height: 16),
          ListTile(leading: Icon(Icons.person, color: theme.primary), title: const Text('Direct Message'), onTap: () { Navigator.pop(context); }),
          ListTile(leading: Icon(Icons.group, color: theme.secondary), title: const Text('New Group'), onTap: () { Navigator.pop(context); }),
        ]),
      ),
    );
  }
}
