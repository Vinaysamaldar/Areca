import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../models/prediction_record.dart';
import '../providers/app_settings_provider.dart';
import '../services/api_service.dart';
import '../services/database_service.dart';
import '../services/disease_service.dart';
import '../services/tflite_service.dart';
import '../utils/app_colors.dart';
import '../utils/app_strings.dart';
import 'result_screen.dart';

class PreviewScreen extends StatefulWidget {
  final File imageFile;

  const PreviewScreen({Key? key, required this.imageFile}) : super(key: key);

  @override
  State<PreviewScreen> createState() => _PreviewScreenState();
}

class _PreviewScreenState extends State<PreviewScreen> {
  late File _currentImage;
  bool _isAnalyzing = false;
  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _currentImage = widget.imageFile;
  }

  Future<void> _changePhoto() async {
    final XFile? newPhoto = await _picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 1080,
      maxHeight: 1080,
      imageQuality: 92,
    );
    if (newPhoto != null) {
      setState(() {
        _currentImage = File(newPhoto.path);
      });
    }
  }

  Future<void> _analyzeDisease() async {
    setState(() => _isAnalyzing = true);
    final settings = Provider.of<AppSettingsProvider>(context, listen: false);

    try {
      TfliteResult result;

      if (settings.isOnlineMode) {
        // Online REST API inference
        result = await ApiService.predictOnline(_currentImage, settings.apiUrl);
      } else {
        // Offline On-Device TFLite inference
        result = await TfliteService().classifyImage(_currentImage);
      }

      // Lookup disease details
      final diseaseDetails = DiseaseService().getDisease(result.disease);
      final diseaseKn = diseaseDetails?.nameKn ?? result.disease;
      final severity = diseaseDetails?.severity ?? 'Moderate';

      // Save to local SQLite database
      final timestamp = DateFormat('yyyy-MM-dd HH:mm').format(DateTime.now());
      final record = PredictionRecord(
        imagePath: _currentImage.path,
        disease: result.disease,
        diseaseKn: diseaseKn,
        confidence: result.confidence,
        severity: severity,
        isLowConfidence: result.isLowConfidence,
        timestamp: timestamp,
      );

      await DatabaseService().insertRecord(record);

      if (mounted) {
        setState(() => _isAnalyzing = false);
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (_) => ResultScreen(
              imageFile: _currentImage,
              result: result,
              disease: diseaseDetails,
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isAnalyzing = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text("Error during diagnosis: $e"),
            backgroundColor: Colors.red.shade700,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final settings = Provider.of<AppSettingsProvider>(context);
    final lang = settings.language;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: Text(AppStrings.get('preview_title', lang)),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            children: [
              // Image Container with Rounded Corners & Shadow
              Expanded(
                child: Container(
                  width: double.infinity,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.12),
                        blurRadius: 18,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(24),
                    child: Image.file(
                      _currentImage,
                      fit: BoxFit.cover,
                      width: double.infinity,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Checklist Banner
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: isDark ? AppColors.darkCard : AppColors.surfaceLight,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.primary.withOpacity(0.2)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.check_circle_outline, color: AppColors.primary, size: 20),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        AppStrings.get('photo_quality_good', lang),
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Action Buttons Row
              Row(
                children: [
                  // Change Photo Button
                  OutlinedButton.icon(
                    onPressed: _isAnalyzing ? null : _changePhoto,
                    icon: const Icon(Icons.refresh),
                    label: Text(AppStrings.get('retake_button', lang)),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                  ),
                  const SizedBox(width: 12),

                  // Detect Disease Button
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: _isAnalyzing ? null : _analyzeDisease,
                      icon: _isAnalyzing
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                            )
                          : const Icon(Icons.biotech_rounded, size: 22),
                      label: Text(
                        _isAnalyzing
                            ? (lang == 'kn' ? "ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ..." : "Analyzing...")
                            : AppStrings.get('detect_button', lang),
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        elevation: 4,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
