class MessageModel {
  final String id;
  final String text;
  final String senderId;
  final String? senderName;
  final DateTime? timestamp;

  const MessageModel({
    required this.id,
    required this.text,
    required this.senderId,
    this.senderName,
    this.timestamp,
  });

  factory MessageModel.fromJson(Map<String, dynamic> json) {
    final senderObj = json['senderId'];
    String sId = '';
    String? sName;
    if (senderObj is Map) {
      sId = senderObj['_id'] ?? senderObj['id'] ?? '';
      sName = senderObj['name'];
    } else {
      sId = senderObj?.toString() ?? '';
    }

    return MessageModel(
      id: json['_id'] ?? json['id'] ?? '',
      text: json['text'] ?? '',
      senderId: sId,
      senderName: sName,
      timestamp: json['timestamp'] != null
          ? DateTime.tryParse(json['timestamp'])
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'text': text,
        'senderId': senderId,
        'senderName': senderName,
        'timestamp': timestamp?.toIso8601String(),
      };
}
