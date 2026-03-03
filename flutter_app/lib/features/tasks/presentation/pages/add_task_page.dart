import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../application/task_provider.dart';
import '../../../../flutter_flow/flutter_flow_theme.dart';
import '../../../../flutter_flow/flutter_flow_widgets.dart';
import '../../../../core/network/api_service.dart';
import '../../../../core/di/service_locator.dart';
import '../../../../shared/widgets/success_modal.dart';
import '../../../../shared/widgets/glass_card.dart';

class AddTaskPage extends ConsumerStatefulWidget {
  final String projectId;
  const AddTaskPage({super.key, required this.projectId});
  @override
  ConsumerState<AddTaskPage> createState() => _AddTaskPageState();
}

class _AddTaskPageState extends ConsumerState<AddTaskPage> {
  final _formKey = GlobalKey<FormState>();
  final _titleCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  String _priority = 'medium';
  DateTime? _dueDate;
  bool _saving = false;
  String? _error;
  List<dynamic> _members = [];
  String? _assigneeId;

  @override
  void initState() {
    super.initState();
    _loadMembers();
  }

  Future<void> _loadMembers() async {
    try {
      final api = locator<ApiService>();
      final res = await api.get('/users');
      if (mounted) setState(() => _members = res['users'] ?? []);
    } catch (_) {}
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
      await ref.read(taskProvider.notifier).createTask({
        'title': _titleCtrl.text.trim(),
        'description': _descCtrl.text.trim(),
        'projectId': widget.projectId,
        'priority': _priority,
        if (_assigneeId != null) 'assigneeId': _assigneeId,
        if (_dueDate != null) 'dueDate': _dueDate!.toIso8601String(),
      });
      if (mounted) {
        showSuccessModal(
          context,
          message: 'Task Added Successfully!',
          onComplete: () => context.go('/projects/${widget.projectId}/tasks'),
        );
      }
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = FlutterFlowTheme.of(context);
    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text('Add Task',
            style: theme.titleMedium.copyWith(color: Colors.white)),
        leading: BackButton(
            color: Colors.white,
            onPressed: () => context.go('/projects/${widget.projectId}/tasks')),
      ),
      body: Container(
        height: double.infinity,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              theme.primary,
              const Color(0xFF14181B),
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
                        label: 'Task Title',
                        controller: _titleCtrl,
                        hintText: 'Enter task title',
                        validator: (v) =>
                            (v == null || v.trim().isEmpty) ? 'Required' : null,
                      ),
                      const SizedBox(height: 20),
                      GlassTextInput(
                        label: 'Description',
                        controller: _descCtrl,
                        maxLines: 3,
                        hintText: 'Optional description',
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
                          dropdownColor: const Color(0xFF14181B),
                          style: const TextStyle(color: Colors.white),
                          items: ['low', 'medium', 'high', 'critical']
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
                        'Assign To',
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
                          value: _assigneeId,
                          hint: const Text('Select member',
                              style: TextStyle(color: Colors.white38)),
                          dropdownColor: const Color(0xFF14181B),
                          style: const TextStyle(color: Colors.white),
                          items: _members
                              .map<DropdownMenuItem<String>>((m) =>
                                  DropdownMenuItem(
                                      value: m['_id'],
                                      child: Text(m['name'] ?? '',
                                          style: const TextStyle(
                                              color: Colors.white))))
                              .toList(),
                          onChanged: (v) => setState(() => _assigneeId = v),
                          decoration: const InputDecoration(
                            contentPadding:
                                EdgeInsets.symmetric(horizontal: 16),
                            border: InputBorder.none,
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),
                      const Text(
                        'Due Date',
                        style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                            fontSize: 14),
                      ),
                      const SizedBox(height: 8),
                      GestureDetector(
                        onTap: () async {
                          final d = await showDatePicker(
                            context: context,
                            initialDate:
                                DateTime.now().add(const Duration(days: 3)),
                            firstDate: DateTime.now(),
                            lastDate:
                                DateTime.now().add(const Duration(days: 365)),
                          );
                          if (d != null) setState(() => _dueDate = d);
                        },
                        child: GlassCard(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 14),
                          opacity: 0.05,
                          borderRadius: 12,
                          child: Row(children: [
                            const Icon(Icons.calendar_today_outlined,
                                size: 16, color: Colors.white70),
                            const SizedBox(width: 8),
                            Text(
                              _dueDate != null
                                  ? _dueDate!.toString().substring(0, 10)
                                  : 'Pick due date',
                              style: TextStyle(
                                  color: _dueDate != null
                                      ? Colors.white
                                      : Colors.white38),
                            ),
                          ]),
                        ),
                      ),
                    ],
                  ),
                ),
                if (_error != null) ...[
                  const SizedBox(height: 10),
                  Text(_error!, style: TextStyle(color: theme.error)),
                ],
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  child: FFButtonWidget(
                    onPressed: _saving ? null : _save,
                    text: 'Add Task',
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
