import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../application/project_provider.dart';
import '../../../../flutter_flow/flutter_flow_theme.dart';
import '../../../../flutter_flow/flutter_flow_widgets.dart';
import '../../../../shared/widgets/success_modal.dart';
import '../../../../shared/widgets/glass_card.dart';

class CreateProjectPage extends ConsumerStatefulWidget {
  const CreateProjectPage({super.key});
  @override
  ConsumerState<CreateProjectPage> createState() => _CreateProjectPageState();
}

class _CreateProjectPageState extends ConsumerState<CreateProjectPage> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  DateTime? _deadline;
  String _priority = 'medium';
  bool _saving = false;
  String? _error;

  final _priorities = ['low', 'medium', 'high', 'critical'];

  @override
  void dispose() {
    _nameCtrl.dispose();
    _descCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    if (mounted) {
      setState(() {
        _saving = true;
        _error = null;
      });
    }
    try {
      await ref.read(projectProvider.notifier).createProject({
        'name': _nameCtrl.text.trim(),
        'description': _descCtrl.text.trim(),
        'priority': _priority,
        if (_deadline != null) 'deadline': _deadline!.toIso8601String(),
      });

      if (mounted) {
        showSuccessModal(
          context,
          message: 'Project Created Successfully!',
          onComplete: () => context.go('/projects'),
        );
      }
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _pickDate() async {
    final d = await showDatePicker(
      context: context,
      initialDate: DateTime.now().add(const Duration(days: 7)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365 * 3)),
    );
    if (d != null) setState(() => _deadline = d);
  }

  @override
  Widget build(BuildContext context) {
    final theme = FlutterFlowTheme.of(context);
    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text('New Project',
            style: theme.titleMedium.copyWith(color: Colors.white)),
        leading: BackButton(
            color: Colors.white, onPressed: () => context.go('/projects')),
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
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 120, 24, 24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                GlassCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      GlassTextInput(
                        label: 'Project Name',
                        controller: _nameCtrl,
                        hintText: 'e.g. Website Redesign',
                        validator: (v) => (v == null || v.trim().isEmpty)
                            ? 'Name is required'
                            : null,
                      ),
                      const SizedBox(height: 20),
                      GlassTextInput(
                        label: 'Description',
                        controller: _descCtrl,
                        hintText: 'Describe the project...',
                        maxLines: 4,
                      ),
                      const SizedBox(height: 20),
                      const Text(
                        'Priority',
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
                          value: _priority,
                          dropdownColor: const Color(0xFF262D34),
                          style: const TextStyle(color: Colors.white),
                          items: _priorities
                              .map((p) => DropdownMenuItem(
                                  value: p,
                                  child: Text(p.toUpperCase(),
                                      style: const TextStyle(
                                          color: Colors.white))))
                              .toList(),
                          onChanged: (v) => setState(() => _priority = v!),
                          decoration: const InputDecoration(
                            contentPadding:
                                EdgeInsets.symmetric(horizontal: 16),
                            border: InputBorder.none,
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),
                      const Text(
                        'Deadline',
                        style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                            fontSize: 14),
                      ),
                      const SizedBox(height: 8),
                      GestureDetector(
                        onTap: _pickDate,
                        child: GlassCard(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 14),
                          opacity: 0.05,
                          borderRadius: 12,
                          child: Row(
                            children: [
                              const Icon(Icons.calendar_today_outlined,
                                  color: Colors.white70, size: 18),
                              const SizedBox(width: 10),
                              Text(
                                _deadline != null
                                    ? _deadline!
                                        .toLocal()
                                        .toString()
                                        .substring(0, 10)
                                    : 'Select deadline',
                                style: TextStyle(
                                  color: _deadline != null
                                      ? Colors.white
                                      : Colors.white38,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                if (_error != null) ...[
                  const SizedBox(height: 12),
                  Text(_error!, style: TextStyle(color: theme.error)),
                ],
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  child: FFButtonWidget(
                    onPressed: _saving ? null : _save,
                    text: 'Create Project',
                    showLoadingIndicator: _saving,
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
        ),
      ),
    );
  }
}
