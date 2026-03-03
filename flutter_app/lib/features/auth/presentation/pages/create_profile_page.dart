import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../application/auth_provider.dart';
import '../../../../core/network/api_service.dart';
import '../../../../flutter_flow/flutter_flow_theme.dart';
import '../../../../flutter_flow/flutter_flow_widgets.dart';
import '../../../../shared/widgets/glass_card.dart';

class CreateProfilePage extends ConsumerStatefulWidget {
  const CreateProfilePage({super.key});
  @override
  ConsumerState<CreateProfilePage> createState() => _CreateProfilePageState();
}

class _CreateProfilePageState extends ConsumerState<CreateProfilePage> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();
  String _role = 'employee';
  bool _obscure = true;
  String? _errorMsg;

  final List<String> _roles = ['admin', 'manager', 'employee', 'client'];

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _passCtrl.dispose();
    _confirmCtrl.dispose();
    super.dispose();
  }

  Future<void> _register() async {
    if (!_formKey.currentState!.validate()) return;
    if (_passCtrl.text != _confirmCtrl.text) {
      setState(() => _errorMsg = 'Passwords do not match');
      return;
    }
    setState(() => _errorMsg = null);
    try {
      await ref.read(authProvider.notifier).register(
            name: _nameCtrl.text.trim(),
            email: _emailCtrl.text.trim(),
            password: _passCtrl.text,
            role: _role,
          );
      if (mounted) context.go('/pending');
    } on ApiException catch (e) {
      setState(() => _errorMsg = e.message);
    } catch (_) {
      setState(() => _errorMsg = 'Registration failed');
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = FlutterFlowTheme.of(context);
    final isLoading = ref.watch(authProvider).isLoading;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text('Create Account',
            style: theme.titleMedium.copyWith(color: Colors.white)),
        leading: BackButton(
            color: Colors.white, onPressed: () => context.go('/login')),
      ),
      body: Container(
        height: double.infinity,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              theme.primary,
              const Color(0xFF1D2428),
              Colors.black,
            ],
          ),
        ),
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(24, 120, 24, 24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Form(
                key: _formKey,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    GlassCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          GlassTextInput(
                            label: 'Full Name',
                            controller: _nameCtrl,
                            hintText: 'John Doe',
                            validator: (v) =>
                                (v == null || v.isEmpty) ? 'Required' : null,
                          ),
                          const SizedBox(height: 16),
                          GlassTextInput(
                            label: 'Email Address',
                            controller: _emailCtrl,
                            hintText: 'you@company.com',
                            keyboardType: TextInputType.emailAddress,
                            validator: (v) => (v == null || !v.contains('@'))
                                ? 'Invalid email'
                                : null,
                          ),
                          const SizedBox(height: 16),
                          const Text(
                            'Role',
                            style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w600,
                                fontSize: 14),
                          ),
                          const SizedBox(height: 8),
                          GlassCard(
                            padding: EdgeInsets.zero,
                            opacity: 0.05,
                            borderRadius: 12,
                            child: DropdownButtonFormField<String>(
                              value: _role,
                              dropdownColor: const Color(0xFF262D34),
                              style: const TextStyle(color: Colors.white),
                              items: _roles
                                  .map((r) => DropdownMenuItem(
                                      value: r,
                                      child: Text(r.toUpperCase(),
                                          style: const TextStyle(
                                              color: Colors.white))))
                                  .toList(),
                              onChanged: (v) => setState(() => _role = v!),
                              decoration: const InputDecoration(
                                contentPadding:
                                    EdgeInsets.symmetric(horizontal: 16),
                                border: InputBorder.none,
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),
                          GlassTextInput(
                            label: 'Password',
                            controller: _passCtrl,
                            hintText: '••••••',
                            obscureText: _obscure,
                            validator: (v) => (v == null || v.length < 6)
                                ? 'Min 6 chars'
                                : null,
                          ),
                          const SizedBox(height: 16),
                          GlassTextInput(
                            label: 'Confirm Password',
                            controller: _confirmCtrl,
                            hintText: '••••••',
                            obscureText: _obscure,
                            validator: (v) =>
                                v != _passCtrl.text ? 'Mismatch' : null,
                          ),
                          Align(
                            alignment: Alignment.centerRight,
                            child: TextButton(
                              onPressed: () =>
                                  setState(() => _obscure = !_obscure),
                              child: Text(_obscure ? 'Show' : 'Hide',
                                  style: TextStyle(color: theme.primary)),
                            ),
                          ),
                          if (_errorMsg != null) ...[
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: theme.error.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(
                                    color: theme.error.withValues(alpha: 0.3)),
                              ),
                              child: Text(_errorMsg!,
                                  style: TextStyle(
                                      color: theme.error, fontSize: 13)),
                            ),
                            const SizedBox(height: 16),
                          ],
                          const SizedBox(height: 16),
                          SizedBox(
                            width: double.infinity,
                            child: FFButtonWidget(
                              onPressed: isLoading ? null : _register,
                              text: 'Create Account',
                              showLoadingIndicator: isLoading,
                              options: FFButtonOptions(
                                color: theme.primary,
                                height: 56,
                                borderRadius: BorderRadius.circular(16),
                                textStyle: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 17,
                                    fontWeight: FontWeight.bold),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
