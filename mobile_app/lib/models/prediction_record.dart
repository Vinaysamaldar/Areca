class PredictionRecord {
  final int? id;
  final String imagePath;
  final String disease;
  final String diseaseKn;
  final double confidence;
  final String severity;
  final bool isLowConfidence;
  final String timestamp;
  final String? note;

  PredictionRecord({
    this.id,
    required this.imagePath,
    required this.disease,
    required this.diseaseKn,
    required this.confidence,
    required this.severity,
    required this.isLowConfidence,
    required this.timestamp,
    this.note,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'imagePath': imagePath,
      'disease': disease,
      'diseaseKn': diseaseKn,
      'confidence': confidence,
      'severity': severity,
      'isLowConfidence': isLowConfidence ? 1 : 0,
      'timestamp': timestamp,
      'note': note,
    };
  }

  factory PredictionRecord.fromMap(Map<String, dynamic> map) {
    return PredictionRecord(
      id: map['id'],
      imagePath: map['imagePath'] ?? '',
      disease: map['disease'] ?? '',
      diseaseKn: map['diseaseKn'] ?? '',
      confidence: (map['confidence'] as num?)?.toDouble() ?? 0.0,
      severity: map['severity'] ?? 'Moderate',
      isLowConfidence: (map['isLowConfidence'] ?? 0) == 1,
      timestamp: map['timestamp'] ?? '',
      note: map['note'],
    );
  }
}
