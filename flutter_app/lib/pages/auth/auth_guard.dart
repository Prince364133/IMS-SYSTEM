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
      context.go('/home');
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
