import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../flutter_flow/flutter_flow_theme.dart';
import '../../../../core/network/api_service.dart';
import '../../../auth/application/auth_provider.dart';

class SuperAdminDashboardPage extends ConsumerStatefulWidget {
  const SuperAdminDashboardPage({super.key});

  @override
  ConsumerState<SuperAdminDashboardPage> createState() =>
      _SuperAdminDashboardPageState();
}

class _SuperAdminDashboardPageState
    extends ConsumerState<SuperAdminDashboardPage> {
  final ApiService _api = ApiService();
  bool _isLoading = true;
  List<dynamic> _users = [];

  @override
  void initState() {
    super.initState();
    _fetchUsers();
  }

  Future<void> _fetchUsers() async {
    if (mounted) setState(() => _isLoading = true);
    try {
      final res = await _api.get('/users');
      if (mounted) {
        setState(() {
          _users = res['users'] ?? [];
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _updateUser(String userId, Map<String, dynamic> updates) async {
    try {
      await _api.put('/users/$userId', updates);
      await _fetchUsers();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Updated successfully')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Update failed: $e')));
      }
    }
  }

  void _showEditDialog(Map<String, dynamic> user) {
    final theme = FlutterFlowTheme.of(context);
    final emailCtrl = TextEditingController(text: user['email']);
    final passCtrl = TextEditingController();
    String selectedRole = user['role'] ?? 'pending';

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setStateDialog) {
            return AlertDialog(
              backgroundColor: theme.secondaryBackground,
              title: Text('Edit User: ${user['name']}',
                  style: theme.headlineSmall),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextField(
                      controller: emailCtrl,
                      decoration: const InputDecoration(
                          labelText: 'Email (Admin overwrite)'),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: passCtrl,
                      decoration: const InputDecoration(
                          labelText: 'New Password (leave blank to keep)'),
                      obscureText: true,
                    ),
                    const SizedBox(height: 16),
                    DropdownButtonFormField<String>(
                      value: selectedRole,
                      decoration:
                          const InputDecoration(labelText: 'Role Access'),
                      items: [
                        'superadmin',
                        'admin',
                        'hr',
                        'manager',
                        'employee',
                        'client',
                        'pending'
                      ]
                          .map((r) => DropdownMenuItem(
                              value: r, child: Text(r.toUpperCase())))
                          .toList(),
                      onChanged: (val) {
                        setStateDialog(() => selectedRole = val!);
                      },
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Cancel'),
                ),
                ElevatedButton(
                  onPressed: () {
                    Navigator.pop(context);
                    final updates = <String, dynamic>{
                      'email': emailCtrl.text,
                      'role': selectedRole,
                    };
                    if (passCtrl.text.isNotEmpty) {
                      updates['password'] = passCtrl.text;
                    }
                    _updateUser(user['id'] ?? user['_id'], updates);
                  },
                  child: const Text('Save'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = FlutterFlowTheme.of(context);
    final authState = ref.watch(authProvider);
    final currentUser = authState.currentUser;

    return Scaffold(
      backgroundColor: theme.primaryBackground,
      appBar: AppBar(
        title: Text('Super Admin Dashboard',
            style: theme.headlineSmall.copyWith(color: Colors.white)),
        backgroundColor: theme.primary,
        iconTheme: const IconThemeData(color: Colors.white),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              final router = GoRouter.of(context);
              await ref.read(authProvider.notifier).logout();
              if (mounted) router.go('/login');
            },
          )
        ],
      ),
      drawer: Drawer(
        backgroundColor: theme.secondaryBackground,
        child: ListView(
          children: [
            UserAccountsDrawerHeader(
              accountName: Text(currentUser?.name ?? 'Super Admin'),
              accountEmail: Text(currentUser?.email ?? ''),
              decoration: BoxDecoration(color: theme.primary),
            ),
            ListTile(
              leading: const Icon(Icons.people),
              title: const Text('User Management'),
              onTap: () => Navigator.pop(context),
            ),
            ListTile(
              leading: const Icon(Icons.dashboard),
              title: const Text('Enter Main System (Beta)'),
              onTap: () {
                Navigator.pop(context);
                context.push('/home');
              },
            ),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _users.length,
              itemBuilder: (context, index) {
                final user = _users[index];
                return Card(
                  color: theme.secondaryBackground,
                  child: ListTile(
                    title: Text('${user['name']} (${user['role']})',
                        style: theme.bodyLarge),
                    subtitle: Text(
                        '${user['email']}\nStatus: ${user['isActive'] == false ? "Inactive" : "Active"}'),
                    isThreeLine: true,
                    trailing: IntrinsicWidth(
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          IconButton(
                            icon: const Icon(Icons.edit, color: Colors.blue),
                            onPressed: () => _showEditDialog(user),
                            tooltip: 'Edit Role/Password',
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
    );
  }
}
