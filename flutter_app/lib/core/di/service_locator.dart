import 'package:get_it/get_it.dart';
import '../network/api_service.dart';
import '../../features/projects/application/project_service.dart';
import '../../features/tasks/application/task_service.dart';
import '../../features/auth/application/auth_service.dart';
import '../../shared/services/cache_service.dart';

final GetIt locator = GetIt.instance;

Future<void> setupLocator() async {
  // ─── Network ───────────────────────────────────────────────────────────────
  locator.registerLazySingleton(() => ApiService());

  // ─── Services ──────────────────────────────────────────────────────────────
  locator.registerLazySingleton(() => AuthService(locator<ApiService>()));
  locator.registerLazySingleton(() => CacheService());
  locator.registerLazySingleton(
      () => ProjectService(locator<ApiService>(), locator<CacheService>()));
  locator.registerLazySingleton(
      () => TaskService(locator<ApiService>(), locator<CacheService>()));
}
