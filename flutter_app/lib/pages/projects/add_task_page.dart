import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../services/api_service.dart';
import '../../flutter_flow/flutter_flow_theme.dart';
import '../../flutter_flow/flutter_flow_widgets.dart';

class AddTaskPage extends StatefulWidget {
  final String projectId;
  const AddTaskPage({super.key, required this.projectId});
  @override
  State<AddTaskPage> createState() => _AddTaskPageState();
}

class _AddTaskPageState extends State<AddTaskPage> {
  final _formKey  = GlobalKey<FormState>();
  final _titleCtrl = TextEditingController();
  final _descCtrl  = TextEditingController();
  final _api       = ApiService();
  String    _priority = 'medium';
  DateTime? _dueDate;
  bool      _saving   = false;
  String?   _error;
  List<dynamic> _members = [];
  String?   _assigneeId;

  @override
  void initState() { super.initState(); _loadMembers(); }

  Future<void> _loadMembers() async {
    try {
      final res = await _api.get('/users');
      setState(() => _members = res['users'] ?? []);
    } catch (_) {}
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() { _saving = true; _error = null; });
    try {
      await _api.post('/tasks', {
        'title':       _titleCtrl.text.trim(),
        'description': _descCtrl.text.trim(),
        'projectId':   widget.projectId,
        'priority':    _priority,
        if (_assigneeId != null) 'assigneeId': _assigneeId,
        if (_dueDate    != null) 'dueDate':    _dueDate!.toIso8601String(),
      });
      if (mounted) context.go('/projects/${widget.projectId}/tasks');
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = FlutterFlowTheme.of(context);
    return Scaffold(
      backgroundColor: theme.primaryBackground,
      appBar: AppBar(
        backgroundColor: theme.secondaryBackground,
        title:   Text('Add Task', style: theme.titleMedium),
        leading: BackButton(onPressed: () => context.go('/projects/${widget.projectId}/tasks')),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _label(theme, 'Task Title'),
              TextFormField(
                controller: _titleCtrl,
                decoration: _dec(theme, 'Enter task title'),
                validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
              ),
              const SizedBox(height: 14),
              _label(theme, 'Description'),
              TextFormField(controller: _descCtrl, maxLines: 3, decoration: _dec(theme, 'Optional description')),
              const SizedBox(height: 14),
              _label(theme, 'Priority'),
              DropdownButtonFormField<String>(
                value: _priority,
                items: ['low','medium','high','critical'].map((p) =>
                    DropdownMenuItem(value: p, child: Text(p.toUpperCase()))).toList(),
                onChanged: (v) => setState(() => _priority = v!),
                decoration: InputDecoration(filled: true, fillColor: theme.secondaryBackground,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10))),
              ),
              const SizedBox(height: 14),
              _label(theme, 'Assign To'),
              DropdownButtonFormField<String>(
                value: _assigneeId,
                hint: const Text('Select member'),
                items: _members.map<DropdownMenuItem<String>>((m) =>
                    DropdownMenuItem(value: m['_id'], child: Text(m['name'] ?? ''))).toList(),
                onChanged: (v) => setState(() => _assigneeId = v),
                decoration: InputDecoration(filled: true, fillColor: theme.secondaryBackground,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10))),
              ),
              const SizedBox(height: 14),
              _label(theme, 'Due Date'),
              GestureDetector(
                onTap: () async {
                  final d = await showDatePicker(
                    context: context,
                    initialDate: DateTime.now().add(const Duration(days: 3)),
                    firstDate: DateTime.now(),
                    lastDate:  DateTime.now().add(const Duration(days: 365)),
                  );
                  if (d != null) setState(() => _dueDate = d);
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                  decoration: BoxDecoration(
                    color: theme.secondaryBackground,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: theme.alternate),
                  ),
                  child: Row(children: [
                    Icon(Icons.calendar_today_outlined, size: 16, color: theme.secondaryText),
                    const SizedBox(width: 8),
                    Text(
                      _dueDate != null ? _dueDate!.toString().substring(0, 10) : 'Pick due date',
                      style: theme.bodyMedium.copyWith(color: _dueDate != null ? null : theme.secondaryText),
                    ),
                  ]),
                ),
              ),
              if (_error != null) ...[
                const SizedBox(height: 10),
                Text(_error!, style: TextStyle(color: theme.error)),
              ],
              const SizedBox(height: 28),
              FFButtonWidget(
                onPressed: _saving ? null : _save,
                text: 'Add Task',
                showLoadingIndicator: _saving,
                options: FFButtonOptions(
                  color: theme.primary, height: 52, borderRadius: BorderRadius.circular(10),
                  textStyle: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _label(FlutterFlowTheme t, String text) =>
      Padding(padding: const EdgeInsets.only(bottom: 6), child: Text(text, style: t.bodyMedium));

  InputDecoration _dec(FlutterFlowTheme t, String hint) => InputDecoration(
    hintText: hint, filled: true, fillColor: t.secondaryBackground,
    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
  );
}
