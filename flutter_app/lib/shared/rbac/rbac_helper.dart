/// Shared Role-Based Access Control helpers
/// Usage: RbacHelper.canManageProjects(role)
class RbacHelper {
  static bool isAdmin(String? role) => role == 'admin';
  static bool isHR(String? role) => role == 'hr';
  static bool isManager(String? role) => role == 'manager';
  static bool isEmployee(String? role) => role == 'employee';

  /// Admin-only: full system control
  static bool canAccessAdmin(String? role) => isAdmin(role);

  /// Admin + HR: manage employees, attendance, jobs
  static bool canManageHR(String? role) => isAdmin(role) || isHR(role);

  /// Admin + Manager: create/edit projects and tasks
  static bool canManageProjects(String? role) =>
      isAdmin(role) || isManager(role);

  /// Admin + HR + Manager: can view and act on team members
  static bool canManageTeam(String? role) =>
      isAdmin(role) || isHR(role) || isManager(role);

  /// Admin + HR: post and manage job listings
  static bool canManageJobs(String? role) => isAdmin(role) || isHR(role);

  /// Admin + Manager: can create/edit clients
  static bool canManageClients(String? role) =>
      isAdmin(role) || isManager(role);

  /// Admin + HR: approve leaves and manage payroll
  static bool canApproveLeaves(String? role) => isAdmin(role) || isHR(role);

  /// All roles can view their own profile
  static bool canViewProfile(String? role) => role != null;
}
