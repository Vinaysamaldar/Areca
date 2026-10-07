import 'dart:io';
import 'package:path/path.dart';
import 'package:path_provider/path_provider.dart';
import 'package:sqflite/sqflite.dart';
import '../models/prediction_record.dart';

class DatabaseService {
  static final DatabaseService _instance = DatabaseService._internal();
  factory DatabaseService() => _instance;
  DatabaseService._internal();

  Database? _db;

  Future<Database> get database async {
    if (_db != null) return _db!;
    _db = await _initDatabase();
    return _db!;
  }

  Future<Database> _initDatabase() async {
    Directory documentsDirectory = await getApplicationDocumentsDirectory();
    String path = join(documentsDirectory.path, "areca_predictions.db");
    
    return await openDatabase(
      path,
      version: 1,
      onCreate: (Database db, int version) async {
        await db.execute('''
          CREATE TABLE predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            imagePath TEXT NOT NULL,
            disease TEXT NOT NULL,
            diseaseKn TEXT,
            confidence REAL NOT NULL,
            severity TEXT,
            isLowConfidence INTEGER DEFAULT 0,
            timestamp TEXT NOT NULL,
            note TEXT
          )
        ''');
      },
    );
  }

  Future<int> insertRecord(PredictionRecord record) async {
    final db = await database;
    return await db.insert('predictions', record.toMap());
  }

  Future<List<PredictionRecord>> getRecords() async {
    final db = await database;
    final List<Map<String, dynamic>> maps = await db.query(
      'predictions',
      orderBy: 'id DESC',
    );
    return List.generate(maps.length, (i) => PredictionRecord.fromMap(maps[i]));
  }

  Future<int> deleteRecord(int id) async {
    final db = await database;
    return await db.delete(
      'predictions',
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  Future<int> clearAllRecords() async {
    final db = await database;
    return await db.delete('predictions');
  }
}
