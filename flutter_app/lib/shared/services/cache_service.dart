import 'package:hive_flutter/hive_flutter.dart';

class CacheService {
  static const String _cacheBoxName = 'cache';

  Future<void> put(String key, dynamic value) async {
    final box = Hive.box(_cacheBoxName);
    await box.put(key, value);
  }

  dynamic get(String key) {
    final box = Hive.box(_cacheBoxName);
    return box.get(key);
  }

  Future<void> delete(String key) async {
    final box = Hive.box(_cacheBoxName);
    await box.delete(key);
  }

  Future<void> clear() async {
    final box = Hive.box(_cacheBoxName);
    await box.clear();
  }
}
