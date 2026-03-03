class UserModel {
  final String id;
  final String name;
  final String email;
  final String role;
  final String photoUrl;
  final String phone;
  final String department;
  final String position;

  const UserModel({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.photoUrl = '',
    this.phone = '',
    this.department = '',
    this.position = '',
  });

  factory UserModel.fromJson(Map<String, dynamic> json) => UserModel(
        id: json['id'] ?? json['_id'] ?? '',
        name: json['name'] ?? '',
        email: json['email'] ?? '',
        role: json['role'] ?? 'employee',
        photoUrl: json['photoUrl'] ?? '',
        phone: json['phone'] ?? '',
        department: json['department'] ?? '',
        position: json['position'] ?? '',
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'email': email,
        'role': role,
        'photoUrl': photoUrl,
        'phone': phone,
        'department': department,
        'position': position,
      };
}
