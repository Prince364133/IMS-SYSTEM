import 'message_model.dart';

class ChatModel {
  final String id;
  final String type; // 'direct' or 'group'
  final String? groupName;
  final List<String> memberIds;
  final MessageModel? lastMessage;

  const ChatModel({
    required this.id,
    required this.type,
    this.groupName,
    required this.memberIds,
    this.lastMessage,
  });

  factory ChatModel.fromJson(Map<String, dynamic> json) {
    final members = json['memberIds'] as List?;
    List<String> mIds = [];
    if (members != null) {
      for (var m in members) {
        if (m is Map) {
          mIds.add(m['_id'] ?? m['id'] ?? '');
        } else {
          mIds.add(m.toString());
        }
      }
    }

    return ChatModel(
      id: json['_id'] ?? json['id'] ?? '',
      type: json['type'] ?? 'direct',
      groupName: json['groupName'],
      memberIds: mIds,
      lastMessage: json['lastMessage'] != null
          ? MessageModel.fromJson(json['lastMessage'])
          : null,
    );
  }
}
