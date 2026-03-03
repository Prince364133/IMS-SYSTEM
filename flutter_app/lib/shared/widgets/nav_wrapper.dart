import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/auth/application/auth_provider.dart';
import '../../flutter_flow/flutter_flow_theme.dart';
import 'responsive_layout.dart';

/// Wraps any page in the sidebar navigation layout.
/// [activeNav] determines which nav item is highlighted.
class NavWrapper extends ConsumerWidget {
  final Widget child;
  final String activeNav;

  const NavWrapper({
    super.key,
    required this.child,
    required this.activeNav,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ResponsiveLayout(
      mobile: Scaffold(
        drawer: Drawer(child: _Sidebar(activeNav: activeNav, ref: ref)),
        appBar: AppBar(
          title: Text(activeNav.toUpperCase()),
          backgroundColor: FlutterFlowTheme.of(context).secondaryBackground,
        ),
        body: child,
      ),
      desktop: Row(
        children: [
          Material(child: _Sidebar(activeNav: activeNav, ref: ref)),
          Expanded(child: child),
        ],
      ),
    );
  }
}

class _Sidebar extends StatelessWidget {
  final String activeNav;
  final WidgetRef ref;
  const _Sidebar({required this.activeNav, required this.ref});

  @override
  Widget build(BuildContext context) {
    final theme = FlutterFlowTheme.of(context);
    final authState = ref.watch(authProvider);
    final user = authState.currentUser;

    Color navColor(String key) =>
        activeNav == key ? theme.primary : theme.secondaryText;

    return Container(
      width: 220,
      decoration: BoxDecoration(
        color: theme.secondaryBackground,
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 4)
        ],
      ),
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Brand ──────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
              child: Row(children: [
                Image.asset('assets/images/logo.png',
                    width: 28, height: 28, fit: BoxFit.contain),
                const SizedBox(width: 8),
                Text('Instaura', style: theme.headlineSmall),
              ]),
            ),
            const SizedBox(height: 28),

            // ── Nav items ───────────────────────────────────────────
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                children: [
                  _NavItem(
                      label: 'Home',
                      icon: Icons.home_rounded,
                      route: '/home',
                      color: navColor('home'),
                      active: activeNav == 'home'),
                  _NavItem(
                      label: 'Projects',
                      icon: Icons.grain_sharp,
                      route: '/projects',
                      color: navColor('projects'),
                      active: activeNav == 'projects'),
                  _NavItem(
                      label: 'Team',
                      icon: Icons.group_rounded,
                      route: '/team',
                      color: navColor('team'),
                      active: activeNav == 'team'),
                  _NavItem(
                      label: 'Clients',
                      icon: Icons.home_work_rounded,
                      route: '/clients',
                      color: navColor('clients'),
                      active: activeNav == 'clients'),
                  _NavItem(
                      label: 'Chat',
                      icon: Icons.chat_bubble_outline,
                      route: '/chat',
                      color: navColor('chat'),
                      active: activeNav == 'chat'),
                  _NavItem(
                      label: 'AMS',
                      icon: Icons.access_time,
                      route: '/ams',
                      color: navColor('ams'),
                      active: activeNav == 'ams'),
                  _NavItem(
                      label: 'Jobs',
                      icon: Icons.work_outline,
                      route: '/jobs',
                      color: navColor('jobs'),
                      active: activeNav == 'jobs'),
                  _NavItem(
                      label: 'HR',
                      icon: Icons.people_alt_outlined,
                      route: '/hr',
                      color: navColor('hr'),
                      active: activeNav == 'hr'),
                  // Admin-only: User Management
                  if (user?.role == 'admin' || user?.role == 'superadmin')
                    _NavItem(
                        label: 'Users',
                        icon: Icons.manage_accounts,
                        route: '/admin/users',
                        color: navColor('users'),
                        active: activeNav == 'users'),
                ],
              ),
            ),

            // ── User info + logout ──────────────────────────────────
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(children: [
                const Divider(),
                const SizedBox(height: 8),
                Row(children: [
                  CircleAvatar(
                    radius: 20,
                    backgroundColor: theme.primary,
                    backgroundImage: (user?.photoUrl.isNotEmpty == true)
                        ? NetworkImage(user!.photoUrl)
                        : null,
                    child: (user?.photoUrl.isEmpty != false)
                        ? Text(
                            user?.name.isNotEmpty == true
                                ? user!.name[0].toUpperCase()
                                : 'U',
                            style: const TextStyle(
                                color: Colors.white, fontSize: 14))
                        : null,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                      child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                        Text(user?.name ?? '',
                            style: theme.bodyMedium
                                .copyWith(fontWeight: FontWeight.w600),
                            overflow: TextOverflow.ellipsis),
                        Text(user?.email ?? '',
                            style: theme.labelMedium,
                            overflow: TextOverflow.ellipsis),
                      ])),
                  IconButton(
                    icon: Icon(Icons.logout,
                        color: theme.secondaryText, size: 20),
                    onPressed: () {
                      ref.read(authProvider.notifier).logout();
                      context.go('/login');
                    },
                  ),
                ]),
              ]),
            ),
          ],
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  final String label;
  final IconData icon;
  final String route;
  final Color color;
  final bool active;

  const _NavItem({
    required this.label,
    required this.icon,
    required this.route,
    required this.color,
    required this.active,
  });

  @override
  Widget build(BuildContext context) {
    final theme = FlutterFlowTheme.of(context);
    return Semantics(
      label: 'Navigate to $label',
      button: true,
      child: Container(
        margin: const EdgeInsets.only(bottom: 4),
        decoration: BoxDecoration(
          color: active
              ? theme.primary.withValues(alpha: 0.1)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
        ),
        child: ListTile(
          dense: true,
          onTap: () {
            if (ResponsiveLayout.isMobile(context)) {
              Navigator.pop(context); // Close drawer
            }
            context.go(route);
          },
          leading: Icon(icon, color: color, size: 22),
          title: Text(label,
              style: theme.bodyMedium.copyWith(
                  color: color,
                  fontWeight: active ? FontWeight.w600 : FontWeight.w400)),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      ),
    );
  }
}
