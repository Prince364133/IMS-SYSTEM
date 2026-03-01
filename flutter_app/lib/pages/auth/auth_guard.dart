import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../services/auth_service.dart';

/// Auth guard – checks JWT token on startup and routes accordingly.
class AuthGuardPage extends StatefulWidget {
  const AuthGuardPage({super.key});

  @override
  State<AuthGuardPage> createState() => _AuthGuardPageState();
}

class _AuthGuardPageState extends State<AuthGuardPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _check());
  }

  void _check() {
    final auth = context.read<AuthService>();
    if (auth.isLoggedIn) {
      final role = auth.currentUser?.role ?? 'pending';
      if (role == 'pending') {
        context.go('/pending');
      } else if (role == 'superadmin') {
        context.go('/superadmin');
      } else {
        context.go('/home');
      }
    } else {
      context.go('/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(child: CircularProgressIndicator()),
    );
  }
}
