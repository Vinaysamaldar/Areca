import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/prediction_record.dart';
import '../providers/app_settings_provider.dart';
import '../services/database_service.dart';
import '../services/disease_service.dart';
import '../services/tflite_service.dart';
import '../utils/app_colors.dart';
import '../utils/app_strings.dart';
import 'result_screen.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({Key? key}) : super(key: key);

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  List<PredictionRecord> _records = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  Future<void> _loadHistory() async {
    setState(() => _isLoading = true);
    final records = await DatabaseService().getRecords();
    setState(() {
      _records = records;
      _isLoading = false;
    });
  }

  Future<void> _deleteRecord(int id, int index, PredictionRecord item) async {
    await DatabaseService().deleteRecord(id);
    setState(() {
      _records.removeAt(index);
    });

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text("${item.disease} deleted"),
          action: SnackBarAction(
            label: "Undo",
            onPressed: () async {
              await DatabaseService().insertRecord(item);
              _loadHistory();
            },
          ),
        ),
      );
    }
  }

  Future<void> _clearAll() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text("Clear All History?"),
        content: const Text("This will permanently remove all past scan records."),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text("Cancel")),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text("Delete All", style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirm == true) {
      await DatabaseService().clearAllRecords();
      _loadHistory();
    }
  }

  @override
  Widget build(BuildContext context) {
    final settings = Provider.of<AppSettingsProvider>(context);
    final lang = settings.language;
    final isKn = settings.isKannada;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primary));
    }

    if (_records.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 90,
                height: 90,
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.history_rounded, size: 48, color: AppColors.primary),
              ),
              const SizedBox(height: 20),
              Text(
                AppStrings.get('history_empty', lang),
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 6),
              Text(
                AppStrings.get('history_empty_sub', lang),
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 13, color: Colors.grey),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(AppStrings.get('history_title', lang)),
        actions: [
          IconButton(
            icon: const Icon(Icons.delete_sweep_outlined),
            onPressed: _clearAll,
            tooltip: AppStrings.get('clear_all', lang),
          ),
        ],
      ),
      body: ListView.separated(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        itemCount: _records.length,
        separatorBuilder: (_, __) => const SizedBox(height: 10),
        itemBuilder: (context, index) {
          final record = _records[index];
          final fileExists = File(record.imagePath).existsSync();

          return Dismissible(
            key: Key(record.id.toString()),
            direction: DismissDirection.endToStart,
            background: Container(
              alignment: Alignment.centerRight,
              padding: const EdgeInsets.only(right: 20),
              decoration: BoxDecoration(
                color: Colors.red.shade600,
                borderRadius: BorderRadius.circular(18),
              ),
              child: const Icon(Icons.delete_outline, color: Colors.white, size: 28),
            ),
            onDismissed: (_) => _deleteRecord(record.id!, index, record),
            child: InkWell(
              onTap: () {
                final d = DiseaseService().getDisease(record.disease);
                final tfliteRes = TfliteResult(
                  disease: record.disease,
                  confidence: record.confidence,
                  probabilities: {record.disease: record.confidence},
                  isLowConfidence: record.isLowConfidence,
                  engineMode: 'Database Record',
                );

                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => ResultScreen(
                      imageFile: File(record.imagePath),
                      result: tfliteRes,
                      disease: d,
                    ),
                  ),
                );
              },
              borderRadius: BorderRadius.circular(18),
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: isDark ? AppColors.darkCard : Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: Colors.grey.withOpacity(0.15)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.02),
                      blurRadius: 8,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    // Image Thumbnail
                    ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: fileExists
                          ? Image.file(
                              File(record.imagePath),
                              width: 65,
                              height: 65,
                              fit: BoxFit.cover,
                            )
                          : Container(
                              width: 65,
                              height: 65,
                              color: Colors.grey.shade300,
                              child: const Icon(Icons.image_not_supported, color: Colors.grey),
                            ),
                    ),
                    const SizedBox(width: 14),

                    // Details
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            isKn ? record.diseaseKn : record.disease,
                            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                          ),
                          if (isKn)
                            Text(
                              record.disease,
                              style: const TextStyle(fontSize: 11, color: Colors.grey),
                            ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Text(
                                "${record.confidence}%",
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  color: record.confidence >= 80 ? Colors.green : Colors.amber.shade800,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text("•  ${record.timestamp}", style: const TextStyle(fontSize: 11, color: Colors.grey)),
                            ],
                          ),
                        ],
                      ),
                    ),

                    const Icon(Icons.chevron_right, color: Colors.grey),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
