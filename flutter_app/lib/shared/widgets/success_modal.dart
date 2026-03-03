import 'package:flutter/material.dart';
import 'success_lottie.dart';

void showSuccessModal(BuildContext context,
    {required String message, VoidCallback? onComplete}) {
  showDialog(
    context: context,
    barrierDismissible: false,
    builder: (context) => Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: SuccessLottie(
          message: message,
          onComplete: () {
            Navigator.pop(context);
            onComplete?.call();
          },
        ),
      ),
    ),
  );
}
