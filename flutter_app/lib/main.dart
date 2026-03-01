import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'services/auth_service.dart';
import 'flutter_flow/flutter_flow_theme.dart';

// ─── Page imports ────────────────────────────────────────────────────────────
import 'pages/auth/auth_guard.dart';
import 'pages/auth/login_page.dart';
import 'pages/auth/create_profile_page.dart';
import 'pages/home/home_page.dart';
import 'pages/projects/project_list_page.dart';
import 'pages/projects/create_project_page.dart';
import 'pages/projects/project_detail_page.dart';
import 'pages/projects/task_list_page.dart';
import 'pages/projects/add_task_page.dart';
import 'pages/projects/add_description_page.dart';
import 'pages/ams/ams_page.dart';
import 'pages/people/team_member_page.dart';
import 'pages/people/employee_profile_page.dart';
import 'pages/people/client_list_page.dart';
import 'pages/people/client_profile_page.dart';
import 'pages/people/create_goals_page.dart';
import 'pages/people/job_panel_page.dart';
import 'pages/people/job_application_page.dart';
import 'pages/chat/chat_main_page.dart';
import 'pages/chat/chat_detail_page.dart';
import 'pages/chat/group_chat_page.dart';
import 'pages/chat/chat_invite_page.dart';
import 'pages/webflow/webflow_page.dart';
import 'pages/hr/hr_dashboard_page.dart';
import 'pages/hr/hr_employees_page.dart';
import 'pages/hr/hr_employee_detail_page.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final prefs = await SharedPreferences.getInstance();
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthService(prefs)),
        // Add more providers here as needed
      ],
      child: const InstauraApp(),
    ),
  );
}

// ─── Router ──────────────────────────────────────────────────────────────────
final GoRouter _router = GoRouter(
  initialLocation: '/auth',
  routes: [
    GoRoute(path: '/auth',         builder: (c, s) => const AuthGuardPage()),
    GoRoute(path: '/login',        builder: (c, s) => const LoginPage()),
    GoRoute(path: '/create-profile', builder: (c, s) => const CreateProfilePage()),
    GoRoute(path: '/home',         builder: (c, s) => const HomePage()),
    GoRoute(path: '/projects',     builder: (c, s) => const ProjectListPage()),
    GoRoute(path: '/projects/new', builder: (c, s) => const CreateProjectPage()),
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
        docId:   s.uri.queryParameters['docId']   ?? '',
        docType: s.uri.queryParameters['docType'] ?? 'project',
      ),
    ),
    GoRoute(path: '/ams',          builder: (c, s) => const AmsPageWidget()),
    GoRoute(path: '/hr',           builder: (c, s) => const HrDashboardPage()),
    GoRoute(path: '/hr/employees', builder: (c, s) => const HrEmployeesPage()),
    GoRoute(
      path: '/hr/employees/:id',
      builder: (c, s) => HrEmployeeDetailPage(userId: s.pathParameters['id']!),
    ),
    GoRoute(path: '/team',         builder: (c, s) => const TeamMemberPage()),
    GoRoute(
      path: '/team/:id',
      builder: (c, s) => EmployeeProfilePage(employeeId: s.pathParameters['id']!),
    ),
    GoRoute(path: '/clients',      builder: (c, s) => const ClientListPage()),
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
    GoRoute(path: '/jobs',         builder: (c, s) => const JobPanelPage()),
    GoRoute(
      path: '/jobs/:id/apply',
      builder: (c, s) => JobApplicationPage(jobId: s.pathParameters['id']!),
    ),
    GoRoute(path: '/chat',         builder: (c, s) => const ChatMainPage()),
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
    GoRoute(path: '/webflow',      builder: (c, s) => const WebflowPage()),
  ],
);

// ─── App Root ─────────────────────────────────────────────────────────────────
class InstauraApp extends StatelessWidget {
  const InstauraApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title:            'Instaura IMS',
      debugShowCheckedModeBanner: false,
      theme:            FlutterFlowTheme.lightTheme,
      darkTheme:        FlutterFlowTheme.darkTheme,
      themeMode:        ThemeMode.system,
      routerConfig:     _router,
    );
  }
}
