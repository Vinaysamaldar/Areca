import 'package:flutter/material.dart';

class PhotographyTip {
  final IconData icon;
  final String titleEn;
  final String titleKn;
  final String descEn;
  final String descKn;

  const PhotographyTip({
    required this.icon,
    required this.titleEn,
    required this.titleKn,
    required this.descEn,
    required this.descKn,
  });
}

class PhotographyTipsData {
  static const List<PhotographyTip> tips = [
    PhotographyTip(
      icon: Icons.zoom_in,
      titleEn: "Get Close to the Affected Part",
      titleKn: "ರೋಗಪೀಡಿತ ಭಾಗಕ್ಕೆ ಹತ್ತಿರವಾಗಿ ತೆಗೆಯಿರಿ",
      descEn: "Hold camera 15-30 cm from leaf spots, fruit rot base, or stem fissures for maximum lesion clarity.",
      descKn: "ಎಲೆ ಚುಕ್ಕೆಗಳು, ಕೊಳೆತ ಕಾಯಿಗಳ ತೊಟ್ಟು ಅಥವಾ ಕಾಂಡದ ಬಿರುಕುಗಳು ಸ್ಪಷ್ಟವಾಗಿ ಕಾಣುವಂತೆ 15-30 ಸೆಂ.ಮೀ ಅಂತರದಲ್ಲಿ ಹಿಡಿಯಿರಿ.",
    ),
    PhotographyTip(
      icon: Icons.wb_sunny_outlined,
      titleEn: "Capture in Natural Day Light",
      titleKn: "ನೈಸರ್ಗಿಕ ಬೆಳಕಿನಲ್ಲಿ ಸೆರೆಹಿಡಿಯಿರಿ",
      descEn: "Morning or late afternoon sunlight gives optimal true-to-life chlorophyll and necrotic brown color contrast.",
      descKn: "ಬೆಳಗಿನ ಅಥವಾ ಮಧ್ಯಾಹ್ನದ ನಂತರದ ನೈಸರ್ಗಿಕ ಬೆಳಕು ಎಲೆಯ ನೈಜ ಹಸಿರು ಮತ್ತು ರೋಗದ ಕಂದು ಬಣ್ಣವನ್ನು ನಿಖರವಾಗಿ ನೀಡುತ್ತದೆ.",
    ),
    PhotographyTip(
      icon: Icons.center_focus_strong,
      titleEn: "Ensure Crisp, Sharp Focus",
      titleKn: "ಸ್ಪಷ್ಟವಾದ ಫೋಕಸ್ ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ",
      descEn: "Tap your screen on the lesion spot and hold still for 1 second before snapping to avoid motion blur.",
      descKn: "ಮೊಬೈಲ್ ಪರದೆಯ ಮೇಲೆ ರೋಗದ ಭಾಗವನ್ನು ಬೆರಳಿನಿಂದ ಸ್ಪರ್ಶಿಸಿ ಫೋಕಸ್ ಮಾಡಿ, ಅಲುಗಾಡದಂತೆ ಫೋಟೋ ತೆಗೆಯಿರಿ.",
    ),
    PhotographyTip(
      icon: Icons.filter_center_focus,
      titleEn: "Fill the Frame with Plant Matter",
      titleKn: "ಅಡಿಕೆ ಮರದ ಭಾಗವನ್ನಷ್ಟೇ ಫ್ರೇಮ್‌ನಲ್ಲಿಡಿ",
      descEn: "Avoid capturing excessive background soil, sky, or unrelated weeds in the frame.",
      descKn: "ಹಿನ್ನೆಲೆಯಲ್ಲಿ ಆಕಾಶ ಅಥವಾ ಇತರ ಅನಗತ್ಯ ಕಳೆ ಗಿಡಗಳು ಬಾರದಂತೆ ಕೇವಲ ಅಡಿಕೆ ಮರದ ಭಾಗವಷ್ಟೇ ಕಾಣುವಂತೆ ಮಾಡಿ.",
    ),
  ];
}
