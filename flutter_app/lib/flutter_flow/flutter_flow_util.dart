import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

// ─── Navigation helpers (mirrors FlutterFlow's context.pushNamed pattern) ───
extension FFNavExtension on BuildContext {
  void pushNamed(String routeName, {Map<String, dynamic> extra = const {}}) {
    go(routeName);
  }
}

// ─── Theme mode ─────────────────────────────────────────────────────────────
void setDarkModeSetting(BuildContext context, ThemeMode mode) {
  // In a real app wire this to a ThemeNotifier provider.
  // Here it's a stub to keep compatibility with FlutterFlow-generated code.
}

// ─── Transition types (stubs for FlutterFlow compatibility) ─────────────────
enum PageTransitionType { fade, rightToLeft, leftToRight, scale, none }

class TransitionInfo {
  final bool               hasTransition;
  final PageTransitionType transitionType;
  final Duration           duration;

  const TransitionInfo({
    this.hasTransition  = false,
    this.transitionType = PageTransitionType.fade,
    this.duration       = const Duration(milliseconds: 300),
  });
}

// ─── Model lifecycle helpers ─────────────────────────────────────────────────
abstract class FlutterFlowModel<W extends StatefulWidget> {
  late W widget;

  /// Called from initState — override to initialise fields.
  void initState(BuildContext context) {}

  /// Called from setState — override if the model needs to react.
  void onUpdate() {}

  /// Called from dispose — override to clean up controllers, listeners, etc.
  void dispose() {}

  /// Convenience: mark as maybe-disposed without crashing.
  void maybeDispose() {
    try {
      dispose();
    } catch (_) {}
  }
}

T createModel<T extends FlutterFlowModel>(BuildContext context, T Function() creator) {
  return creator()..initState(context);
}

// ─── safeSetState ─────────────────────────────────────────────────────────────
void safeSetState(VoidCallback fn) {
  fn();
}

// ─── valueOrDefault ──────────────────────────────────────────────────────────
T valueOrDefault<T>(T? value, T defaultValue) {
  return (value == null || (value is String && value.isEmpty)) ? defaultValue : value;
}
