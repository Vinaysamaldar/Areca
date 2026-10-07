import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/disease.dart';
import '../providers/app_settings_provider.dart';
import '../services/disease_service.dart';
import '../utils/app_colors.dart';

class DiseaseLibraryScreen extends StatefulWidget {
  const DiseaseLibraryScreen({Key? key}) : super(key: key);

  @override
  State<DiseaseLibraryScreen> createState() => _DiseaseLibraryScreenState();
}

class _DiseaseLibraryScreenState extends State<DiseaseLibraryScreen> {
  String _searchQuery = "";

  Color _getSeverityColor(String severity) {
    switch (severity.toLowerCase()) {
      case 'critical':
        return AppColors.severityCritical;
      case 'severe':
      case 'high':
        return AppColors.severityHigh;
      case 'moderate':
        return AppColors.severityModerate;
      default:
        return AppColors.severityNormal;
    }
  }

  void _showDiseaseDetails(BuildContext context, Disease d, bool isKn) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final color = _getSeverityColor(d.severity);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        height: MediaQuery.of(context).size.height * 0.85,
        decoration: BoxDecoration(
          color: isDark ? AppColors.darkCard : Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        ),
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 48,
                height: 5,
                decoration: BoxDecoration(
                  color: Colors.grey.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Header Title
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        isKn ? d.nameKn : d.name,
                        style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900),
                      ),
                      if (isKn)
                        Text(d.name, style: const TextStyle(fontSize: 13, color: Colors.grey))
                      else
                        Text(d.nameKn, style: const TextStyle(fontSize: 14, color: AppColors.primary, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    d.severity,
                    style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 12),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),

            Text("Pathogen: ${d.pathogen}", style: const TextStyle(fontSize: 12, fontStyle: FontStyle.italic, color: Colors.grey)),
            const Divider(height: 24),

            // Scrollable Content
            Expanded(
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Description
                    Text(
                      isKn ? d.descriptionKn : d.description,
                      style: TextStyle(fontSize: 13, height: 1.4, color: isDark ? Colors.white70 : Colors.black87),
                    ),
                    const SizedBox(height: 18),

                    // Symptoms
                    _buildSectionTitle(isKn ? "ಲಕ್ಷಣಗಳು (Symptoms)" : "Clinical Symptoms", Icons.search),
                    ...((isKn ? d.symptomsKn : d.symptoms).map((s) => _buildBulletPoint(s, isDark))),
                    const SizedBox(height: 16),

                    // Organic Remedies
                    _buildSectionTitle(isKn ? "ಸಾವಯವ ಪರಿಹಾರಗಳು (Organic Management)" : "Organic & Bio-Control", Icons.eco),
                    ...((isKn ? d.organicTreatmentKn : d.organicTreatment).map((o) => _buildBulletPoint(o, isDark))),
                    const SizedBox(height: 16),

                    // Chemical Control
                    _buildSectionTitle(isKn ? "ರಾಸಾಯನಿಕ ಔಷಧಿ (Chemical Control)" : "Chemical Control & Dosages", Icons.science),
                    ...((isKn ? d.chemicalTreatmentKn : d.chemicalTreatment).map((c) => _buildBulletPoint(c, isDark))),
                    const SizedBox(height: 16),

                    // Prevention
                    _buildSectionTitle(isKn ? "ಮುನ್ನೆಚ್ಚರಿಕೆಗಳು (Prevention)" : "Preventive Agronomic Measures", Icons.shield),
                    ...((isKn ? d.preventionKn : d.prevention).map((p) => _buildBulletPoint(p, isDark))),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title, IconData icon) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppColors.primary),
          const SizedBox(width: 8),
          Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildBulletPoint(String text, bool isDark) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6.0, left: 4.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text("• ", style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 16)),
          Expanded(
            child: Text(text, style: TextStyle(fontSize: 13, height: 1.35, color: isDark ? Colors.white70 : Colors.black87)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final settings = Provider.of<AppSettingsProvider>(context);
    final isKn = settings.isKannada;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final allDiseases = DiseaseService().diseases.values.toList();
    final filtered = allDiseases.where((d) {
      final q = _searchQuery.toLowerCase();
      return d.name.toLowerCase().contains(q) ||
          d.nameKn.toLowerCase().contains(q) ||
          d.pathogen.toLowerCase().contains(q);
    }).toList();

    return Column(
      children: [
        // Search Bar
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
          child: TextField(
            onChanged: (val) => setState(() => _searchQuery = val),
            decoration: InputDecoration(
              hintText: isKn ? "ರೋಗದ ಹೆಸರು ಹುಡುಕಿ..." : "Search disease or pathogen...",
              prefixIcon: const Icon(Icons.search, color: AppColors.primary),
              filled: true,
              fillColor: isDark ? AppColors.darkCard : AppColors.surfaceLight,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide.none,
              ),
            ),
          ),
        ),

        // List of Diseases
        Expanded(
          child: ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            itemCount: filtered.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (ctx, index) {
              final d = filtered[index];
              final color = _getSeverityColor(d.severity);

              return Card(
                elevation: 0,
                color: isDark ? AppColors.darkCard : Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                  side: BorderSide(color: Colors.grey.withOpacity(0.15)),
                ),
                child: InkWell(
                  onTap: () => _showDiseaseDetails(context, d, isKn),
                  borderRadius: BorderRadius.circular(20),
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Row(
                      children: [
                        Container(
                          width: 50,
                          height: 50,
                          decoration: BoxDecoration(
                            color: color.withOpacity(0.12),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Icon(Icons.eco_rounded, color: color, size: 28),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                isKn ? d.nameKn : d.name,
                                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                              ),
                              if (isKn)
                                Text(d.name, style: const TextStyle(fontSize: 12, color: Colors.grey))
                              else
                                Text(d.nameKn, style: const TextStyle(fontSize: 12, color: AppColors.primary, fontWeight: FontWeight.w600)),
                              const SizedBox(height: 3),
                              Text(
                                "Affects: ${d.partAffected}",
                                style: const TextStyle(fontSize: 11, color: Colors.grey),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: color.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            d.severity,
                            style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: color),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}
