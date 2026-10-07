import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';

import '../models/disease.dart';
import '../providers/app_settings_provider.dart';
import '../services/tflite_service.dart';
import '../utils/app_colors.dart';
import '../utils/app_strings.dart';

class ResultScreen extends StatelessWidget {
  final File imageFile;
  final TfliteResult result;
  final Disease? disease;

  const ResultScreen({
    Key? key,
    required this.imageFile,
    required this.result,
    required this.disease,
  }) : super(key: key);

  Color _getSeverityColor(String? severity) {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return AppColors.severityCritical;
      case 'severe':
      case 'high':
        return AppColors.severityHigh;
      case 'moderate':
        return AppColors.severityModerate;
      case 'normal':
      default:
        return AppColors.severityNormal;
    }
  }

  Color _getConfidenceColor(double conf) {
    if (conf >= 80) return AppColors.severityNormal;
    if (conf >= 60) return AppColors.severityModerate;
    return AppColors.severityCritical;
  }

  void _shareDiagnosis(BuildContext context, String lang) {
    final d = disease;
    final isKn = lang == 'kn';

    final text = StringBuffer();
    text.writeln("🌴 ARECANUT CROP HEALTH DIAGNOSIS REPORT");
    text.writeln("======================================");
    text.writeln("Diagnosis: ${result.disease} ${d != null ? '(${d.nameKn})' : ''}");
    text.writeln("Confidence: ${result.confidence}%");
    text.writeln("Severity: ${d?.severity ?? 'Moderate'}");
    text.writeln("Pathogen: ${d?.pathogen ?? 'N/A'}");
    text.writeln("");

    if (d != null) {
      text.writeln("🌿 ORGANIC REMEDIES:");
      for (var t in (isKn ? d.organicTreatmentKn : d.organicTreatment)) {
        text.writeln("• $t");
      }
      text.writeln("");

      text.writeln("🧪 CHEMICAL FUNGICIDES:");
      for (var c in (isKn ? d.chemicalTreatmentKn : d.chemicalTreatment)) {
        text.writeln("• $c");
      }
      text.writeln("");

      text.writeln("🛡 PREVENTION:");
      for (var p in (isKn ? d.preventionKn : d.prevention)) {
        text.writeln("• $p");
      }
    }

    text.writeln("======================================");
    text.writeln("Generated via ArecaAI Mobile App (MobileNetV2)");

    Share.share(text.toString(), subject: "Arecanut Crop Health Report - ${result.disease}");
  }

  Widget _buildAdvisoryCard({
    required BuildContext context,
    required String title,
    required IconData icon,
    required Color iconColor,
    required List<String> items,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey.withOpacity(0.15)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: iconColor, size: 22),
              const SizedBox(width: 10),
              Text(
                title,
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (items.isEmpty)
            const Text(
              "No specific treatment required.",
              style: TextStyle(fontStyle: FontStyle.italic, color: Colors.grey),
            )
          else
            ...items.map(
              (item) => Padding(
                padding: const EdgeInsets.only(bottom: 8.0),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text("• ", style: TextStyle(color: iconColor, fontWeight: FontWeight.bold, fontSize: 16)),
                    Expanded(
                      child: Text(
                        item,
                        style: TextStyle(
                          fontSize: 13,
                          height: 1.4,
                          color: isDark ? Colors.white70 : Colors.black87,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final settings = Provider.of<AppSettingsProvider>(context);
    final lang = settings.language;
    final isKn = settings.isKannada;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final d = disease;

    final severityColor = _getSeverityColor(d?.severity);
    final confidenceColor = _getConfidenceColor(result.confidence);

    return Scaffold(
      appBar: AppBar(
        title: Text(AppStrings.get('result_title', lang)),
        actions: [
          IconButton(
            icon: const Icon(Icons.share_outlined),
            onPressed: () => _shareDiagnosis(context, lang),
            tooltip: "Share Diagnosis",
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image & Diagnosis Headline Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDark ? AppColors.darkCard : Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: AppColors.primary.withOpacity(0.2)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.04),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                children: [
                  // Thumbnail
                  ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: Image.file(
                      imageFile,
                      width: 90,
                      height: 90,
                      fit: BoxFit.cover,
                    ),
                  ),
                  const SizedBox(width: 16),

                  // Disease Info & Badge
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: severityColor.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            "${d?.severity ?? 'Moderate'} Severity",
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: severityColor,
                            ),
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          isKn ? (d?.nameKn ?? result.disease) : result.disease,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                        if (isKn)
                          Text(
                            result.disease,
                            style: const TextStyle(fontSize: 12, color: Colors.grey),
                          )
                        else if (d != null)
                          Text(
                            d.nameKn,
                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.primary),
                          ),
                        const SizedBox(height: 4),
                        Text(
                          "Pathogen: ${d?.pathogen ?? 'None'}",
                          style: const TextStyle(fontSize: 11, fontStyle: FontStyle.italic, color: Colors.grey),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Low-Confidence Warning Banner (<60%)
            if (result.isLowConfidence)
              Container(
                margin: const EdgeInsets.only(bottom: 16),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.warningBg,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: AppColors.warningBorder, width: 1.5),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.warning_amber_rounded, color: AppColors.warningText, size: 24),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            AppStrings.get('low_confidence_title', lang),
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: AppColors.warningText,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            AppStrings.get('low_confidence_msg', lang),
                            style: const TextStyle(fontSize: 12, color: AppColors.warningText),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

            // Confidence Level Progress Card
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: isDark ? AppColors.darkCard : AppColors.surfaceLight,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.primary.withOpacity(0.15)),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        AppStrings.get('confidence', lang),
                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                      ),
                      Text(
                        "${result.confidence}%",
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                          color: confidenceColor,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: LinearProgressIndicator(
                      value: result.confidence / 100.0,
                      minHeight: 10,
                      backgroundColor: Colors.grey.withOpacity(0.2),
                      valueColor: AlwaysStoppedAnimation<Color>(confidenceColor),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Align(
                    alignment: Alignment.centerRight,
                    child: Text(
                      "Inference: ${result.engineMode}",
                      style: const TextStyle(fontSize: 10, color: Colors.grey),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // 1. Symptoms Card
            if (d != null)
              _buildAdvisoryCard(
                context: context,
                title: AppStrings.get('symptoms', lang),
                icon: Icons.search_rounded,
                iconColor: AppColors.primary,
                items: isKn ? d.symptomsKn : d.symptoms,
              ),
            const SizedBox(height: 14),

            // 2. Organic Treatment Card
            if (d != null)
              _buildAdvisoryCard(
                context: context,
                title: AppStrings.get('organic_treatment', lang),
                icon: Icons.eco_rounded,
                iconColor: Colors.green,
                items: isKn ? d.organicTreatmentKn : d.organicTreatment,
              ),
            const SizedBox(height: 14),

            // 3. Chemical Treatment Card
            if (d != null)
              _buildAdvisoryCard(
                context: context,
                title: AppStrings.get('chemical_treatment', lang),
                icon: Icons.science_rounded,
                iconColor: Colors.amber.shade800,
                items: isKn ? d.chemicalTreatmentKn : d.chemicalTreatment,
              ),
            const SizedBox(height: 14),

            // 4. Prevention Card
            if (d != null)
              _buildAdvisoryCard(
                context: context,
                title: AppStrings.get('prevention', lang),
                icon: Icons.shield_outlined,
                iconColor: Colors.blue,
                items: isKn ? d.preventionKn : d.prevention,
              ),
            const SizedBox(height: 24),

            // Probability Distribution Section
            ExpansionTile(
              title: Text(
                isKn ? "ಎಲ್ಲಾ ತರಗತಿಗಳ ಸಂಭವನೀಯತೆ" : "All Class Probabilities",
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
              ),
              children: result.probabilities.entries.map((entry) {
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 6.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(entry.key, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                          Text("${entry.value}%", style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                        ],
                      ),
                      const SizedBox(height: 4),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: entry.value / 100.0,
                          minHeight: 6,
                          backgroundColor: Colors.grey.withOpacity(0.15),
                          valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primary),
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 28),

            // Share & Done Buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _shareDiagnosis(context, lang),
                    icon: const Icon(Icons.share),
                    label: Text(AppStrings.get('share_report', lang)),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.camera_alt_outlined),
                    label: Text(AppStrings.get('scan_another', lang)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}
