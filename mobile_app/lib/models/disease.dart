class Disease {
  final String id;
  final String name;
  final String nameKn;
  final String pathogen;
  final String pathogenKn;
  final String partAffected;
  final String partAffectedKn;
  final String severity;
  final String description;
  final String descriptionKn;
  final List<String> symptoms;
  final List<String> symptomsKn;
  final List<String> causes;
  final List<String> causesKn;
  final List<String> organicTreatment;
  final List<String> organicTreatmentKn;
  final List<String> chemicalTreatment;
  final List<String> chemicalTreatmentKn;
  final List<String> prevention;
  final List<String> preventionKn;

  Disease({
    required this.id,
    required this.name,
    required this.nameKn,
    required this.pathogen,
    required this.pathogenKn,
    required this.partAffected,
    required this.partAffectedKn,
    required this.severity,
    required this.description,
    required this.descriptionKn,
    required this.symptoms,
    required this.symptomsKn,
    required this.causes,
    required this.causesKn,
    required this.organicTreatment,
    required this.organicTreatmentKn,
    required this.chemicalTreatment,
    required this.chemicalTreatmentKn,
    required this.prevention,
    required this.preventionKn,
  });

  factory Disease.fromJson(String id, Map<String, dynamic> json) {
    return Disease(
      id: id,
      name: json['name'] ?? id,
      nameKn: json['name_kn'] ?? id,
      pathogen: json['pathogen'] ?? 'N/A',
      pathogenKn: json['pathogen_kn'] ?? 'N/A',
      partAffected: json['part_affected'] ?? 'N/A',
      partAffectedKn: json['part_affected_kn'] ?? 'N/A',
      severity: json['severity'] ?? 'Moderate',
      description: json['description'] ?? '',
      descriptionKn: json['description_kn'] ?? '',
      symptoms: List<String>.from(json['symptoms'] ?? []),
      symptomsKn: List<String>.from(json['symptoms_kn'] ?? []),
      causes: List<String>.from(json['causes'] ?? []),
      causesKn: List<String>.from(json['causes_kn'] ?? []),
      organicTreatment: List<String>.from(json['organic_treatment'] ?? []),
      organicTreatmentKn: List<String>.from(json['organic_treatment_kn'] ?? []),
      chemicalTreatment: List<String>.from(json['chemical_treatment'] ?? []),
      chemicalTreatmentKn: List<String>.from(json['chemical_treatment_kn'] ?? []),
      prevention: List<String>.from(json['prevention'] ?? []),
      preventionKn: List<String>.from(json['prevention_kn'] ?? []),
    );
  }
}
