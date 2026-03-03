import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/network/api_service.dart';
import '../../../flutter_flow/flutter_flow_theme.dart';
import '../../../flutter_flow/flutter_flow_widgets.dart';

/// Reusable page to edit description of a project or task.
class AddDescriptionPage extends StatefulWidget {
  final String docId;
  final String docType; // 'project' | 'task'
  const AddDescriptionPage(
      {super.key, required this.docId, required this.docType});
  @override
  State<AddDescriptionPage> createState() => _AddDescriptionPageState();
}

class _AddDescriptionPageState extends State<AddDescriptionPage> {
  final _ctrl = TextEditingController();
  final _api = ApiService();
  bool _saving = false;
  String? _error;

  Future<void> _save() async {
    if (mounted)
      setState(() {
        _saving = true;
        _error = null;
      });
    try {
      final endpoint = widget.docType == 'project'
          ? '/projects/${widget.docId}'
          : '/tasks/${widget.docId}';
      await _api.put(endpoint, {'description': _ctrl.text.trim()});
      if (mounted) context.pop();
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = FlutterFlowTheme.of(context);
    return Scaffold(
      backgroundColor: theme.primaryBackground,
      appBar: AppBar(
        backgroundColor: theme.secondaryBackground,
        title: Text('Edit Description', style: theme.titleMedium),
        leading: BackButton(onPressed: () => context.pop()),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            TextFormField(
              controller: _ctrl,
              maxLines: 12,
              decoration: InputDecoration(
                hintText: 'Enter description...',
                filled: true,
                fillColor: theme.secondaryBackground,
                border:
                    OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
            if (_error != null) ...[
              const SizedBox(height: 10),
              Text(_error!, style: TextStyle(color: theme.error)),
            ],
            const SizedBox(height: 20),
            FFButtonWidget(
              onPressed: _saving ? null : _save,
              text: 'Save',
              showLoadingIndicator: _saving,
              options: FFButtonOptions(
                color: theme.primary,
                height: 52,
                borderRadius: BorderRadius.circular(10),
                textStyle: const TextStyle(color: Colors.white, fontSize: 16),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
