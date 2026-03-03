import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../flutter_flow/flutter_flow_theme.dart';
import '../../../../flutter_flow/flutter_flow_widgets.dart';

class PendingApprovalPage extends StatelessWidget {
  const PendingApprovalPage({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = FlutterFlowTheme.of(context);

    return Scaffold(
      backgroundColor: theme.primaryBackground,
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.hourglass_empty_rounded,
                  size: 80, color: theme.secondaryText),
              const SizedBox(height: 24),
              Text('Account Pending Approval', style: theme.headlineSmall),
              const SizedBox(height: 12),
              Text(
                'Your account has been created successfully. An administrator needs to approve your account before you can access the system.',
                textAlign: TextAlign.center,
                style: theme.labelMedium,
              ),
              const SizedBox(height: 32),
              FFButtonWidget(
                onPressed: () => context.go('/login'),
                text: 'Back to Login',
                options: FFButtonOptions(
                  width: 200,
                  height: 50,
                  color: theme.primary,
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
