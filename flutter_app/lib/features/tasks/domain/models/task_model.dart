class TaskModel {
  final String id;
  final String title;
  final String? description;
  final String status;
  final String priority;
  final String projectId;
  final Map<String, dynamic>? assignee;
  final DateTime? dueDate;

  const TaskModel({
    required this.id,
    required this.title,
    this.description,
    required this.status,
    required this.priority,
    required this.projectId,
    this.assignee,
    this.dueDate,
  });

  factory TaskModel.fromJson(Map<String, dynamic> json) => TaskModel(
        id: json['_id'] ?? json['id'] ?? '',
        title: json['title'] ?? '',
        description: json['description'],
        status: json['status'] ?? 'todo',
        priority: json['priority'] ?? 'medium',
        projectId: json['projectId'] is Map
            ? json['projectId']['_id']
            : (json['projectId'] ?? ''),
        assignee: json['assigneeId'] is Map ? json['assigneeId'] : null,
        dueDate: json['dueDate'] != null
            ? DateTime.tryParse(json['dueDate'].toString())
            : null,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'description': description,
        'status': status,
        'priority': priority,
        'projectId': projectId,
        'dueDate': dueDate?.toIso8601String(),
      };
}
