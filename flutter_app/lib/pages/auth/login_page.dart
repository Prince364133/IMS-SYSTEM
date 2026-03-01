import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../services/auth_service.dart';
import '../../services/api_service.dart';
import '../../flutter_flow/flutter_flow_theme.dart';
import '../../flutter_flow/flutter_flow_widgets.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _formKey       = GlobalKey<FormState>();
  final _emailCtrl     = TextEditingController();
  final _passwordCtrl  = TextEditingController();
  bool  _obscure       = true;
  String? _errorMsg;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _errorMsg = null);
    try {
      await context.read<AuthService>().login(
        _emailCtrl.text.trim(),
        _passwordCtrl.text,
      );
      if (mounted) {
        final role = context.read<AuthService>().currentUser?.role ?? 'pending';
        if (role == 'pending') {
          context.go('/pending');
        } else if (role == 'superadmin') {
          context.go('/superadmin');
        } else {
          context.go('/home');
        }
      }
    } on ApiException catch (e) {
      setState(() => _errorMsg = e.message);
    } catch (_) {
      setState(() => _errorMsg = 'An unexpected error occurred');
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme   = FlutterFlowTheme.of(context);
    final isLoading = context.watch<AuthService>().isLoading;

    return Scaffold(
      backgroundColor: theme.primaryBackground,
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 420),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // ── Logo / Brand ──────────────────────────────────────
                  Center(
                    child: Container(
                      width: 72, height: 72,
                      decoration: BoxDecoration(
                        color:        theme.primary,
                        borderRadius: BorderRadius.circular(18),
                      ),
                      child: const Icon(Icons.all_inclusive, color: Colors.white, size: 40),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Center(
                    child: Text('Instaura IMS', style: theme.headlineMedium),
                  ),
                  const SizedBox(height: 8),
                  Center(
                    child: Text('Sign in to continue', style: theme.labelMedium),
                  ),
                  const SizedBox(height: 32),

                  // ── Email ──────────────────────────────────────────────
                  Text('Email', style: theme.bodyMedium),
                  const SizedBox(height: 6),
                  TextFormField(
                    controller:  _emailCtrl,
                    keyboardType: TextInputType.emailAddress,
                    decoration: InputDecoration(
                      hintText:        'you@company.com',
                      filled:          true,
                      fillColor:       theme.secondaryBackground,
                      border:          OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide:   BorderSide(color: theme.alternate),
                      ),
                      prefixIcon: const Icon(Icons.email_outlined),
                    ),
                    validator: (v) => (v == null || !v.contains('@'))
                        ? 'Enter a valid email'
                        : null,
                  ),
                  const SizedBox(height: 16),

                  // ── Password ───────────────────────────────────────────
                  Text('Password', style: theme.bodyMedium),
                  const SizedBox(height: 6),
                  TextFormField(
                    controller:  _passwordCtrl,
                    obscureText: _obscure,
                    decoration: InputDecoration(
                      hintText:  '••••••••',
                      filled:    true,
                      fillColor: theme.secondaryBackground,
                      border:    OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide:   BorderSide(color: theme.alternate),
                      ),
                      prefixIcon: const Icon(Icons.lock_outline),
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscure ? Icons.visibility_off : Icons.visibility,
                        ),
                        onPressed: () => setState(() => _obscure = !_obscure),
                      ),
                    ),
                    validator: (v) =>
                        (v == null || v.length < 6) ? 'Min 6 characters' : null,
                  ),
                  const SizedBox(height: 8),

                  // ── Error ─────────────────────────────────────────────
                  if (_errorMsg != null)
                    Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color:        theme.error.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.error_outline, color: theme.error, size: 18),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(_errorMsg!, style: TextStyle(color: theme.error)),
                          ),
                        ],
                      ),
                    ),

                  const SizedBox(height: 16),
                  // ── Login button ──────────────────────────────────────
                  FFButtonWidget(
                    onPressed:            isLoading ? null : _login,
                    text:                 'Sign In',
                    showLoadingIndicator: isLoading,
                    options: FFButtonOptions(
                      color:        theme.primary,
                      height:       52,
                      borderRadius: BorderRadius.circular(10),
                      textStyle:    const TextStyle(
                        color:     Colors.white,
                        fontSize:  16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // ── Register link ─────────────────────────────────────
                  Center(
                    child: GestureDetector(
                      onTap: () => context.go('/create-profile'),
                      child: RichText(
                        text: TextSpan(
                          text:  "Don't have an account? ",
                          style: theme.bodyMedium,
                          children: [
                            TextSpan(
                              text:  'Register',
                              style: TextStyle(
                                color:      theme.primary,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
