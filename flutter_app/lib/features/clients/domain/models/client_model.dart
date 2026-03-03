class ClientModel {
  final String id;
  final String name;
  final String? email;
  final String? company;
  final String? phone;
  final String? address;

  const ClientModel({
    required this.id,
    required this.name,
    this.email,
    this.company,
    this.phone,
    this.address,
  });

  factory ClientModel.fromJson(Map<String, dynamic> json) => ClientModel(
        id: json['_id'] ?? json['id'] ?? '',
        name: json['name'] ?? '',
        email: json['email'],
        company: json['company'],
        phone: json['phone'],
        address: json['address'],
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'email': email,
        'company': company,
        'phone': phone,
        'address': address,
      };
}
