import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class FlutterFlowTheme {
  // ─── Singleton current theme instance ──────────────────────────────────
  static FlutterFlowTheme of(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark
          ? _dark
          : _light;

  static final FlutterFlowTheme _light = FlutterFlowTheme._();
  static final FlutterFlowTheme _dark  = FlutterFlowTheme._(isDark: true);

  final bool isDark;
  FlutterFlowTheme._({this.isDark = false});

  // ─── Brand Colors ───────────────────────────────────────────────────────
  Color get primary             => const Color(0xFFCF1D29);
  Color get secondary           => const Color(0xFF39D2C0);
  Color get tertiary            => const Color(0xFFEE8B60);
  Color get error               => const Color(0xFFFF5963);
  Color get alternate           => isDark ? const Color(0xFF262D34) : const Color(0xFFE0E3E7);
  Color get accent1             => const Color(0xFFCF1D29).withValues(alpha: 0.15);
  Color get accent2             => const Color(0xFF39D2C0).withValues(alpha: 0.15);
  Color get accent3             => const Color(0xFFEE8B60).withValues(alpha: 0.15);
  Color get accent4             => isDark ? const Color(0x89FFFFFF) : const Color(0x89000000);

  // ─── Background & Surface ──────────────────────────────────────────────
  Color get primaryBackground   => isDark ? const Color(0xFF1D2428) : const Color(0xFFF1F4F8);
  Color get secondaryBackground => isDark ? const Color(0xFF14181B) : const Color(0xFFFFFFFF);
  Color get lineColor           => isDark ? const Color(0xFF262D34) : const Color(0xFFE0E3E7);

  // ─── Text Colors ───────────────────────────────────────────────────────
  Color get primaryText         => isDark ? const Color(0xFFFFFFFF) : const Color(0xFF14181B);
  Color get secondaryText       => isDark ? const Color(0xFF8B97A2) : const Color(0xFF57636C);

  // ─── Text Styles ───────────────────────────────────────────────────────
  String get bodyLargeFamily    => 'Inter';
  String get bodyMediumFamily   => 'Inter';
  String get labelMediumFamily  => 'Inter';
  String get headlineMediumFamily => 'Inter';
  String get headlineSmallFamily  => 'Inter';
  String get titleLargeFamily     => 'Inter';
  String get titleMediumFamily    => 'Inter';

  bool get bodyLargeIsCustom      => false;
  bool get bodyMediumIsCustom     => false;
  bool get labelMediumIsCustom    => false;
  bool get headlineMediumIsCustom => false;
  bool get headlineSmallIsCustom  => false;
  bool get titleLargeIsCustom     => false;
  bool get titleMediumIsCustom    => false;

  TextStyle get bodyLarge => GoogleFonts.inter(
    fontSize: 16, fontWeight: FontWeight.w400, color: primaryText);

  TextStyle get bodyMedium => GoogleFonts.inter(
    fontSize: 14, fontWeight: FontWeight.w400, color: primaryText);

  TextStyle get labelMedium => GoogleFonts.inter(
    fontSize: 12, fontWeight: FontWeight.w500, color: secondaryText);

  TextStyle get headlineMedium => GoogleFonts.inter(
    fontSize: 24, fontWeight: FontWeight.w600, color: primaryText);

  TextStyle get headlineSmall => GoogleFonts.inter(
    fontSize: 20, fontWeight: FontWeight.w600, color: primaryText);

  TextStyle get titleLarge => GoogleFonts.inter(
    fontSize: 22, fontWeight: FontWeight.w700, color: primaryText);

  TextStyle get titleMedium => GoogleFonts.inter(
    fontSize: 16, fontWeight: FontWeight.w600, color: primaryText);

  // ─── Material ThemeData ────────────────────────────────────────────────
  static ThemeData get lightTheme => ThemeData(
    useMaterial3: true,
    brightness:   Brightness.light,
    colorScheme:  ColorScheme.fromSeed(
      seedColor: const Color(0xFFCF1D29),
      brightness: Brightness.light,
    ),
    scaffoldBackgroundColor: const Color(0xFFF1F4F8),
    textTheme: GoogleFonts.interTextTheme(),
    appBarTheme: const AppBarTheme(
      backgroundColor: Color(0xFFFFFFFF),
      foregroundColor: Color(0xFF14181B),
      elevation:       0,
    ),
  );

  static ThemeData get darkTheme => ThemeData(
    useMaterial3: true,
    brightness:   Brightness.dark,
    colorScheme:  ColorScheme.fromSeed(
      seedColor: const Color(0xFFCF1D29),
      brightness: Brightness.dark,
    ),
    scaffoldBackgroundColor: const Color(0xFF1D2428),
    textTheme: GoogleFonts.interTextTheme(ThemeData.dark().textTheme),
    appBarTheme: const AppBarTheme(
      backgroundColor: Color(0xFF14181B),
      foregroundColor: Color(0xFFFFFFFF),
      elevation:       0,
    ),
  );
}
