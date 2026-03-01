import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../flutter_flow/flutter_flow_theme.dart';
import '../../flutter_flow/flutter_flow_widgets.dart';

class JobApplicationPage extends StatefulWidget {
  final String jobId;
  const JobApplicationPage({super.key, required this.jobId});
  @override
  State<JobApplicationPage> createState() => _JobApplicationPageState();
}

class _JobApplicationPageState extends State<JobApplicationPage> {
  final _formKey   = GlobalKey<FormState>();
  final _nameCtrl  = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _coverCtrl = TextEditingController();
  final _api       = ApiService();
  bool _saving     = false;
  bool _submitted  = false;

  Future<void> _apply() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      await _api.post('/applications', {
        'jobId':        widget.jobId,
        'applicantName': _nameCtrl.text.trim(),
        'email':         _emailCtrl.text.trim(),
        'phone':         _phoneCtrl.text.trim(),
        'coverLetter':   _coverCtrl.text.trim(),
      });
      setState(() => _submitted = true);
    } finally { setState(() => _saving = false); }
  }

  @override
  Widget build(BuildContext context) {
    final theme = FlutterFlowTheme.of(context);
    return Scaffold(
      backgroundColor: theme.primaryBackground,
      appBar: AppBar(backgroundColor: theme.secondaryBackground, title: Text('Apply for Job', style: theme.titleMedium)),
      body: _submitted
          ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
              Icon(Icons.check_circle, color: Colors.green, size: 72),
              const SizedBox(height: 16),
              Text('Application Submitted!', style: theme.headlineSmall),
              const SizedBox(height: 8),
              Text('We\'ll be in touch soon.', style: theme.labelMedium),
            ]))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Form(key: _formKey, child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                _field(theme, 'Full Name',    _nameCtrl,  'Your full name'),
                _field(theme, 'Email',        _emailCtrl, 'your@email.com', type: TextInputType.emailAddress),
                _field(theme, 'Phone',        _phoneCtrl, '+91 XXXXX XXXXX', type: TextInputType.phone),
                Text('Cover Letter', style: theme.bodyMedium), const SizedBox(height: 6),
                TextFormField(controller: _coverCtrl, maxLines: 5, decoration: InputDecoration(hintText: 'Tell us about yourself...', filled: true, fillColor: theme.secondaryBackground, border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)))),
                const SizedBox(height: 24),
                FFButtonWidget(onPressed: _saving ? null : _apply, text: 'Submit Application', showLoadingIndicator: _saving,
                  options: FFButtonOptions(color: theme.primary, height: 52, borderRadius: BorderRadius.circular(10), textStyle: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600))),
              ])),
            ),
    );
  }

  Widget _field(FlutterFlowTheme t, String label, TextEditingController ctrl, String hint, {TextInputType type = TextInputType.text}) =>
    Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style: t.bodyMedium), const SizedBox(height: 6),
      TextFormField(controller: ctrl, keyboardType: type, decoration: InputDecoration(hintText: hint, filled: true, fillColor: t.secondaryBackground, border: OutlineInputBorder(borderRadius: BorderRadius.circular(10))),
        validator: (v) => (v == null || v.isEmpty) ? 'Required' : null),
      const SizedBox(height: 14),
    ]);
}
