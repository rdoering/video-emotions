
class DbConfigValues {
  String dbName = 'videoemo';
  String collectionName = 'sessions';
  String dbURI = 'mongodb://127.0.0.1/';
  int dbSize = 10;
  String get testDbName => dbName + "-test";
  String get testDbURI => dbURI;
  int get testDbSize => dbSize;
}
