import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import 'attandance_management_system_model.dart';
export 'attandance_management_system_model.dart';

class AttandanceManagementSystemWidget extends StatefulWidget {
  const AttandanceManagementSystemWidget({super.key});

  static String routeName = 'Attandance_management_system';
  static String routePath = 'attandanceManagementSystem';

  @override
  State<AttandanceManagementSystemWidget> createState() =>
      _AttandanceManagementSystemWidgetState();
}

class _AttandanceManagementSystemWidgetState
    extends State<AttandanceManagementSystemWidget> {
  late AttandanceManagementSystemModel _model;

  final scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => AttandanceManagementSystemModel());

    WidgetsBinding.instance.addPostFrameCallback((_) => safeSetState(() {}));
  }

  @override
  void dispose() {
    _model.dispose();

    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        FocusScope.of(context).unfocus();
        FocusManager.instance.primaryFocus?.unfocus();
      },
      child: Scaffold(
        key: scaffoldKey,
        backgroundColor: FlutterFlowTheme.of(context).primaryBackground,
        body: SafeArea(
          top: true,
          child: Column(
            mainAxisSize: MainAxisSize.max,
            children: [
              Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  color: FlutterFlowTheme.of(context).secondaryBackground,
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.max,
                  children: [],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
