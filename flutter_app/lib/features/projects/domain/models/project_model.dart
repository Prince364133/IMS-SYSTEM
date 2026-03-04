class ProjectModel {
  final String id;
  final String name;
  final String? description;
  final String status;
  final String? priority;
  final DateTime? deadline;
  final double progress;

  const ProjectModel({
    required this.id,
    required this.name,
    this.description,
    required this.status,
    this.priority,
    this.deadline,
    this.progress = 0.0,
  });

  factory ProjectModel.fromJson(Map<String, dynamic> json) => ProjectModel(
        id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
        name: json['name'] ?? '',
        description: json['description'],
        status: json['status'] ?? 'not_started',
        priority: json['priority'],
        deadline: json['deadline'] != null
            ? DateTime.tryParse(json['deadline'].toString())
            : null,
        progress: (json['progress'] ?? 0.0).toDouble(),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'description': description,
        'status': status,
        'priority': priority,
        'deadline': deadline?.toIso8601String(),
        'progress': progress,
      };
}
