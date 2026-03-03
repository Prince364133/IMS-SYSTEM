import 'package:flutter/material.dart';
import 'package:lottie/lottie.dart';

class SuccessLottie extends StatelessWidget {
  final String message;
  final VoidCallback? onComplete;

  const SuccessLottie({
    super.key,
    required this.message,
    this.onComplete,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Lottie.network(
          'https://assets9.lottiefiles.com/packages/lf20_fbawu8ol.json', // Premium Checkmark
          width: 150,
          height: 150,
          repeat: false,
          onLoaded: (composition) {
            Future.delayed(composition.duration, () {
              onComplete?.call();
            });
          },
        ),
        const SizedBox(height: 16),
        Text(
          message,
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }
}
