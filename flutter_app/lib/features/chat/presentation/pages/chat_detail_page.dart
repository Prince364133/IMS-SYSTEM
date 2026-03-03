import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_service.dart';
import '../../../auth/application/auth_provider.dart';
import '../../../../flutter_flow/flutter_flow_theme.dart';
import '../../domain/models/message_model.dart';

class ChatDetailPage extends ConsumerStatefulWidget {
  final String chatId;
  const ChatDetailPage({super.key, required this.chatId});
  @override
  ConsumerState<ChatDetailPage> createState() => _ChatDetailPageState();
}

class _ChatDetailPageState extends ConsumerState<ChatDetailPage> {
  final _api = ApiService();
  final _textCtrl = TextEditingController();
  List<MessageModel> _messages = [];
  bool _loading = true;
  bool _sending = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final res = await _api.get('/chat/${widget.chatId}/messages');
      final List raw = res['messages'] ?? [];
      if (mounted) {
        setState(() {
          _messages = raw.map((e) => MessageModel.fromJson(e)).toList();
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
    if (mounted) setState(() => _sending = true);
    try {
      await _api.post('/chat/${widget.chatId}/messages', {'text': text});
      _load();
    } finally {
      if (mounted) setState(() => _sending = false);
    }
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
        title: Text('Chat', style: theme.titleMedium),
        leading: BackButton(onPressed: () => context.go('/chat')),
      ),
      body: Column(
        children: [
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : ListView.builder(
                    reverse: true,
                    padding: const EdgeInsets.all(16),
                    itemCount: _messages.length,
                    itemBuilder: (_, i) {
                      final msg = _messages[_messages.length - 1 - i];
                      final isMe = msg.senderId == myId;
                      return Align(
                        alignment:
                            isMe ? Alignment.centerRight : Alignment.centerLeft,
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 14, vertical: 10),
                          decoration: BoxDecoration(
                            color: isMe
                                ? theme.primary
                                : theme.secondaryBackground,
                            borderRadius: BorderRadius.only(
                              topLeft: const Radius.circular(14),
                              topRight: const Radius.circular(14),
                              bottomLeft: Radius.circular(isMe ? 14 : 0),
                              bottomRight: Radius.circular(isMe ? 0 : 14),
                            ),
                          ),
                          child: Text(
                            msg.text,
                            style: TextStyle(
                                color: isMe ? Colors.white : theme.primaryText),
                          ),
                        ),
                      );
                    },
                  ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            color: theme.secondaryBackground,
            child: Row(children: [
              Expanded(
                child: TextField(
                  controller: _textCtrl,
                  onSubmitted: (_) => _send(),
                  decoration: InputDecoration(
                    hintText: 'Type a message...',
                    filled: true,
                    fillColor: theme.primaryBackground,
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                        borderSide: BorderSide.none),
                    contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 10),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              CircleAvatar(
                backgroundColor: theme.primary,
                child: _sending
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.white))
                    : GestureDetector(
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
