import 'package:flutter/material.dart';

class AppColors {
  // Brand Green Palette (Agriculture Theme)
  static const Color primary = Color(0xFF15803D);       // Deep emerald green
  static const Color primaryLight = Color(0xFF22C55E);  // Vibrant leaf green
  static const Color primaryDark = Color(0xFF14532D);   // Forest green
  static const Color accent = Color(0xFF10B981);        // Mint accent
  static const Color surfaceLight = Color(0xFFF0FDF4);  // Light sage background
  static const Color surfaceCard = Colors.white;

  // Dark Mode Palette
  static const Color darkBackground = Color(0xFF09090B);
  static const Color darkSurface = Color(0xFF18181B);
  static const Color darkCard = Color(0xFF27272A);

  // Severity Colors
  static const Color severityNormal = Color(0xFF16A34A);
  static const Color severityModerate = Color(0xFFCA8A04);
  static const Color severityHigh = Color(0xFFEA580C);
  static const Color severityCritical = Color(0xFFDC2626);

  // Warning for low confidence (<60%)
  static const Color warningBg = Color(0xFFFEF3C7);
  static const Color warningText = Color(0xFF92400E);
  static const Color warningBorder = Color(0xFFF59E0B);
}
