import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/app_settings_provider.dart';
import '../utils/app_colors.dart';
import '../utils/app_strings.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({Key? key}) : super(key: key);

  void _editApiUrl(BuildContext context, AppSettingsProvider settings) {
    final controller = TextEditingController(text: settings.apiUrl);

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text("Custom Cloud API Endpoint"),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              "Enter your Flask or FastAPI cloud server URL (e.g. deployed on Render or Vercel):",
              style: TextStyle(fontSize: 12),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: controller,
              decoration: const InputDecoration(
                hintText: "https://your-domain.com",
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text("Cancel"),
          ),
          ElevatedButton(
            onPressed: () {
              if (controller.text.trim().isNotEmpty) {
                settings.setApiUrl(controller.text.trim());
              }
              Navigator.pop(ctx);
            },
            child: const Text("Save"),
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

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Section: Preferences
          Text(
            isKn ? "ಆದ್ಯತೆಗಳು (Preferences)" : "App Preferences",
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.grey),
          ),
          const SizedBox(height: 10),

          // 1. Language Toggle
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isDark ? AppColors.darkCard : Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: Colors.grey.withOpacity(0.15)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(Icons.language_rounded, color: AppColors.primary),
                    const SizedBox(width: 14),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(AppStrings.get('language', lang), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                        Text(isKn ? "ಕನ್ನಡ (ಸಕ್ರಿಯವಾಗಿದೆ)" : "English (Active)", style: const TextStyle(fontSize: 11, color: Colors.grey)),
                      ],
                    ),
                  ],
                ),
                SegmentedButton<String>(
                  segments: const [
                    ButtonSegment(value: 'en', label: Text("EN")),
                    ButtonSegment(value: 'kn', label: Text("ಕನ್ನಡ")),
                  ],
                  selected: {settings.language},
                  onSelectionChanged: (set) => settings.setLanguage(set.first),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // 2. Dark/Light Theme
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isDark ? AppColors.darkCard : Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: Colors.grey.withOpacity(0.15)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Icon(isDark ? Icons.dark_mode_rounded : Icons.light_mode_rounded, color: Colors.amber),
                    const SizedBox(width: 14),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(AppStrings.get('theme', lang), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                        Text(isDark ? "Dark Mode" : "Light Mode", style: const TextStyle(fontSize: 11, color: Colors.grey)),
                      ],
                    ),
                  ],
                ),
                Switch(
                  value: isDark,
                  activeColor: AppColors.primary,
                  onChanged: (_) => settings.toggleTheme(),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Section: Model & Connectivity
          Text(
            isKn ? "ಮಾದರಿ ಮತ್ತು ಸಂಪರ್ಕ (Inference)" : "Model & Connectivity",
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.grey),
          ),
          const SizedBox(height: 10),

          // 3. Online/Offline Mode Toggle
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isDark ? AppColors.darkCard : Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: Colors.grey.withOpacity(0.15)),
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Icon(settings.isOnlineMode ? Icons.cloud : Icons.offline_bolt, color: AppColors.primary),
                        const SizedBox(width: 14),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(AppStrings.get('inference_mode', lang), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                            Text(
                              settings.isOnlineMode ? AppStrings.get('mode_online', lang) : AppStrings.get('mode_offline', lang),
                              style: const TextStyle(fontSize: 11, color: Colors.grey),
                            ),
                          ],
                        ),
                      ],
                    ),
                    Switch(
                      value: settings.isOnlineMode,
                      activeColor: AppColors.primary,
                      onChanged: (val) => settings.setOnlineMode(val),
                    ),
                  ],
                ),
                if (settings.isOnlineMode) ...[
                  const Divider(height: 20),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          "Endpoint: ${settings.apiUrl}",
                          style: const TextStyle(fontSize: 11, fontFamily: 'monospace', color: Colors.grey),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      TextButton(
                        onPressed: () => _editApiUrl(context, settings),
                        child: const Text("Change", style: TextStyle(fontSize: 12)),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 28),

          // Section: About Project & Team
          Text(
            isKn ? "ಪ್ರಾಜೆಕ್ಟ್ ಮಾಹಿತಿ (Project Information)" : "About Engineering Project",
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.grey),
          ),
          const SizedBox(height: 10),

          // Project Overview Card
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: isDark ? AppColors.darkCard : Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.grey.withOpacity(0.15)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  "Detection of Diseases in Arecanut Plants using Deep Learning",
                  style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16),
                ),
                const SizedBox(height: 6),
                Text(
                  isKn
                      ? "ಅಡಿಕೆ ಮರಗಳಲ್ಲಿ ಕೊಳೆರೋಗ, ಹಳದಿ ಎಲೆ ರೋಗ, ಸುಳಿ ಕೊಳೆ, ಕಾಂಡ ಸ್ರಾವ ಹಾಗೂ ಎಲೆ ಚುಕ್ಕೆ ರೋಗಗಳನ್ನು ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆ (ಮೊಬೈಲ್ ನೆಟ್ V2) ಬಳಸಿ ಪತ್ತೆ ಹಚ್ಚುವ ಮೊಬೈಲ್ ಅಪ್ಲಿಕೇಶನ್."
                      : "An Android mobile application leveraging MobileNetV2 transfer learning (TFLite) for rapid, on-device disease diagnosis of Arecanut crops.",
                  style: TextStyle(fontSize: 12, height: 1.4, color: isDark ? Colors.white70 : Colors.black87),
                ),
                const Divider(height: 24),

                // Team Members List
                Text(
                  AppStrings.get('team_members', lang),
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.primary),
                ),
                const SizedBox(height: 8),
                _buildTeamMember("1. Gurunath P Bankapur", "DL Model Training & Optimization"),
                _buildTeamMember("2. S J Ganesh Gowda", "Backend & API Architecture"),
                _buildTeamMember("3. Sadashiv S Hutagi", "Flutter UI/UX & Localization"),
                _buildTeamMember("4. Vinayaka.V", "Dataset & Pathology Module"),
                const SizedBox(height: 16),

                // Faculty Guide
                Text(
                  AppStrings.get('faculty_guide', lang),
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.primary),
                ),
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withOpacity(0.08),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      const CircleAvatar(
                        backgroundColor: AppColors.primary,
                        radius: 18,
                        child: Icon(Icons.person, color: Colors.white, size: 20),
                      ),
                      const SizedBox(width: 12),
                      const Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text("Prof. Vinutha H R", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                          Text("Department of Computer Science & Engineering", style: TextStyle(fontSize: 11, color: Colors.grey)),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Version Footer
          const Center(
            child: Text(
              "ArecaAI Mobile v1.0.0 • Department of CSE",
              style: TextStyle(fontSize: 11, color: Colors.grey),
            ),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _buildTeamMember(String name, String role) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(name, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
          Text(role, style: const TextStyle(fontSize: 11, color: Colors.grey)),
        ],
      ),
    );
  }
}
