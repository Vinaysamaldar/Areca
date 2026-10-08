import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/disease_service.dart';
import '../models/disease.dart';
import '../providers/app_settings_provider.dart';

class SolutionsScreen extends StatefulWidget {
  const SolutionsScreen({Key? key}) : super(key: key);

  @override
  State<SolutionsScreen> createState() => _SolutionsScreenState();
}

class _SolutionsScreenState extends State<SolutionsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<Disease> _diseases = [];
  bool _isLoading = true;
  String _selectedPartFilter = 'all';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadDiseases();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadDiseases() async {
    final list = await DiseaseService().getAllDiseases();
    if (mounted) {
      setState(() {
        _diseases = list;
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
        title: Text(isKn ? "ಪರಿಹಾರ ಮತ್ತು ಸಿಂಪಡಣೆ ಕ್ಯಾಲೆಂಡರ್" : "Solutions & Spray Calendar"),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          labelStyle: const TextStyle(fontWeight: FontWeight.bold),
          tabs: [
            Tab(
              icon: const Icon(Icons.calendar_month),
              text: isKn ? "ವಾರ್ಷಿಕ ಕ್ಯಾಲೆಂಡರ್" : "Spray Calendar",
            ),
            Tab(
              icon: const Icon(Icons.healing),
              text: isKn ? "ರೋಗ ಪರಿಹಾರ ಕೈಪಿಡಿ" : "Treatment Guide",
            ),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Colors.green))
          : TabBarView(
              controller: _tabController,
              children: [
                _buildCalendarTab(isKn),
                _buildTreatmentsTab(isKn),
              ],
            ),
    );
  }

  // --- TAB 1: 4-SEASON AGRICULTURAL SPRAY CALENDAR ---
  Widget _buildCalendarTab(bool isKn) {
    return ListView(
      padding: const EdgeInsets.all(16.0),
      children: [
        Text(
          isKn ? "ಅಡಿಕೆ ತೋಟದ ವಾರ್ಷಿಕ ಸಿಂಪಡಣೆ ಕ್ಯಾಲೆಂಡರ್" : "Annual Plantation Prophylactic Calendar",
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 6),
        Text(
          isKn
              ? "ಮುಂಗಾರು ಮಳೆ ಮತ್ತು ರೋಗ ಹರಡುವ ಮುನ್ನ ಕಾಲೋಚಿತವಾಗಿ ಸಿಂಪಡಣೆ ಕೈಗೊಳ್ಳುವುದು ಅತ್ಯಾವಶ್ಯಕ."
              : "Preemptive fungicidal shields and basin sanitation to halt disease propagation.",
          style: const TextStyle(fontSize: 12, color: Colors.grey),
        ),
        const SizedBox(height: 16),

        _buildSeasonCard(
          title: isKn ? "1. ಮುಂಗಾರು ಪೂರ್ವ (ಮೇ - ಜೂನ್)" : "1. Pre-Monsoon (May - June)",
          badge: isKn ? "ಅತ್ಯಗತ್ಯ" : "Critical Prophylactic",
          badgeColor: Colors.amber[800]!,
          description: isKn
              ? "ಕೊಳೆರೋಗ (ಮಹಾಲಿ) ತಡೆಗಟ್ಟಲು ಮಳೆ ಆರಂಭಕ್ಕೂ ಮುನ್ನ ಬೋರ್ಡೋ ದ್ರಾವಣ ಸಿಂಪಡಣೆ."
              : "Primary shield against Koleroga (Fruit Rot) and Bud Rot spores before monsoons.",
          bullets: [
            isKn ? "1% ಬೋರ್ಡೋ ದ್ರಾವಣವನ್ನು ಗೊನೆಗಳು ಮತ್ತು ಮರದ ಸುಳಿಗೆ ಸಂಪೂರ್ಣ ಸಿಂಪಡಿಸಿ." : "Thoroughly spray 1% Bordeaux mixture on all nut bunches and crowns.",
            isKn ? "ದ್ರಾವಣಕ್ಕೆ ಅಂಟು (ರೋಸಿನ್ ಸೋಪ್ / ಸ್ಟಿಕ್ಕರ್) ಸೇರಿಸಿ." : "Mix rosin soap or agricultural sticker (Teepol) to prevent rain wash-off.",
            isKn ? "ತೋಟದಲ್ಲಿ ನೀರು ನಿಲ್ಲದಂತೆ ಬಸಿಗಾಲುವೆಗಳನ್ನು (Drainage) ಸ್ವಚ್ಛಗೊಳಿಸಿ." : "Clean plantation drainage channels to eliminate basin water stagnation.",
          ],
        ),

        _buildSeasonCard(
          title: isKn ? "2. ಮುಂಗಾರು ಮಳೆಯ ಶಿಖರ (ಜುಲೈ - ಆಗಸ್ಟ್)" : "2. Monsoon Peak (July - August)",
          badge: isKn ? "ಎರಡನೇ ಸಿಂಪಡಣೆ" : "Secondary Spray",
          badgeColor: Colors.blue[700]!,
          description: isKn
              ? "ನಿರಂತರ ಮಳೆಯ ಅವಧಿಯಲ್ಲಿ ರೋಗ ಹರಡದಂತೆ ಮುನ್ನೆಚ್ಚರಿಕೆ ವಹಿಸುವುದು."
              : "Maintaining protective barrier during sustained cloudy and high humidity periods.",
          bullets: [
            isKn ? "ಮೊದಲ ಸಿಂಪಡಣೆಯ 40-45 ದಿನಗಳ ನಂತರ ಮಳೆ ಬಿಡುವು ನೀಡಿದಾಗ 2ನೇ ಸಿಂಪಡಣೆ ಮಾಡಿ." : "Administer 2nd spray 40-45 days after the 1st during a rain-free window.",
            isKn ? "ಬಿದ್ದ ಕೊಳೆತ ಕಾಯಿಗಳನ್ನು ಆರಿಸಿ ಆಳವಾದ ಗುಂಡಿಯಲ್ಲಿ ಹೂತುಹಾಕಿ." : "Collect and deeply bury fallen infected nuts to arrest airborne spore drift.",
          ],
        ),

        _buildSeasonCard(
          title: isKn ? "3. ಮುಂಗಾರು ನಂತರ (ಸೆಪ್ಟೆಂಬರ್ - ನವೆಂಬರ್)" : "3. Post-Monsoon (Sept - November)",
          badge: isKn ? "ಬುಡ ಮತ್ತು ಕಾಂಡ" : "Trunk & Basin Care",
          badgeColor: Colors.green[700]!,
          description: isKn
              ? "ಕಾಂಡ ಸ್ರಾವ ನಿಯಂತ್ರಣ ಮತ್ತು ಪೋಷಕಾಂಶಗಳ ಮರುಪೂರಣ."
              : "Basal bark lesion dressing and soil microbiological replenishment.",
          bullets: [
            isKn ? "ಕಾಂಡ ಸ್ರಾವವಿರುವ ಜಾಗವನ್ನು ಕೆರೆದು ಬೋರ್ಡೋ ಪೇಸ್ಟ್ ಅಥವಾ ಡಾಂಬರು ಹಚ್ಚಿ." : "Chisel out bleeding trunk lesions and paste with Bordeaux or hot coal tar.",
            isKn ? "ಬುಡಕ್ಕೆ ಟ್ರೈಕೋಡರ್ಮಾ ಪುಡಿ ಮತ್ತು ಬೇವಿನ ಹಿಂಡಿ ಮಿಶ್ರಿತ ಗೊಬ್ಬರ ಹಾಕಿ." : "Drench root basins with Trichoderma harzianum enriched neem cake + FYM.",
          ],
        ),

        _buildSeasonCard(
          title: isKn ? "4. ಬೇಸಿಗೆ ಕಾಲ (ಡಿಸೆಂಬರ್ - ಏಪ್ರಿಲ್)" : "4. Summer & Dry Season (Dec - April)",
          badge: isKn ? "ತೇವಾಂಶ ಮತ್ತು ನೆರಳು" : "Sun & Moisture Care",
          badgeColor: Colors.orange[800]!,
          description: isKn
              ? "ಕಾಂಡಕ್ಕೆ ಬಿಸಿಲಿನ ಹೊಡೆತ ತಪ್ಪಿಸುವುದು ಮತ್ತು ಬೇರು ಹುಳು ನಿಯಂತ್ರಣ."
              : "Conserving moisture and preventing bark solar cracking / root grubs.",
          bullets: [
            isKn ? "ದಕ್ಷಿಣ ಮತ್ತು ಪಶ್ಚಿಮ ದಿಕ್ಕಿನ ಕಾಂಡಗಳಿಗೆ ಸುಣ್ಣ (Lime) ಬಳಿಯಿರಿ." : "White-wash southwest facing trunks with lime to reflect solar radiation.",
            isKn ? "ಮಣ್ಣಿನಲ್ಲಿ ತೇವಾಂಶ ಉಳಿಸಲು ಒಣಗರಿ ಅಥವಾ ತ್ಯಾಜ್ಯಗಳಿಂದ ಹೊದಿಕೆ (Mulching) ಮಾಡಿ." : "Mulch around the 1-meter basin with dry leaves to conserve moisture.",
          ],
        ),
      ],
    );
  }

  Widget _buildSeasonCard({
    required String title,
    required String badge,
    required Color badgeColor,
    required String description,
    required List<String> bullets,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey.withOpacity(0.2)),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 6),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: badgeColor.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  badge,
                  style: TextStyle(color: badgeColor, fontSize: 10, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(description, style: const TextStyle(fontSize: 12, color: Colors.grey)),
          const SizedBox(height: 10),
          ...bullets.map((b) => Padding(
                padding: const EdgeInsets.only(bottom: 4.0),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text("• ", style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold)),
                    Expanded(child: Text(b, style: const TextStyle(fontSize: 11.5))),
                  ],
                ),
              )),
        ],
      ),
    );
  }

  // --- TAB 2: DISEASE TREATMENT DIRECTORY ---
  Widget _buildTreatmentsTab(bool isKn) {
    final filtered = _diseases.where((d) {
      if (_selectedPartFilter == 'all') return true;
      final part = (d.severity.contains('Leaf') || d.name.toLowerCase().contains('leaf'))
          ? 'leaf'
          : (d.name.toLowerCase().contains('nut') || d.name.toLowerCase().contains('koleroga')
              ? 'nut'
              : (d.name.toLowerCase().contains('stem') ? 'stem' : 'root'));
      return part == _selectedPartFilter;
    }).toList();

    return Column(
      children: [
        // Filter Chips
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          child: Row(
            children: [
              _buildFilterChip('all', isKn ? 'ಎಲ್ಲಾ ಭಾಗಗಳು' : 'All Parts'),
              _buildFilterChip('nut', isKn ? '🥥 ಕಾಯಿ' : '🥥 Nut'),
              _buildFilterChip('leaf', isKn ? '🍃 ಎಲೆ' : '🍃 Leaf'),
              _buildFilterChip('stem', isKn ? '🪵 ಕಾಂಡ' : '🪵 Stem'),
              _buildFilterChip('root', isKn ? '🌱 ಬೇರು' : '🌱 Root'),
            ],
          ),
        ),

        // List of Cards
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            itemCount: filtered.length,
            itemBuilder: (ctx, i) {
              final d = filtered[i];
              return _buildDiseaseTreatmentCard(d, isKn);
            },
          ),
        ),
      ],
    );
  }

  Widget _buildFilterChip(String key, String label) {
    final isSelected = _selectedPartFilter == key;
    return Padding(
      padding: const EdgeInsets.only(right: 8.0),
      child: FilterChip(
        label: Text(label),
        selected: isSelected,
        selectedColor: Colors.green[700],
        labelStyle: TextStyle(
          color: isSelected ? Colors.white : Colors.black87,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          fontSize: 12,
        ),
        onSelected: (_) {
          setState(() => _selectedPartFilter = key);
        },
      ),
    );
  }

  Widget _buildDiseaseTreatmentCard(Disease d, bool isKn) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey.withOpacity(0.2)),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 6),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  isKn ? d.nameKn : d.name,
                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: Colors.green.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  d.severity,
                  style: const TextStyle(color: Colors.green, fontSize: 10, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            isKn ? d.descriptionKn : d.description,
            style: const TextStyle(fontSize: 11.5, color: Colors.grey),
          ),
          const Divider(height: 20),

          // Organic Method
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.eco, size: 16, color: Colors.green),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  "${isKn ? 'ಸಾವಯವ ಚಿಕಿತ್ಸೆ: ' : 'Organic / Bio-Control: '} ${isKn ? d.organicTreatmentKn.join('; ') : d.organicTreatment.join('; ')}",
                  style: const TextStyle(fontSize: 11),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),

          // Chemical Spray
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.science, size: 16, color: Colors.amber),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  "${isKn ? 'ರಾಸಾಯನಿಕ ಸಿಂಪಡಣೆ: ' : 'Chemical Fungicides: '} ${isKn ? d.chemicalTreatmentKn.join('; ') : d.chemicalTreatment.join('; ')}",
                  style: const TextStyle(fontSize: 11),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
