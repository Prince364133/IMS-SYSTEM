import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../application/auth_provider.dart';
import 'login_page.dart';
import 'pending_approval_page.dart';
import '../../../../features/dashboard/presentation/pages/home_page.dart';

class AuthGuardPage extends ConsumerWidget {
  const AuthGuardPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);

    if (!auth.isInitialized) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (!auth.isLoggedIn) {
      return const LoginPage();
    }

    final role = auth.user?.role ?? 'pending';
    if (role == 'pending') {
      return const PendingApprovalPage();
    }

    return const HomePage();
  }
}
