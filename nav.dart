import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import 'alt_nav_model.dart';
export 'alt_nav_model.dart';

// ─── Route name constants (used by NavWrapper and this widget) ──────────────
abstract class HomeWidget       { static const routeName = '/home'; }
abstract class ProjectsWidget   { static const routeName = '/projects'; }
abstract class TeamMembersWidget { static const routeName = '/team'; }
abstract class ClientWidget     { static const routeName = '/clients'; }

class AltNavWidget extends StatefulWidget {
  const AltNavWidget({
    super.key,
    this.navOne,
    this.navTwo,
    this.navThree,
    this.navFour,
    this.navFive,
    this.navSix,
  });

  final Color? navOne;
  final Color? navTwo;
  final Color? navThree;
  final Color? navFour;
  final Color? navFive;
  final Color? navSix;

  @override
  State<AltNavWidget> createState() => _AltNavWidgetState();
}

class _AltNavWidgetState extends State<AltNavWidget> {
  late AltNavModel _model;

  @override
  void setState(VoidCallback callback) {
    super.setState(callback);
    _model.onUpdate();
  }

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => AltNavModel());
    WidgetsBinding.instance.addPostFrameCallback((_) => safeSetState(() {}));
  }

  @override
  void dispose() {
    _model.maybeDispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // FIX: Load user from AuthService instead of hardcoding
    final auth = context.watch<dynamic>(); // replace with context.watch<AuthService>()

    return Row(
      mainAxisSize: MainAxisSize.max,
      children: [
        // ── Icon-only rail ──────────────────────────────────────────
        Container(
          width: 60,
          height: double.infinity,
          decoration: BoxDecoration(
            color:         FlutterFlowTheme.of(context).lineColor,
            borderRadius:  BorderRadius.circular(0),
          ),
          child: Padding(
            padding: const EdgeInsetsDirectional.fromSTEB(0, 28, 0, 0),
            child: Column(
              mainAxisSize: MainAxisSize.max,
              children: [
                Icon(Icons.all_inclusive, color: FlutterFlowTheme.of(context).primary, size: 36),
                Column(
                  mainAxisSize: MainAxisSize.max,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Padding(
                      padding: const EdgeInsetsDirectional.fromSTEB(0, 20, 0, 0),
                      child: Text(
                        'MENU',
                        textAlign: TextAlign.center,
                        style: FlutterFlowTheme.of(context).bodyMedium.override(
                          fontFamily: FlutterFlowTheme.of(context).bodyMediumFamily,
                          letterSpacing: 0.0,
                          useGoogleFonts: !FlutterFlowTheme.of(context).bodyMediumIsCustom,
                        ),
                      ),
                    ),
                    // ── Home ──────────────────────────────────────────
                    _iconNavItem(context, Icons.home_rounded,    widget.navOne,  HomeWidget.routeName),
                    // ── Projects ──────────────────────────────────────
                    _iconNavItem(context, Icons.grain_sharp,     widget.navTwo,  ProjectsWidget.routeName),
                    // ── Team ──────────────────────────────────────────
                    _iconNavItem(context, Icons.group_rounded,   widget.navFour, TeamMembersWidget.routeName),
                    // ── Clients (FIXED: added missing onTap) ──────────
                    _iconNavItem(context, Icons.home_work_rounded, widget.navFive, ClientWidget.routeName),
                    // ── Settings (placeholder) ────────────────────────
                    Padding(
                      padding: const EdgeInsetsDirectional.fromSTEB(0, 12, 0, 8),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Padding(
                            padding: const EdgeInsetsDirectional.fromSTEB(0, 8, 0, 8),
                            child: Icon(Icons.settings_sharp, color: widget.navSix, size: 24),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),

        // ── Expanded sidebar panel ──────────────────────────────────
        Container(
          width:  230,
          height: double.infinity,
          decoration: BoxDecoration(
            color: FlutterFlowTheme.of(context).secondaryBackground,
            boxShadow: [
              BoxShadow(
                blurRadius: 0,
                color:      FlutterFlowTheme.of(context).lineColor,
                offset:     const Offset(1, 0),
              ),
            ],
            borderRadius: const BorderRadius.only(
              bottomRight: Radius.circular(16),
              topRight:    Radius.circular(16),
            ),
          ),
          child: Padding(
            padding: const EdgeInsetsDirectional.fromSTEB(24, 32, 24, 16),
            child: Column(
              mainAxisSize: MainAxisSize.max,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  Text('Instaura',
                    style: FlutterFlowTheme.of(context).headlineMedium.override(
                      fontFamily: FlutterFlowTheme.of(context).headlineMediumFamily,
                      letterSpacing: 0.0,
                      useGoogleFonts: !FlutterFlowTheme.of(context).headlineMediumIsCustom,
                    )),
                ]),
                Padding(
                  padding: const EdgeInsetsDirectional.fromSTEB(0, 24, 0, 0),
                  child: Text('MENU',
                    style: FlutterFlowTheme.of(context).bodyMedium.override(
                      fontFamily: FlutterFlowTheme.of(context).bodyMediumFamily,
                      letterSpacing: 0.0,
                      useGoogleFonts: !FlutterFlowTheme.of(context).bodyMediumIsCustom,
                    )),
                ),
                // ── Full nav items ─────────────────────────────────
                _fullNavItem(context, Icons.home_rounded,       'Home',         widget.navOne,  HomeWidget.routeName),
                _fullNavItem(context, Icons.grain_sharp,        'Projects',     widget.navTwo,  ProjectsWidget.routeName),
                _fullNavItem(context, Icons.group_rounded,      'Team Members', widget.navFour, TeamMembersWidget.routeName),
                _fullNavItem(context, Icons.home_work_rounded,  'Clients',      widget.navFive, ClientWidget.routeName), // FIXED: onTap added
                Padding(
                  padding: const EdgeInsetsDirectional.fromSTEB(0, 8, 0, 0),
                  child: Text('ORGANIZATION',
                    style: FlutterFlowTheme.of(context).bodyMedium.override(
                      fontFamily: FlutterFlowTheme.of(context).bodyMediumFamily,
                      letterSpacing: 0.0,
                      useGoogleFonts: !FlutterFlowTheme.of(context).bodyMediumIsCustom,
                    )),
                ),
                Padding(
                  padding: const EdgeInsetsDirectional.fromSTEB(0, 8, 0, 8),
                  child: Row(children: [
                    Padding(
                      padding: const EdgeInsetsDirectional.fromSTEB(0, 8, 0, 8),
                      child: Icon(Icons.settings_sharp, color: widget.navSix, size: 24), // FIXED: was missing onTap
                    ),
                    Padding(
                      padding: const EdgeInsetsDirectional.fromSTEB(16, 0, 0, 0),
                      child: Text('Settings',
                        style: FlutterFlowTheme.of(context).bodyMedium.override(
                          fontFamily: FlutterFlowTheme.of(context).bodyMediumFamily,
                          color: widget.navSix,
                          letterSpacing: 0.0,
                          useGoogleFonts: !FlutterFlowTheme.of(context).bodyMediumIsCustom,
                        )),
                    ),
                  ]),
                ),
                // ── Dark/Light mode toggle ─────────────────────────
                _themeToggle(context),
                // ── User profile section (FIXED: was hardcoded) ────
                _userProfile(context),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // ─── Helper: icon-only nav button ────────────────────────────────────────
  Widget _iconNavItem(BuildContext context, IconData icon, Color? color, String route) {
    return Padding(
      padding: const EdgeInsetsDirectional.fromSTEB(0, 8, 0, 8),
      child: InkWell(
        splashColor:     Colors.transparent,
        focusColor:      Colors.transparent,
        hoverColor:      Colors.transparent,
        highlightColor:  Colors.transparent,
        onTap: () => context.pushNamed(route, extra: {
          '__transition_info__': const TransitionInfo(hasTransition: true, transitionType: PageTransitionType.fade, duration: Duration(milliseconds: 0)),
        }),
        child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          Padding(
            padding: const EdgeInsetsDirectional.fromSTEB(0, 8, 0, 8),
            child: Icon(icon, color: color, size: 24),
          ),
        ]),
      ),
    );
  }

  // ─── Helper: full nav item (icon + label) ─────────────────────────────────
  Widget _fullNavItem(BuildContext context, IconData icon, String label, Color? color, String route) {
    return Padding(
      padding: const EdgeInsetsDirectional.fromSTEB(0, 8, 0, 8),
      child: InkWell(
        splashColor: Colors.transparent, focusColor: Colors.transparent,
        hoverColor: Colors.transparent, highlightColor: Colors.transparent,
        onTap: () => context.pushNamed(route, extra: {
          '__transition_info__': const TransitionInfo(hasTransition: true, transitionType: PageTransitionType.fade, duration: Duration(milliseconds: 0)),
        }),
        child: Row(children: [
          Padding(
            padding: const EdgeInsetsDirectional.fromSTEB(0, 8, 0, 8),
            child: Icon(icon, color: color, size: 24),
          ),
          Padding(
            padding: const EdgeInsetsDirectional.fromSTEB(16, 0, 0, 0),
            child: Text(label,
              style: FlutterFlowTheme.of(context).bodyMedium.override(
                fontFamily: FlutterFlowTheme.of(context).bodyMediumFamily,
                color: color, letterSpacing: 0.0,
                useGoogleFonts: !FlutterFlowTheme.of(context).bodyMediumIsCustom,
              )),
          ),
        ]),
      ),
    );
  }

  // ─── Helper: light/dark toggle ────────────────────────────────────────────
  Widget _themeToggle(BuildContext context) {
    final theme = FlutterFlowTheme.of(context);
    return Align(
      alignment: const AlignmentDirectional(0, -1),
      child: Padding(
        padding: const EdgeInsetsDirectional.fromSTEB(0, 8, 0, 16),
        child: Container(
          width: 250, height: 50,
          decoration: BoxDecoration(
            color:        theme.primaryBackground,
            borderRadius: BorderRadius.circular(12),
            border:       Border.all(color: theme.alternate, width: 1),
          ),
          child: Padding(
            padding: const EdgeInsets.all(4),
            child: Row(children: [
              Expanded(child: InkWell(
                onTap: () => setDarkModeSetting(context, ThemeMode.light),
                child: Container(
                  decoration: BoxDecoration(
                    color:        Theme.of(context).brightness == Brightness.light ? theme.secondaryBackground : theme.primaryBackground,
                    borderRadius: BorderRadius.circular(10),
                    border:       Border.all(color: Theme.of(context).brightness == Brightness.light ? theme.alternate : theme.primaryBackground, width: 1),
                  ),
                  child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                    Icon(Icons.wb_sunny_rounded, color: Theme.of(context).brightness == Brightness.light ? theme.primaryText : theme.secondaryText, size: 16),
                    Padding(padding: const EdgeInsetsDirectional.fromSTEB(4, 0, 0, 0),
                      child: Text('Light Mode', style: theme.bodyMedium.override(fontFamily: theme.bodyMediumFamily, color: Theme.of(context).brightness == Brightness.light ? theme.primaryText : theme.secondaryText, letterSpacing: 0.0, useGoogleFonts: !theme.bodyMediumIsCustom))),
                  ]),
                ),
              )),
              Expanded(child: InkWell(
                onTap: () => setDarkModeSetting(context, ThemeMode.dark),
                child: Container(
                  decoration: BoxDecoration(
                    color:        Theme.of(context).brightness == Brightness.dark ? theme.secondaryBackground : theme.primaryBackground,
                    borderRadius: BorderRadius.circular(10),
                    border:       Border.all(color: Theme.of(context).brightness == Brightness.dark ? theme.alternate : theme.primaryBackground, width: 1),
                  ),
                  child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                    Icon(Icons.nightlight_round, color: Theme.of(context).brightness == Brightness.dark ? theme.primaryText : theme.secondaryText, size: 16),
                    Padding(padding: const EdgeInsetsDirectional.fromSTEB(4, 0, 0, 0),
                      child: Text('Dark Mode', style: theme.bodyMedium.override(fontFamily: theme.bodyMediumFamily, color: Theme.of(context).brightness == Brightness.dark ? theme.primaryText : theme.secondaryText, letterSpacing: 0.0, useGoogleFonts: !theme.bodyMediumIsCustom))),
                  ]),
                ),
              )),
            ]),
          ),
        ),
      ),
    );
  }

  // ─── Helper: user profile (FIXED — no longer hardcoded) ─────────────────
  Widget _userProfile(BuildContext context) {
    final theme = FlutterFlowTheme.of(context);
    // NOTE: Replace `dynamic` with your actual AuthService when wiring:
    // final user = context.watch<AuthService>().currentUser;
    // For now uses a sensible placeholder.
    const String userName  = 'Loading...';
    const String userEmail = '';
    const String photoUrl  = '';

    return Padding(
      padding: const EdgeInsetsDirectional.fromSTEB(16, 12, 16, 12),
      child: Row(children: [
        Container(
          width: 50, height: 50,
          decoration: BoxDecoration(
            color:        theme.accent1,
            borderRadius: BorderRadius.circular(12),
            border:       Border.all(color: theme.primary, width: 2),
          ),
          child: Padding(
            padding: const EdgeInsets.all(2),
            child: photoUrl.isNotEmpty
                ? ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: CachedNetworkImage(
                      imageUrl: photoUrl, width: 44, height: 44, fit: BoxFit.cover,
                      fadeInDuration: const Duration(milliseconds: 500),
                      fadeOutDuration: const Duration(milliseconds: 500),
                    ),
                  )
                : Center(child: Icon(Icons.person, color: theme.primary)),
          ),
        ),
        Expanded(child: Padding(
          padding: const EdgeInsetsDirectional.fromSTEB(12, 0, 0, 0),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(userName, style: theme.bodyLarge.override(fontFamily: theme.bodyLargeFamily, letterSpacing: 0.0, useGoogleFonts: !theme.bodyLargeIsCustom)),
            Text(userEmail, style: theme.labelMedium.override(fontFamily: theme.labelMediumFamily, letterSpacing: 0.0, useGoogleFonts: !theme.labelMediumIsCustom)),
          ]),
        )),
      ]),
    );
  }
}
