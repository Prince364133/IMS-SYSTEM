import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:percent_indicator/percent_indicator.dart';

import '../../../../flutter_flow/flutter_flow_theme.dart';
import '../../../../shared/widgets/nav_wrapper.dart';
import '../../../../shared/widgets/glass_card.dart';
import '../../../auth/application/auth_provider.dart';
import '../../application/dashboard_provider.dart';

class HomePage extends ConsumerStatefulWidget {
  const HomePage({super.key});
  @override
  ConsumerState<HomePage> createState() => _HomePageState();
}

class _HomePageState extends ConsumerState<HomePage> {
  @override
  Widget build(BuildContext context) {
    final theme = FlutterFlowTheme.of(context);
    final dashboardState = ref.watch(dashboardProvider);
    final user = ref.watch(authProvider).currentUser;

    return NavWrapper(
      activeNav: 'home',
      child: Scaffold(
        extendBodyBehindAppBar: true,
        backgroundColor: Colors.black,
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
          child: dashboardState.isLoading
              ? const Center(
                  child: CircularProgressIndicator(color: Colors.white))
              : RefreshIndicator(
                  onRefresh: () =>
                      ref.read(dashboardProvider.notifier).loadDashboard(),
                  child: ListView(
                    padding: const EdgeInsets.fromLTRB(24, 60, 24, 24),
                    children: [
                      // ── Header ─────────────────────────────────────────
                      _buildHeader(theme, user),
                      const SizedBox(height: 24),

                      // ── KPI Stats Grid ─────────────────────────────────
                      _buildKPIGrid(theme, dashboardState),
                      const SizedBox(height: 24),

                      // ── Charts Section ──────────────────────────────────
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                              flex: 2,
                              child:
                                  _buildAttendanceDonut(theme, dashboardState)),
                          const SizedBox(width: 16),
                          Expanded(
                              flex: 3,
                              child: _buildProjectChart(theme, dashboardState)),
                        ],
                      ),
                      const SizedBox(height: 24),

                      // ── Recent Activity / Projects ─────────────────────
                      _buildSectionHeader(theme, 'Active Projects',
                          () => context.go('/projects')),
                      const SizedBox(height: 12),
                      ...dashboardState.recentProjects
                          .map((p) => _buildProjectCard(theme, p)),

                      const SizedBox(height: 24),
                      // ── Tasks Section ──────────────────────────────────
                      _buildSectionHeader(
                          theme, 'Pending Tasks', () => context.go('/tasks')),
                      const SizedBox(height: 12),
                      ...dashboardState.pendingTasks
                          .map((t) => _buildTaskCard(theme, t)),
                      const SizedBox(height: 80), // Padding for FAB
                    ],
                  ),
                ),
        ),
        floatingActionButton: FloatingActionButton.extended(
          backgroundColor: theme.primary,
          onPressed: () => context.go('/projects/new'),
          icon: const Icon(Icons.add_rounded, color: Colors.white),
          label: const Text('New Project',
              style:
                  TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        ),
      ),
    );
  }

  Widget _buildHeader(FlutterFlowTheme theme, dynamic user) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Welcome back,',
                style: theme.labelMedium.copyWith(color: Colors.white70)),
            Text(user?.name ?? 'User',
                style: theme.headlineMedium.copyWith(
                    color: Colors.white, fontWeight: FontWeight.bold)),
          ],
        ),
        CircleAvatar(
          radius: 26,
          backgroundColor: Colors.white.withValues(alpha: 0.1),
          child: CircleAvatar(
            radius: 24,
            backgroundImage: (user?.photoUrl.isNotEmpty == true)
                ? NetworkImage(user!.photoUrl)
                : null,
            backgroundColor: theme.primary,
            child: (user?.photoUrl.isEmpty != false)
                ? Text(
                    (user?.name.isNotEmpty == true)
                        ? user!.name[0].toUpperCase()
                        : 'U',
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold))
                : null,
          ),
        ),
      ],
    );
  }

  Widget _buildKPIGrid(FlutterFlowTheme theme, DashboardState state) {
    final hrms = state.stats['hrms'];
    final emps = hrms?['employees']?['total'] ?? 0;
    final projs = state.stats['projects'] ?? 0;
    final tasks = state.stats['tasks'] ?? 0;
    final att = hrms?['attendance']?['breakdown']?['present'] ?? 0;

    return GridView.count(
      physics: const NeverScrollableScrollPhysics(),
      shrinkWrap: true,
      crossAxisCount: 2,
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 1.6,
      children: [
        _kpiCard(
            theme, 'Team Size', '$emps', Icons.people_rounded, theme.primary),
        _kpiCard(theme, 'Projects', '$projs', Icons.account_tree_rounded,
            theme.secondary),
        _kpiCard(theme, 'Attended', '$att', Icons.how_to_reg_rounded,
            theme.tertiary),
        _kpiCard(theme, 'Open Tasks', '$tasks', Icons.task_alt_rounded,
            Colors.blueAccent),
      ],
    );
  }

  Widget _kpiCard(FlutterFlowTheme theme, String label, String value,
      IconData icon, Color color) {
    return GlassCard(
      padding: const EdgeInsets.all(12),
      opacity: 0.08,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(height: 8),
          Text(value,
              style:
                  theme.titleLarge.copyWith(color: Colors.white, fontSize: 22)),
          Text(label,
              style: theme.labelMedium
                  .copyWith(color: Colors.white60, fontSize: 11)),
        ],
      ),
    );
  }

  Widget _buildAttendanceDonut(FlutterFlowTheme theme, DashboardState state) {
    final hrms = state.stats['hrms'];
    final present = hrms?['attendance']?['breakdown']?['present'] ?? 0;
    final active = hrms?['employees']?['active'] ?? 1;
    final percent = (present / (active > 0 ? active : 1)).clamp(0.0, 1.0);

    return GlassCard(
      padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 12),
      child: CircularPercentIndicator(
        radius: 40.0,
        lineWidth: 8.0,
        percent: percent,
        center: Text("${(percent * 100).toInt()}%",
            style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 12)),
        footer: Padding(
          padding: const EdgeInsets.only(top: 8),
          child: Text("Attendance",
              style: theme.labelMedium.copyWith(color: Colors.white70)),
        ),
        circularStrokeCap: CircularStrokeCap.round,
        progressColor: theme.primary,
        backgroundColor: Colors.white.withValues(alpha: 0.1),
      ),
    );
  }

  Widget _buildProjectChart(FlutterFlowTheme theme, DashboardState state) {
    return GlassCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text("Completion",
              style: theme.labelMedium.copyWith(color: Colors.white70)),
          const SizedBox(height: 12),
          SizedBox(
            height: 80,
            child: BarChart(
              BarChartData(
                barGroups: [
                  BarChartGroupData(x: 0, barRods: [
                    BarChartRodData(
                        toY: 8,
                        color: theme.primary,
                        width: 12,
                        borderRadius: BorderRadius.circular(4))
                  ]),
                  BarChartGroupData(x: 1, barRods: [
                    BarChartRodData(
                        toY: 12,
                        color: theme.secondary,
                        width: 12,
                        borderRadius: BorderRadius.circular(4))
                  ]),
                  BarChartGroupData(x: 2, barRods: [
                    BarChartRodData(
                        toY: 5,
                        color: theme.tertiary,
                        width: 12,
                        borderRadius: BorderRadius.circular(4))
                  ]),
                  BarChartGroupData(x: 3, barRods: [
                    BarChartRodData(
                        toY: 10,
                        color: Colors.blue,
                        width: 12,
                        borderRadius: BorderRadius.circular(4))
                  ]),
                ],
                gridData: const FlGridData(show: false),
                titlesData: const FlTitlesData(show: false),
                borderData: FlBorderData(show: false),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(
      FlutterFlowTheme theme, String title, VoidCallback onSeeAll) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(title,
            style: theme.titleMedium
                .copyWith(color: Colors.white, fontWeight: FontWeight.bold)),
        TextButton(
          onPressed: onSeeAll,
          child: Text('See All',
              style:
                  TextStyle(color: theme.primary, fontWeight: FontWeight.w600)),
        ),
      ],
    );
  }

  Widget _buildProjectCard(FlutterFlowTheme theme, Map p) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      child: GlassCard(
        padding: const EdgeInsets.all(16),
        opacity: 0.05,
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                  color: theme.primary.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(12)),
              child: Icon(Icons.inventory_2_rounded, color: theme.primary),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(p['name'] ?? '',
                      style: theme.titleMedium.copyWith(color: Colors.white)),
                  Text(p['status'] ?? '',
                      style: theme.labelMedium.copyWith(color: Colors.white60)),
                ],
              ),
            ),
            const Icon(Icons.arrow_forward_ios_rounded,
                color: Colors.white24, size: 16),
          ],
        ),
      ),
    );
  }

  Widget _buildTaskCard(FlutterFlowTheme theme, Map t) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      child: GlassCard(
        padding: const EdgeInsets.all(12),
        opacity: 0.05,
        borderRadius: 12,
        child: Row(
          children: [
            Icon(Icons.radio_button_unchecked_rounded,
                color: theme.primary, size: 20),
            const SizedBox(width: 12),
            Expanded(
                child: Text(t['title'] ?? '',
                    style: theme.bodyMedium.copyWith(color: Colors.white))),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(6)),
              child: Text(t['priority'] ?? '',
                  style: TextStyle(
                      color: theme.primary,
                      fontSize: 11,
                      fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }
}
