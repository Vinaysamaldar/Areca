import 'dart:convert';
import 'package:flutter/services.dart';
import '../models/disease.dart';

class DiseaseService {
  static final DiseaseService _instance = DiseaseService._internal();
  factory DiseaseService() => _instance;
  DiseaseService._internal();

  final Map<String, Disease> _diseases = {};
  bool _isLoaded = false;

  Map<String, Disease> get diseases => _diseases;

  Future<void> loadDiseases() async {
    if (_isLoaded) return;
    try {
      final jsonString = await rootBundle.loadString('assets/disease_info.json');
      final Map<String, dynamic> data = json.decode(jsonString);
      final Map<String, dynamic> diseasesMap = data['diseases'] ?? {};

      diseasesMap.forEach((key, val) {
        _diseases[key] = Disease.fromJson(key, val);
      });
      _isLoaded = true;
    } catch (e) {
      print("[WARN] Error loading disease_info.json: $e");
    }
  }

  Disease? getDisease(String name) {
    if (_diseases.containsKey(name)) return _diseases[name];
    // Case-insensitive / partial match fallback
    for (var entry in _diseases.entries) {
      if (entry.key.toLowerCase().contains(name.toLowerCase()) ||
          name.toLowerCase().contains(entry.key.toLowerCase())) {
        return entry.value;
      }
    }
    return null;
  }
}
