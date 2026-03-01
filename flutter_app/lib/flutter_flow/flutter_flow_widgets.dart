import 'package:flutter/material.dart';
import '../flutter_flow/flutter_flow_theme.dart';

// ─── Primary Button ——————————————————————————————————————————————————————————
class FFButtonWidget extends StatelessWidget {
  const FFButtonWidget({
    super.key,
    required this.onPressed,
    required this.text,
    this.options = const FFButtonOptions(),
    this.showLoadingIndicator = false,
  });

  final VoidCallback?  onPressed;
  final String         text;
  final FFButtonOptions options;
  final bool           showLoadingIndicator;

  @override
  Widget build(BuildContext context) {
    final theme = FlutterFlowTheme.of(context);
    return SizedBox(
      width:  options.width  ?? double.infinity,
      height: options.height ?? 52,
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: options.color             ?? theme.primary,
          foregroundColor: options.textStyle?.color  ?? Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: options.borderRadius ?? BorderRadius.circular(8),
          ),
          elevation: options.elevation ?? 2,
        ),
        child: showLoadingIndicator
            ? const SizedBox(
                width: 20, height: 20,
                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
              )
            : Text(text, style: options.textStyle),
      ),
    );
  }
}

class FFButtonOptions {
  final double?        width;
  final double?        height;
  final Color?         color;
  final TextStyle?     textStyle;
  final BorderRadius?  borderRadius;
  final double?        elevation;

  const FFButtonOptions({
    this.width,
    this.height,
    this.color,
    this.textStyle,
    this.borderRadius,
    this.elevation,
  });
}
