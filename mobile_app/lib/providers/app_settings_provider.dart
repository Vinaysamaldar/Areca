import 'package:flutter/material.dart';

class AppSettingsProvider with ChangeNotifier {
  String _language = 'en';
  ThemeMode _themeMode = ThemeMode.system;
  bool _isOnlineMode = false;
  String _apiUrl = 'https://arecanut-disease-detection.onrender.com';

  String get language => _language;
  ThemeMode get themeMode => _themeMode;
  bool get isOnlineMode => _isOnlineMode;
  String get apiUrl => _apiUrl;

  bool get isKannada => _language == 'kn';

  void setLanguage(String lang) {
    if (_language != lang) {
      _language = lang;
      notifyListeners();
    }
  }

  void toggleLanguage() {
    _language = (_language == 'en') ? 'kn' : 'en';
    notifyListeners();
  }

  void setThemeMode(ThemeMode mode) {
    if (_themeMode != mode) {
      _themeMode = mode;
      notifyListeners();
    }
  }

  void toggleTheme() {
    if (_themeMode == ThemeMode.dark) {
      _themeMode = ThemeMode.light;
    } else {
      _themeMode = ThemeMode.dark;
    }
    notifyListeners();
  }

  void setOnlineMode(bool enabled) {
    _isOnlineMode = enabled;
    notifyListeners();
  }

  void setApiUrl(String url) {
    _apiUrl = url;
    notifyListeners();
  }
}
