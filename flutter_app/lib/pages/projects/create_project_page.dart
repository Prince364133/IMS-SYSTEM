import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';
import '../../flutter_flow/flutter_flow_theme.dart';
import '../../flutter_flow/flutter_flow_widgets.dart';

class CreateProjectPage extends StatefulWidget {
  const CreateProjectPage({super.key});
  @override
  State<CreateProjectPage> createState() => _CreateProjectPageState();
}

class _CreateProjectPageState extends State<CreateProjectPage> {
  final _formKey    = GlobalKey<FormState>();
  final _nameCtrl   = TextEditingController();
  final _descCtrl   = TextEditingController();
  final _api        = ApiService();
  DateTime? _deadline;
  String    _priority = 'medium';
  bool      _saving   = false;
  String?   _error;

  final _priorities = ['low', 'medium', 'high', 'critical'];

  @override
  void dispose() {
    _nameCtrl.dispose();
    _descCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() { _saving = true; _error = null; });
    try {
      await _api.post('/projects', {
        'name':        _nameCtrl.text.trim(),
        'description': _descCtrl.text.trim(),
        'priority':    _priority,
        if (_deadline != null) 'deadline': _deadline!.toIso8601String(),
      });
      if (mounted) context.go('/projects');
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      setState(() => _saving = false);
    }
  }

  Future<void> _pickDate() async {
    final d = await showDatePicker(
      context:     context,
      initialDate: DateTime.now().add(const Duration(days: 7)),
      firstDate:   DateTime.now(),
      lastDate:    DateTime.now().add(const Duration(days: 365 * 3)),
    );
    if (d != null) setState(() => _deadline = d);
  }

  @override
  Widget build(BuildContext context) {
    final theme = FlutterFlowTheme.of(context);
    return Scaffold(
      backgroundColor: theme.primaryBackground,
      appBar: AppBar(
        backgroundColor: theme.secondaryBackground,
        title:   Text('New Project', style: theme.titleMedium),
        leading: BackButton(onPressed: () => context.go('/projects')),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Project Name', style: theme.bodyMedium),
              const SizedBox(height: 6),
              TextFormField(
                controller: _nameCtrl,
                decoration: InputDecoration(
                  hintText:  'e.g. Website Redesign',
                  filled:    true,
                  fillColor: theme.secondaryBackground,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                ),
                validator: (v) => (v == null || v.trim().isEmpty) ? 'Name is required' : null,
              ),
              const SizedBox(height: 16),
              Text('Description', style: theme.bodyMedium),
              const SizedBox(height: 6),
              TextFormField(
                controller: _descCtrl,
                maxLines:   4,
                decoration: InputDecoration(
                  hintText:  'Describe the project...',
                  filled:    true,
                  fillColor: theme.secondaryBackground,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
              const SizedBox(height: 16),
              Text('Priority', style: theme.bodyMedium),
              const SizedBox(height: 6),
              DropdownButtonFormField<String>(
                value: _priority,
                items: _priorities.map((p) =>
                    DropdownMenuItem(value: p, child: Text(p.toUpperCase()))).toList(),
                onChanged: (v) => setState(() => _priority = v!),
                decoration: InputDecoration(
                  filled:    true,
                  fillColor: theme.secondaryBackground,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
              const SizedBox(height: 16),
              Text('Deadline', style: theme.bodyMedium),
              const SizedBox(height: 6),
              GestureDetector(
                onTap: _pickDate,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                  decoration: BoxDecoration(
                    color:        theme.secondaryBackground,
                    borderRadius: BorderRadius.circular(10),
                    border:       Border.all(color: theme.alternate),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.calendar_today_outlined, color: theme.secondaryText, size: 18),
                      const SizedBox(width: 10),
                      Text(
                        _deadline != null
                            ? _deadline!.toLocal().toString().substring(0, 10)
                            : 'Select deadline',
                        style: theme.bodyMedium.copyWith(
                          color: _deadline != null ? theme.primaryText : theme.secondaryText,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(_error!, style: TextStyle(color: theme.error)),
              ],
              const SizedBox(height: 28),
              FFButtonWidget(
                onPressed:            _saving ? null : _save,
                text:                 'Create Project',
                showLoadingIndicator: _saving,
                options: FFButtonOptions(
                  color:        theme.primary,
                  height:       52,
                  borderRadius: BorderRadius.circular(10),
                  textStyle:    const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
