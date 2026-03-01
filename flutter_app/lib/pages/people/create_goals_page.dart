import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../services/api_service.dart';
import '../../flutter_flow/flutter_flow_theme.dart';
import '../../flutter_flow/flutter_flow_widgets.dart';

class CreateGoalsPage extends StatefulWidget {
  final String employeeId;
  const CreateGoalsPage({super.key, required this.employeeId});
  @override
  State<CreateGoalsPage> createState() => _CreateGoalsPageState();
}

class _CreateGoalsPageState extends State<CreateGoalsPage> {
  final _formKey  = GlobalKey<FormState>();
  final _nameCtrl   = TextEditingController();
  final _metricCtrl = TextEditingController();
  final _api      = ApiService();
  int       _target  = 10;
  DateTime? _deadline;
  bool      _saving  = false;

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      await _api.post('/goals', {
        'name':       _nameCtrl.text.trim(),
        'metric':     _metricCtrl.text.trim(),
        'target':     _target,
        'employeeId': widget.employeeId,
        if (_deadline != null) 'deadline': _deadline!.toIso8601String(),
      });
      if (mounted) context.pop();
    } finally { setState(() => _saving = false); }
  }

  @override
  Widget build(BuildContext context) {
    final theme = FlutterFlowTheme.of(context);
    return Scaffold(
      backgroundColor: theme.primaryBackground,
      appBar: AppBar(backgroundColor: theme.secondaryBackground, title: Text('Add Goal', style: theme.titleMedium)),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(key: _formKey, child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Goal Name', style: theme.bodyMedium), const SizedBox(height: 6),
          TextFormField(controller: _nameCtrl, decoration: InputDecoration(hintText: 'e.g. Close 10 deals', filled: true, fillColor: theme.secondaryBackground, border: OutlineInputBorder(borderRadius: BorderRadius.circular(10))),
            validator: (v) => (v == null || v.isEmpty) ? 'Required' : null),
          const SizedBox(height: 14),
          Text('Metric / KPI', style: theme.bodyMedium), const SizedBox(height: 6),
          TextFormField(controller: _metricCtrl, decoration: InputDecoration(hintText: 'e.g. deals/quarter', filled: true, fillColor: theme.secondaryBackground, border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)))),
          const SizedBox(height: 14),
          Text('Target: $_target', style: theme.bodyMedium),
          Slider(value: _target.toDouble(), min: 1, max: 100, divisions: 99, label: '$_target', activeColor: theme.primary, onChanged: (v) => setState(() => _target = v.round())),
          const SizedBox(height: 14),
          Text('Deadline', style: theme.bodyMedium), const SizedBox(height: 6),
          GestureDetector(
            onTap: () async {
              final d = await showDatePicker(context: context, initialDate: DateTime.now().add(const Duration(days: 30)), firstDate: DateTime.now(), lastDate: DateTime.now().add(const Duration(days: 365)));
              if (d != null) setState(() => _deadline = d);
            },
            child: Container(padding: const EdgeInsets.all(14), decoration: BoxDecoration(color: theme.secondaryBackground, borderRadius: BorderRadius.circular(10), border: Border.all(color: theme.alternate)),
              child: Row(children: [Icon(Icons.calendar_today_outlined, size: 16, color: theme.secondaryText), const SizedBox(width: 8), Text(_deadline != null ? _deadline!.toString().substring(0, 10) : 'Pick deadline', style: theme.bodyMedium.copyWith(color: _deadline != null ? null : theme.secondaryText))])),
          ),
          const SizedBox(height: 28),
          FFButtonWidget(onPressed: _saving ? null : _save, text: 'Save Goal', showLoadingIndicator: _saving,
            options: FFButtonOptions(color: theme.primary, height: 52, borderRadius: BorderRadius.circular(10), textStyle: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600))),
        ])),
      ),
    );
  }
}
