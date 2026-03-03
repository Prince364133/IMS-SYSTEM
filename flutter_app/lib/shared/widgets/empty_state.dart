import 'package:flutter/material.dart';
import 'package:lottie/lottie.dart';
import '../../../flutter_flow/flutter_flow_theme.dart';

class LottieEmptyState extends StatelessWidget {
  final String message;
  final String? animationUrl;
  final String? animationAsset;
  final double width;
  final double height;
  final VoidCallback? onAction;
  final String? actionLabel;

  const LottieEmptyState({
    super.key,
    required this.message,
    this.animationUrl,
    this.animationAsset,
    this.width = 250,
    this.height = 250,
    this.onAction,
    this.actionLabel,
  });

  @override
  Widget build(BuildContext context) {
    final theme = FlutterFlowTheme.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (animationAsset != null)
              Lottie.asset(
                animationAsset!,
                width: width,
                height: height,
                fit: BoxFit.contain,
              )
            else if (animationUrl != null)
              Lottie.network(
                animationUrl!,
                width: width,
                height: height,
                fit: BoxFit.contain,
                errorBuilder: (context, error, stackTrace) => Icon(
                  Icons.hourglass_empty,
                  size: 80,
                  color: theme.alternate,
                ),
              )
            else
              Icon(
                Icons.hourglass_empty,
                size: 80,
                color: theme.alternate,
              ),
            const SizedBox(height: 24),
            Text(
              message,
              textAlign: TextAlign.center,
              style: theme.bodyMedium.copyWith(
                color: theme.secondaryText,
                fontSize: 16,
              ),
            ),
            if (onAction != null && actionLabel != null) ...[
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: onAction,
                style: ElevatedButton.styleFrom(
                  backgroundColor: theme.primary,
                  foregroundColor: Colors.white,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: Text(actionLabel!),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
