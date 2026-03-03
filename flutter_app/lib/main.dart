import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'dart:ui';
// import 'package:flutter_gen/gen_l10n/app_localizations.dart'; // This will be available after generation

import 'core/di/service_locator.dart';
import 'flutter_flow/flutter_flow_theme.dart';

// ─── Page imports ────────────────────────────────────────────────────────────
import 'features/auth/presentation/pages/auth_guard.dart';
import 'features/auth/presentation/pages/login_page.dart';
import 'features/auth/presentation/pages/create_profile_page.dart';
import 'features/dashboard/presentation/pages/home_page.dart';
import 'features/projects/presentation/pages/project_list_page.dart';
import 'features/projects/presentation/pages/create_project_page.dart';
import 'features/projects/presentation/pages/project_detail_page.dart';
import 'features/tasks/presentation/pages/task_list_page.dart';
import 'features/tasks/presentation/pages/add_task_page.dart';
import 'shared/pages/add_description_page.dart';
import 'features/ams/presentation/pages/ams_page.dart';
import 'features/team/presentation/pages/team_member_page.dart';
import 'features/team/presentation/pages/employee_profile_page.dart';
import 'features/clients/presentation/pages/client_list_page.dart';
import 'features/clients/presentation/pages/client_profile_page.dart';
import 'features/team/presentation/pages/create_goals_page.dart';
import 'features/recruitment/presentation/pages/job_panel_page.dart';
import 'features/recruitment/presentation/pages/job_application_page.dart';
import 'features/chat/presentation/pages/chat_main_page.dart';
import 'features/chat/presentation/pages/chat_detail_page.dart';
import 'features/chat/presentation/pages/group_chat_page.dart';
import 'features/chat/presentation/pages/chat_invite_page.dart';
import 'features/webflow/presentation/pages/webflow_page.dart';
import 'features/hr/presentation/pages/hr_dashboard_page.dart';
import 'features/hr/presentation/pages/hr_employees_page.dart';
import 'features/hr/presentation/pages/hr_employee_detail_page.dart';
import 'features/auth/presentation/pages/pending_approval_page.dart';
import 'features/admin/presentation/pages/superadmin_dashboard_page.dart';

import 'package:hive_flutter/hive_flutter.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Hive.initFlutter();
  // Open common boxes
  await Hive.openBox('settings');
  await Hive.openBox('cache');

  await setupLocator();
  runApp(
    const ProviderScope(
      child: InstauraApp(),
    ),
  );
}

// ─── Router ──────────────────────────────────────────────────────────────────
final GoRouter _router = GoRouter(
  initialLocation: '/auth',
  routes: [
    GoRoute(path: '/auth', builder: (c, s) => const AuthGuardPage()),
    GoRoute(path: '/login', builder: (c, s) => const LoginPage()),
    GoRoute(
        path: '/create-profile', builder: (c, s) => const CreateProfilePage()),
    GoRoute(path: '/pending', builder: (c, s) => const PendingApprovalPage()),
    GoRoute(
        path: '/superadmin',
        builder: (c, s) =>
            const SuperAdminDashboardPage()), // kept for backwards compat
    GoRoute(
        path: '/admin/users',
        builder: (c, s) => const SuperAdminDashboardPage()),
    GoRoute(path: '/home', builder: (c, s) => const HomePage()),
    GoRoute(path: '/projects', builder: (c, s) => const ProjectListPage()),
    GoRoute(
        path: '/projects/new', builder: (c, s) => const CreateProjectPage()),
    GoRoute(
      path: '/projects/:id',
      builder: (c, s) => ProjectDetailPage(projectId: s.pathParameters['id']!),
    ),
    GoRoute(
      path: '/projects/:id/tasks',
      builder: (c, s) => TaskListPage(projectId: s.pathParameters['id']!),
    ),
    GoRoute(
      path: '/projects/:id/tasks/new',
      builder: (c, s) => AddTaskPage(projectId: s.pathParameters['id']!),
    ),
    GoRoute(
      path: '/add-description',
      builder: (c, s) => AddDescriptionPage(
        docId: s.uri.queryParameters['docId'] ?? '',
        docType: s.uri.queryParameters['docType'] ?? 'project',
      ),
    ),
    GoRoute(path: '/ams', builder: (c, s) => const AmsPageWidget()),
    GoRoute(path: '/hr', builder: (c, s) => const HrDashboardPage()),
    GoRoute(path: '/hr/employees', builder: (c, s) => const HrEmployeesPage()),
    GoRoute(
      path: '/hr/employees/:id',
      builder: (c, s) => HrEmployeeDetailPage(userId: s.pathParameters['id']!),
    ),
    GoRoute(path: '/team', builder: (c, s) => const TeamMemberPage()),
    GoRoute(
      path: '/team/:id',
      builder: (c, s) =>
          EmployeeProfilePage(employeeId: s.pathParameters['id']!),
    ),
    GoRoute(path: '/clients', builder: (c, s) => const ClientListPage()),
    GoRoute(
      path: '/clients/:id',
      builder: (c, s) => ClientProfilePage(clientId: s.pathParameters['id']!),
    ),
    GoRoute(
      path: '/goals/new',
      builder: (c, s) => CreateGoalsPage(
        employeeId: s.uri.queryParameters['employeeId'] ?? '',
      ),
    ),
    GoRoute(path: '/jobs', builder: (c, s) => const JobPanelPage()),
    GoRoute(
      path: '/jobs/:id/apply',
      builder: (c, s) => JobApplicationPage(jobId: s.pathParameters['id']!),
    ),
    GoRoute(path: '/chat', builder: (c, s) => const ChatMainPage()),
    GoRoute(
      path: '/chat/:chatId',
      builder: (c, s) => ChatDetailPage(chatId: s.pathParameters['chatId']!),
    ),
    GoRoute(
      path: '/chat/group/:groupId',
      builder: (c, s) => GroupChatPage(groupId: s.pathParameters['groupId']!),
    ),
    GoRoute(
      path: '/chat/group/:groupId/invite',
      builder: (c, s) => ChatInvitePage(groupId: s.pathParameters['groupId']!),
    ),
    GoRoute(path: '/webflow', builder: (c, s) => const WebflowPage()),
  ],
);

// ─── App Root ─────────────────────────────────────────────────────────────────
class InstauraApp extends StatelessWidget {
  const InstauraApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      debugShowCheckedModeBanner: false,
      title: 'Instaura IMS',
      theme: FlutterFlowTheme.lightTheme,
      darkTheme: FlutterFlowTheme.darkTheme,
      themeMode: ThemeMode.system,
      routerConfig: _router,
      localizationsDelegates: const [
        // AppLocalizations.delegate, // Uncomment after generation
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [
        Locale('en', ''),
      ],
    );
  }
}
