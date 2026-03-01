import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../services/auth_service.dart';
import '../../services/api_service.dart';
import '../../flutter_flow/flutter_flow_theme.dart';
import '../../flutter_flow/flutter_flow_widgets.dart';

class CreateProfilePage extends StatefulWidget {
  const CreateProfilePage({super.key});
  @override
  State<CreateProfilePage> createState() => _CreateProfilePageState();
}

class _CreateProfilePageState extends State<CreateProfilePage> {
  final _formKey     = GlobalKey<FormState>();
  final _nameCtrl    = TextEditingController();
  final _emailCtrl   = TextEditingController();
  final _passCtrl    = TextEditingController();
  final _confirmCtrl = TextEditingController();
  String  _role      = 'employee';
  bool    _obscure   = true;
  String? _errorMsg;

  final List<String> _roles = ['admin', 'manager', 'employee', 'client'];

  @override
  void dispose() {
    _nameCtrl.dispose(); _emailCtrl.dispose();
    _passCtrl.dispose(); _confirmCtrl.dispose();
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
      await context.read<AuthService>().register(
        name:     _nameCtrl.text.trim(),
        email:    _emailCtrl.text.trim(),
        password: _passCtrl.text,
        role:     _role,
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
    final theme     = FlutterFlowTheme.of(context);
    final isLoading = context.watch<AuthService>().isLoading;

    return Scaffold(
      backgroundColor: theme.primaryBackground,
      appBar: AppBar(
        backgroundColor: theme.secondaryBackground,
        title: Text('Create Account', style: theme.titleMedium),
        leading: BackButton(onPressed: () => context.go('/login')),
      ),
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
                  _field('Full Name',  _nameCtrl,  'John Doe',        Icons.person_outline, false),
                  const SizedBox(height: 12),
                  _field('Email',      _emailCtrl, 'you@company.com', Icons.email_outlined, false,
                    type: TextInputType.emailAddress),
                  const SizedBox(height: 12),
                  // ── Role picker ─────────────────────────────────────
                  Text('Role', style: theme.bodyMedium),
                  const SizedBox(height: 6),
                  DropdownButtonFormField<String>(
                    value:        _role,
                    items:        _roles.map((r) =>
                      DropdownMenuItem(value: r, child: Text(r.toUpperCase()))).toList(),
                    onChanged:    (v) => setState(() => _role = v!),
                    decoration:   InputDecoration(
                      filled:    true,
                      fillColor: theme.secondaryBackground,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                  const SizedBox(height: 12),
                  _field('Password',         _passCtrl,    '••••••',  Icons.lock_outline, _obscure),
                  const SizedBox(height: 12),
                  _field('Confirm Password', _confirmCtrl, '••••••',  Icons.lock_outline, _obscure),
                  const SizedBox(height: 4),
                  Align(
                    alignment: Alignment.centerRight,
                    child: TextButton(
                      onPressed: () => setState(() => _obscure = !_obscure),
                      child: Text(_obscure ? 'Show' : 'Hide'),
                    ),
                  ),

                  if (_errorMsg != null) ...[
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color:        theme.error.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(_errorMsg!, style: TextStyle(color: theme.error)),
                    ),
                  ],
                  const SizedBox(height: 20),
                  FFButtonWidget(
                    onPressed:            isLoading ? null : _register,
                    text:                 'Create Account',
                    showLoadingIndicator: isLoading,
                    options: FFButtonOptions(
                      color:        theme.primary,
                      height:       52,
                      borderRadius: BorderRadius.circular(10),
                      textStyle: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600),
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

  Widget _field(String label, TextEditingController ctrl, String hint,
      IconData icon, bool obscure, {TextInputType type = TextInputType.text}) {
    final theme = FlutterFlowTheme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: theme.bodyMedium),
        const SizedBox(height: 6),
        TextFormField(
          controller:   ctrl,
          obscureText:  obscure,
          keyboardType: type,
          decoration:   InputDecoration(
            hintText:  hint,
            filled:    true,
            fillColor: theme.secondaryBackground,
            border:    OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
            prefixIcon: Icon(icon),
          ),
          validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
        ),
      ],
    );
  }
}
