import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/network/api_service.dart';
import '../../../../flutter_flow/flutter_flow_theme.dart';
import '../../../../flutter_flow/flutter_flow_widgets.dart';
import '../../../../shared/widgets/glass_card.dart';

class CreateGoalsPage extends StatefulWidget {
  final String employeeId;
  const CreateGoalsPage({super.key, required this.employeeId});
  @override
  State<CreateGoalsPage> createState() => _CreateGoalsPageState();
}

class _CreateGoalsPageState extends State<CreateGoalsPage> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _metricCtrl = TextEditingController();
  final _api = ApiService();
  int _target = 10;
  DateTime? _deadline;
  bool _saving = false;

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    if (mounted) setState(() => _saving = true);
    try {
      await _api.post('/goals', {
        'name': _nameCtrl.text.trim(),
        'metric': _metricCtrl.text.trim(),
        'target': _target,
        'employeeId': widget.employeeId,
        if (_deadline != null) 'deadline': _deadline!.toIso8601String(),
      });
      if (mounted) context.pop();
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = FlutterFlowTheme.of(context);
    return Scaffold(
      extendBodyBehindAppBar: true,
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text('Add New Goal',
            style: theme.titleMedium.copyWith(color: Colors.white)),
        leading: const BackButton(color: Colors.white),
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
                        label: 'Goal Name',
                        controller: _nameCtrl,
                        hintText: 'e.g. Close 10 deals',
                        validator: (v) =>
                            (v == null || v.isEmpty) ? 'Required' : null,
                      ),
                      const SizedBox(height: 16),
                      GlassTextInput(
                        label: 'Metric / KPI',
                        controller: _metricCtrl,
                        hintText: 'e.g. deals/quarter',
                      ),
                      const SizedBox(height: 24),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Target Value',
                              style: theme.bodyMedium.copyWith(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold)),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 12, vertical: 4),
                            decoration: BoxDecoration(
                              color: theme.primary.withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                  color: theme.primary.withValues(alpha: 0.5)),
                            ),
                            child: Text('$_target',
                                style: TextStyle(
                                    color: theme.primary,
                                    fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                      Slider(
                        value: _target.toDouble(),
                        min: 1,
                        max: 100,
                        divisions: 99,
                        label: '$_target',
                        activeColor: theme.primary,
                        inactiveColor: Colors.white10,
                        onChanged: (v) => setState(() => _target = v.round()),
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'Deadline',
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
                                DateTime.now().add(const Duration(days: 30)),
                            firstDate: DateTime.now(),
                            lastDate:
                                DateTime.now().add(const Duration(days: 365)),
                            builder: (context, child) {
                              return Theme(
                                data: Theme.of(context).copyWith(
                                  colorScheme: ColorScheme.dark(
                                    primary: theme.primary,
                                    onPrimary: Colors.white,
                                    surface: const Color(0xFF1D2428),
                                    onSurface: Colors.white,
                                  ),
                                ),
                                child: child!,
                              );
                            },
                          );
                          if (d != null) setState(() => _deadline = d);
                        },
                        child: GlassCard(
                          padding: const EdgeInsets.all(16),
                          opacity: 0.05,
                          borderRadius: 12,
                          child: Row(
                            children: [
                              Icon(Icons.calendar_today_outlined,
                                  size: 18, color: theme.primary),
                              const SizedBox(width: 12),
                              Text(
                                _deadline != null
                                    ? _deadline!.toString().substring(0, 10)
                                    : 'Pick a deadline',
                                style: TextStyle(
                                  color: _deadline != null
                                      ? Colors.white
                                      : Colors.white38,
                                  fontSize: 15,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 32),
                      SizedBox(
                        width: double.infinity,
                        child: FFButtonWidget(
                          onPressed: _saving ? null : _save,
                          text: 'Save Goal',
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
              ],
            ),
          ),
        ),
      ),
    );
  }
}
