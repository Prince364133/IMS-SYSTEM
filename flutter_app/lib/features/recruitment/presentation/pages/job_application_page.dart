import 'package:flutter/material.dart';
import '../../../../core/network/api_service.dart';
import '../../../../flutter_flow/flutter_flow_theme.dart';
import '../../../../flutter_flow/flutter_flow_widgets.dart';
import '../../../../shared/widgets/glass_card.dart';
import '../../../../shared/widgets/success_lottie.dart';

class JobApplicationPage extends StatefulWidget {
  final String jobId;
  const JobApplicationPage({super.key, required this.jobId});
  @override
  State<JobApplicationPage> createState() => _JobApplicationPageState();
}

class _JobApplicationPageState extends State<JobApplicationPage> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _coverCtrl = TextEditingController();
  final _api = ApiService();
  bool _saving = false;
  bool _submitted = false;

  Future<void> _apply() async {
    if (!_formKey.currentState!.validate()) return;
    if (mounted) setState(() => _saving = true);
    try {
      await _api.post('/applications', {
        'jobId': widget.jobId,
        'applicantName': _nameCtrl.text.trim(),
        'email': _emailCtrl.text.trim(),
        'phone': _phoneCtrl.text.trim(),
        'coverLetter': _coverCtrl.text.trim(),
      });
      if (mounted) setState(() => _submitted = true);
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
        title: Text('Job Application',
            style: theme.titleMedium.copyWith(color: Colors.white)),
        leading: BackButton(
            color: Colors.white, onPressed: () => Navigator.of(context).pop()),
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
        child: _submitted
            ? Center(
                child: GlassCard(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const SuccessLottie(message: 'Application Submitted!'),
                      const SizedBox(height: 16),
                      Text('We\'ll be in touch soon.',
                          style: theme.labelMedium
                              .copyWith(color: Colors.white70)),
                      const SizedBox(height: 24),
                      FFButtonWidget(
                        onPressed: () => Navigator.of(context).pop(),
                        text: 'Go Back',
                        options: FFButtonOptions(
                          color: theme.primary,
                          height: 44,
                          borderRadius: BorderRadius.circular(12),
                          textStyle: const TextStyle(
                              color: Colors.white, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                ),
              )
            : SingleChildScrollView(
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
                              label: 'Full Name',
                              controller: _nameCtrl,
                              hintText: 'Your full name',
                              validator: (v) =>
                                  (v == null || v.isEmpty) ? 'Required' : null,
                            ),
                            const SizedBox(height: 16),
                            GlassTextInput(
                              label: 'Email',
                              controller: _emailCtrl,
                              hintText: 'your@email.com',
                              keyboardType: TextInputType.emailAddress,
                              validator: (v) => (v == null || !v.contains('@'))
                                  ? 'Invalid email'
                                  : null,
                            ),
                            const SizedBox(height: 16),
                            GlassTextInput(
                              label: 'Phone',
                              controller: _phoneCtrl,
                              hintText: '+91 XXXXX XXXXX',
                              keyboardType: TextInputType.phone,
                              validator: (v) =>
                                  (v == null || v.isEmpty) ? 'Required' : null,
                            ),
                            const SizedBox(height: 16),
                            const Text(
                              'Cover Letter',
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
                              child: TextFormField(
                                controller: _coverCtrl,
                                maxLines: 5,
                                style: const TextStyle(color: Colors.white),
                                decoration: InputDecoration(
                                  hintText: 'Tell us about yourself...',
                                  hintStyle: TextStyle(
                                      color:
                                          Colors.white.withValues(alpha: 0.3)),
                                  contentPadding: const EdgeInsets.all(16),
                                  border: InputBorder.none,
                                ),
                              ),
                            ),
                            const SizedBox(height: 32),
                            SIDedButton(
                              onPressed: _saving ? null : _apply,
                              isLoading: _saving,
                              text: 'Submit Application',
                              color: theme.primary,
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

class SIDedButton extends StatelessWidget {
  final VoidCallback? onPressed;
  final bool isLoading;
  final String text;
  final Color color;

  const SIDedButton(
      {super.key,
      this.onPressed,
      this.isLoading = false,
      required this.text,
      required this.color});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: isLoading ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: color,
          foregroundColor: Colors.white,
          minimumSize: const Size(double.infinity, 56),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          elevation: 4,
        ),
        child: isLoading
            ? const SizedBox(
                height: 24,
                width: 24,
                child: CircularProgressIndicator(
                    color: Colors.white, strokeWidth: 2))
            : Text(text,
                style:
                    const TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
      ),
    );
  }
}
