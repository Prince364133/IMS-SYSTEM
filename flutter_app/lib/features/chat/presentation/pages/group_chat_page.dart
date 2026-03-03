import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_service.dart';
import '../../../auth/application/auth_provider.dart';
import '../../../../flutter_flow/flutter_flow_theme.dart';
import '../../domain/models/message_model.dart';

class GroupChatPage extends ConsumerStatefulWidget {
  final String groupId;
  const GroupChatPage({super.key, required this.groupId});
  @override
  ConsumerState<GroupChatPage> createState() => _GroupChatPageState();
}

class _GroupChatPageState extends ConsumerState<GroupChatPage> {
  final _api = ApiService();
  final _textCtrl = TextEditingController();
  Map<String, dynamic>? _chat;
  List<MessageModel> _messages = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final [chatRes, msgRes] = await Future.wait([
        _api.get('/chat/${widget.groupId}'),
        _api.get('/chat/${widget.groupId}/messages'),
      ]);
      final List rawMsgs = msgRes['messages'] ?? [];
      if (mounted) {
        setState(() {
          _chat = chatRes['chat'];
          _messages = rawMsgs.map((e) => MessageModel.fromJson(e)).toList();
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _send() async {
    if (_textCtrl.text.trim().isEmpty) return;
    final text = _textCtrl.text.trim();
    _textCtrl.clear();
    await _api.post('/chat/${widget.groupId}/messages', {'text': text});
    _load();
  }

  @override
  Widget build(BuildContext context) {
    final theme = FlutterFlowTheme.of(context);
    final authState = ref.watch(authProvider);
    final myId = authState.currentUser?.id ?? '';
    return Scaffold(
      backgroundColor: theme.primaryBackground,
      appBar: AppBar(
        backgroundColor: theme.secondaryBackground,
        title:
            Text(_chat?['groupName'] ?? 'Group Chat', style: theme.titleMedium),
        leading: BackButton(onPressed: () => context.go('/chat')),
        actions: [
          IconButton(
            icon: const Icon(Icons.person_add_outlined),
            onPressed: () => context.go('/chat/group/${widget.groupId}/invite'),
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                Expanded(
                  child: ListView.builder(
                    reverse: true,
                    padding: const EdgeInsets.all(16),
                    itemCount: _messages.length,
                    itemBuilder: (_, i) {
                      final msg = _messages[_messages.length - 1 - i];
                      final isMe = msg.senderId == myId;
                      final senderName = msg.senderName ?? '';
                      return Column(
                        crossAxisAlignment: isMe
                            ? CrossAxisAlignment.end
                            : CrossAxisAlignment.start,
                        children: [
                          if (!isMe && senderName.isNotEmpty)
                            Padding(
                              padding:
                                  const EdgeInsets.only(left: 8, bottom: 2),
                              child: Text(senderName, style: theme.labelMedium),
                            ),
                          Align(
                            alignment: isMe
                                ? Alignment.centerRight
                                : Alignment.centerLeft,
                            child: Container(
                              margin: const EdgeInsets.only(bottom: 8),
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 14, vertical: 10),
                              decoration: BoxDecoration(
                                color: isMe
                                    ? theme.primary
                                    : theme.secondaryBackground,
                                borderRadius: BorderRadius.circular(14),
                              ),
                              child: Text(msg.text,
                                  style: TextStyle(
                                      color: isMe
                                          ? Colors.white
                                          : theme.primaryText)),
                            ),
                          ),
                        ],
                      );
                    },
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  color: theme.secondaryBackground,
                  child: Row(children: [
                    Expanded(
                        child: TextField(
                      controller: _textCtrl,
                      onSubmitted: (_) => _send(),
                      decoration: InputDecoration(
                        hintText: 'Message group...',
                        filled: true,
                        fillColor: theme.primaryBackground,
                        border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(24),
                            borderSide: BorderSide.none),
                        contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 10),
                      ),
                    )),
                    const SizedBox(width: 8),
                    CircleAvatar(
                      backgroundColor: theme.primary,
                      child: GestureDetector(
                          onTap: _send,
                          child: const Icon(Icons.send,
                              color: Colors.white, size: 20)),
                    ),
                  ]),
                ),
              ],
            ),
    );
  }
}
