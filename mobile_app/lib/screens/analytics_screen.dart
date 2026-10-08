import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:provider/provider.dart';
import '../services/database_service.dart';
import '../models/prediction_record.dart';
import '../providers/app_settings_provider.dart';

class AnalyticsScreen extends StatefulWidget {
  const AnalyticsScreen({Key? key}) : super(key: key);

  @override
  State<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends State<AnalyticsScreen> {
  bool _isLoading = true;
  List<PredictionRecord> _records = [];

  Map<String, int> _diseaseCounts = {};
  Map<String, int> _partCounts = {'Leaf': 0, 'Nut': 0, 'Stem': 0, 'Root': 0};
  Map<String, int> _timelineCounts = {};

  int _totalScans = 0;
  double _healthyPct = 0.0;
  double _avgConfidence = 0.0;
  String _topDisease = "None";

  @override
  void initState() {
    super.initState();
    _loadAnalytics();
  }

  Future<void> _loadAnalytics() async {
    setState(() => _isLoading = true);
    final records = await DatabaseService().getAllPredictions();

    int total = records.length;
    int healthyCount = 0;
    double sumConf = 0;

    final Map<String, int> dCounts = {};
    final Map<String, int> pCounts = {'Leaf': 0, 'Nut': 0, 'Stem': 0, 'Root': 0};
    final Map<String, int> tCounts = {};

    for (final r in records) {
      sumConf += r.confidence;
      if (r.disease.toLowerCase().contains('healthy')) {
        healthyCount++;
      }

      // Disease counts
      dCounts[r.disease] = (dCounts[r.disease] ?? 0) + 1;

      // Part counts (parse from notes or default to Leaf)
      String part = 'Leaf';
      final n = r.notes.toLowerCase();
      if (n.contains('nut')) {
        part = 'Nut';
      } else if (n.contains('stem')) {
        part = 'Stem';
      } else if (n.contains('root')) {
        part = 'Root';
      }
      pCounts[part] = (pCounts[part] ?? 0) + 1;

      // Timeline (day-wise)
      String dateKey = r.timestamp.length >= 10 ? r.timestamp.substring(0, 10) : 'Recent';
      tCounts[dateKey] = (tCounts[dateKey] ?? 0) + 1;
    }

    String topD = "None";
    int maxD = 0;
    dCounts.forEach((k, v) {
      if (v > maxD) {
        maxD = v;
        topD = k;
      }
    });

    if (mounted) {
      setState(() {
        _records = records;
        _totalScans = total;
        _healthyPct = total > 0 ? (healthyCount / total * 100.0) : 0.0;
        _avgConfidence = total > 0 ? (sumConf / total) : 0.0;
        _topDisease = topD;
        _diseaseCounts = dCounts;
        _partCounts = pCounts;
        _timelineCounts = tCounts;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final settings = Provider.of<AppSettingsProvider>(context);
    final isKn = settings.languageCode == 'kn';

    return Scaffold(
      appBar: AppBar(
        title: Text(isKn ? "ತೋಟದ ವಿಶ್ಲೇಷಣೆ (Analytics)" : "Field Analytics"),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadAnalytics,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Colors.green))
          : _totalScans == 0
              ? _buildEmptyState(isKn)
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // 1. KPI Metric Cards
                      _buildMetricCards(isKn),
                      const SizedBox(height: 20),

                      // 2. Chart 1: Disease Distribution (PieChart)
                      _buildChartCard(
                        title: isKn ? "ರೋಗಗಳ ಹರಡುವಿಕೆ ಪ್ರಮಾಣ" : "Disease Distribution",
                        child: SizedBox(
                          height: 220,
                          child: _buildDiseasePieChart(),
                        ),
                      ),
                      const SizedBox(height: 16),

                      // 3. Chart 2: Scans by Plant Part (BarChart)
                      _buildChartCard(
                        title: isKn ? "ಭಾಗವಾರು ಸ್ಕ್ಯಾನ್ ವಿವರಗಳು" : "Scans by Plant Part",
                        child: SizedBox(
                          height: 200,
                          child: _buildPartBarChart(),
                        ),
                      ),
                      const SizedBox(height: 16),

                      // 4. Chart 3: Scans Over Time Trend (LineChart)
                      _buildChartCard(
                        title: isKn ? "ಸ್ಕ್ಯಾನ್ ಇತಿಹಾಸದ ಬೆಳವಣಿಗೆ" : "Scans Over Time",
                        child: SizedBox(
                          height: 200,
                          child: _buildTimelineLineChart(),
                        ),
                      ),
                      const SizedBox(height: 20),
                    ],
                  ),
                ),
    );
  }

  Widget _buildEmptyState(bool isKn) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.bar_chart_outlined, size: 72, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              isKn ? "ಯಾವುದೇ ಸ್ಕ್ಯಾನ್ ಇತಿಹಾಸವಿಲ್ಲ" : "No Scan Data Recorded Yet",
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              isKn
                  ? "ಕ್ಯಾಮೆರಾ ಅಥವಾ ಗ್ಯಾಲರಿಯಿಂದ ಫೋಟೋಗಳನ್ನು ಪರೀಕ್ಷಿಸಿದ ನಂತರ ಇಲ್ಲಿ ವಿಶ್ಲೇಷಣೆ ಕಾಣಿಸುತ್ತದೆ."
                  : "Scan palm leaves, nuts, or stems using Live Camera or Upload to generate telemetry graphs.",
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricCards(bool isKn) {
    return GridView.count(
      crossAxisCount: 2,
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      childAspectRatio: 1.5,
      children: [
        _buildMetricItem(
          title: isKn ? "ಒಟ್ಟು ಸ್ಕ್ಯಾನ್‌ಗಳು" : "Total Scans",
          value: "$_totalScans",
          icon: Icons.camera_alt,
          color: Colors.green[700]!,
        ),
        _buildMetricItem(
          title: isKn ? "ಆರೋಗ್ಯಕರ ಪ್ರಮಾಣ" : "Healthy Ratio",
          value: "${_healthyPct.toStringAsFixed(1)}%",
          icon: Icons.health_and_safety,
          color: Colors.teal[600]!,
        ),
        _buildMetricItem(
          title: isKn ? "ಮುಖ್ಯ ರೋಗ" : "Top Disease",
          value: _topDisease.length > 14 ? "${_topDisease.substring(0, 13)}.." : _topDisease,
          icon: Icons.warning_amber_rounded,
          color: Colors.amber[800]!,
        ),
        _buildMetricItem(
          title: isKn ? "ಸರಾಸರಿ ನಿಖರತೆ" : "Avg Confidence",
          value: "${_avgConfidence.toStringAsFixed(1)}%",
          icon: Icons.speed,
          color: Colors.blue[700]!,
        ),
      ],
    );
  }

  Widget _buildMetricItem({
    required String title,
    required String value,
    required IconData icon,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.withOpacity(0.2)),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 6),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(title, style: const TextStyle(fontSize: 11, color: Colors.grey, fontWeight: FontWeight.bold)),
              Icon(icon, size: 18, color: color),
            ],
          ),
          Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.extrabold, color: color)),
        ],
      ),
    );
  }

  Widget _buildChartCard({required String title, required Widget child}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey.withOpacity(0.2)),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 8),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
          const SizedBox(height: 14),
          child,
        ],
      ),
    );
  }

  Widget _buildDiseasePieChart() {
    final colors = [
      Colors.green[600]!,
      Colors.red[600]!,
      Colors.amber[700]!,
      Colors.blue[600]!,
      Colors.purple[600]!,
      Colors.orange[700]!,
      Colors.teal[600]!,
    ];

    int colorIdx = 0;
    final List<PieChartSectionData> sections = [];

    _diseaseCounts.forEach((dName, count) {
      final color = colors[colorIdx % colors.length];
      colorIdx++;
      final pct = (_totalScans > 0) ? (count / _totalScans * 100.0) : 0.0;
      sections.add(
        PieChartSectionData(
          value: count.toDouble(),
          title: "${pct.toStringAsFixed(0)}%",
          color: color,
          radius: 50,
          titleStyle: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
        ),
      );
    });

    return Row(
      children: [
        Expanded(
          flex: 3,
          child: PieChart(
            PieChartData(
              sections: sections,
              centerSpaceRadius: 36,
              sectionsSpace: 2,
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          flex: 2,
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: _diseaseCounts.keys.map((k) {
                final idx = _diseaseCounts.keys.toList().indexOf(k);
                final c = colors[idx % colors.length];
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 2.0),
                  child: Row(
                    children: [
                      Container(width: 10, height: 10, decoration: BoxDecoration(color: c, shape: BoxShape.circle)),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          k,
                          style: const TextStyle(fontSize: 9.5),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPartBarChart() {
    final parts = ['Leaf', 'Nut', 'Stem', 'Root'];
    final barGroups = <BarChartGroupData>[];

    for (int i = 0; i < parts.length; i++) {
      final p = parts[i];
      final val = (_partCounts[p] ?? 0).toDouble();
      barGroups.add(
        BarChartGroupData(
          x: i,
          barRods: [
            BarChartRodData(
              toY: val,
              color: i == 0 ? Colors.green[600] : (i == 1 ? Colors.orange[700] : (i == 2 ? Colors.brown[600] : Colors.brown[400])),
              width: 22,
              borderRadius: BorderRadius.circular(6),
            ),
          ],
        ),
      );
    }

    return BarChart(
      BarChartData(
        barGroups: barGroups,
        borderData: FlBorderData(show: false),
        gridData: FlGridData(drawVerticalLine: false, horizontalInterval: 1),
        titlesData: FlTitlesData(
          leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 28)),
          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              getTitlesWidget: (val, meta) {
                final idx = val.toInt();
                if (idx >= 0 && idx < parts.length) {
                  return Padding(
                    padding: const EdgeInsets.only(top: 6.0),
                    child: Text(parts[idx], style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                  );
                }
                return const SizedBox.shrink();
              },
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTimelineLineChart() {
    final keys = _timelineCounts.keys.toList();
    if (keys.isEmpty) return const SizedBox.shrink();

    final spots = <FlSpot>[];
    for (int i = 0; i < keys.length; i++) {
      spots.add(FlSpot(i.toDouble(), (_timelineCounts[keys[i]] ?? 0).toDouble()));
    }

    return LineChart(
      LineChartData(
        lineBarsData: [
          LineChartBarData(
            spots: spots,
            isCurved: true,
            color: Colors.green[700]!,
            barWidth: 3,
            isStrokeCapRound: true,
            dotData: const FlDotData(show: true),
            belowBarData: BarAreaData(
              show: true,
              color: Colors.green.withOpacity(0.15),
            ),
          ),
        ],
        borderData: FlBorderData(show: false),
        gridData: FlGridData(drawVerticalLine: false),
        titlesData: FlTitlesData(
          leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 28)),
          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              interval: 1,
              getTitlesWidget: (val, meta) {
                int i = val.toInt();
                if (i >= 0 && i < keys.length) {
                  final k = keys[i];
                  final shortDate = k.length >= 5 ? k.substring(5) : k;
                  return Padding(
                    padding: const EdgeInsets.only(top: 6.0),
                    child: Text(shortDate, style: const TextStyle(fontSize: 9)),
                  );
                }
                return const SizedBox.shrink();
              },
            ),
          ),
        ),
      ),
    );
  }
}
