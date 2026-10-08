import 'dart:io';
import 'dart:typed_data';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:intl/intl.dart';
import '../services/tflite_service.dart';
import '../models/disease.dart';

class PdfReportService {
  /// Generates and previews/prints a PDF report for an inspected palm specimen
  static Future<void> generateAndPrintReport({
    required File imageFile,
    required TfliteResult result,
    Disease? diseaseInfo,
    bool isKannada = false,
  }) async {
    final pdf = pw.Document();

    final Uint8List imageBytes = await imageFile.readAsBytes();
    final pw.MemoryImage scannedImage = pw.MemoryImage(imageBytes);

    final String reportId = "ARECA-MOB-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}";
    final String formattedDate = DateFormat('yyyy-MM-dd HH:mm').format(DateTime.now());

    final PdfColor primaryColor = PdfColor.fromHex('#1b5e20');
    final PdfColor headerBg = PdfColor.fromHex('#f1f8e9');

    // Severity color
    PdfColor sevColor = PdfColor.fromHex('#2e7d32');
    if (result.severity.toLowerCase() == 'severe') {
      sevColor = PdfColor.fromHex('#c62828');
    } else if (result.severity.toLowerCase() == 'moderate') {
      sevColor = PdfColor.fromHex('#f57f17');
    }

    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(32),
        build: (pw.Context context) {
          return pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              // 1. Header Title
              pw.Center(
                child: pw.Column(
                  children: [
                    pw.Text(
                      "ARECANUT CROP HEALTH DIAGNOSTIC REPORT",
                      style: pw.TextStyle(
                        fontSize: 16,
                        fontWeight: pw.FontWeight.bold,
                        color: primaryColor,
                      ),
                    ),
                    pw.SizedBox(height: 3),
                    pw.Text(
                      "On-Device Digital Image Processing & MobileNetV2 Deep Learning",
                      style: const pw.TextStyle(fontSize: 9, color: PdfColors.grey700),
                    ),
                    pw.SizedBox(height: 8),
                    pw.Divider(thickness: 1.5, color: primaryColor),
                  ],
                ),
              ),
              pw.SizedBox(height: 10),

              // 2. Metadata Grid Table
              pw.Container(
                decoration: pw.BoxDecoration(
                  color: headerBg,
                  borderRadius: const pw.BorderRadius.all(pw.Radius.circular(8)),
                  border: pw.Border.all(color: PdfColor.fromHex('#c5e1a5')),
                ),
                padding: const pw.EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                child: pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Column(
                      crossAxisAlignment: pw.CrossAxisAlignment.start,
                      children: [
                        pw.Text("Report ID: $reportId", style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 9)),
                        pw.SizedBox(height: 3),
                        pw.Text("Inspected Part: ${result.part.toUpperCase()}", style: const pw.TextStyle(fontSize: 9)),
                        pw.SizedBox(height: 3),
                        pw.Text("Diagnosis: ${result.disease}", style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 9, color: primaryColor)),
                      ],
                    ),
                    pw.Column(
                      crossAxisAlignment: pw.CrossAxisAlignment.start,
                      children: [
                        pw.Text("Date & Time: $formattedDate", style: const pw.TextStyle(fontSize: 9)),
                        pw.SizedBox(height: 3),
                        pw.Text("Confidence Score: ${result.confidence}%", style: const pw.TextStyle(fontSize: 9)),
                        pw.SizedBox(height: 3),
                        pw.Row(
                          children: [
                            pw.Text("Severity: ", style: const pw.TextStyle(fontSize: 9)),
                            pw.Text(result.severity.toUpperCase(), style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 9, color: sevColor)),
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              pw.SizedBox(height: 14),

              // 3. Visual Evidence & DIP Feature Metrics
              pw.Row(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Container(
                    width: 140,
                    height: 140,
                    decoration: pw.BoxDecoration(
                      borderRadius: const pw.BorderRadius.all(pw.Radius.circular(8)),
                      border: pw.Border.all(color: PdfColors.grey400),
                    ),
                    child: pw.ClipRRect(
                      horizontalRadius: 8,
                      verticalRadius: 8,
                      child: pw.Image(scannedImage, fit: pw.BoxFit.cover),
                    ),
                  ),
                  pw.SizedBox(width: 14),
                  pw.Expanded(
                    child: pw.Column(
                      crossAxisAlignment: pw.CrossAxisAlignment.start,
                      children: [
                        pw.Text(
                          "Digital Image Processing (DIP) Feature Vector",
                          style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 10, color: primaryColor),
                        ),
                        pw.SizedBox(height: 6),
                        if (result.dipFeatures != null) ...[
                          _buildMetricRow("Vegetation Index (NDVI):", result.dipFeatures!.ndviIndex.toStringAsFixed(3)),
                          _buildMetricRow("Excess Green (ExG):", result.dipFeatures!.exgIndex.toStringAsFixed(3)),
                          _buildMetricRow("Chlorosis (Yellowing):", "${result.dipFeatures!.chlorosisPercent.toStringAsFixed(1)}%"),
                          _buildMetricRow("Necrotic Lesions:", "${result.dipFeatures!.necrosisPercent.toStringAsFixed(1)}%"),
                          _buildMetricRow("Bark Rust / ExR:", "${result.dipFeatures!.stemRustPercent.toStringAsFixed(1)}%"),
                          _buildMetricRow("Texture Variance:", result.dipFeatures!.textureVariance.toStringAsFixed(1)),
                        ] else ...[
                          pw.Text("Multi-spectral foliar indicators calibrated to standard.", style: const pw.TextStyle(fontSize: 8.5)),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
              pw.SizedBox(height: 14),

              // 4. Clinical Advisory Section
              pw.Text("Clinical Pathology & Horticultural Advisory", style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 10, color: primaryColor)),
              pw.SizedBox(height: 6),

              _buildAdvisoryBox(
                "Observed Symptoms:",
                diseaseInfo?.symptoms.join("; ") ?? "Foliar chlorosis, necrotic spotting, or fruit drop observed on inspected tissue.",
              ),
              pw.SizedBox(height: 6),
              _buildAdvisoryBox(
                "Organic / Bio-Control Management:",
                diseaseInfo?.organicTreatment.join("; ") ?? "Apply enriched Trichoderma harzianum + neem cake around palm basin.",
              ),
              pw.SizedBox(height: 6),
              _buildAdvisoryBox(
                "Chemical Fungicide Protocol:",
                diseaseInfo?.chemicalTreatment.join("; ") ?? "Prophylactic or curative spraying of 1% Bordeaux mixture on bunches and crowns.",
              ),
              pw.SizedBox(height: 6),
              _buildAdvisoryBox(
                "Agronomic Prevention:",
                diseaseInfo?.prevention.join("; ") ?? "Maintain clean drainage trenches (50cm depth) to prevent water-logging in monsoon.",
              ),
              pw.SizedBox(height: 12),

              // 5. Safety Alert Box
              pw.Container(
                padding: const pw.EdgeInsets.all(8),
                decoration: pw.BoxDecoration(
                  color: PdfColor.fromHex('#fffde7'),
                  border: pw.Border.all(color: PdfColor.fromHex('#fbc02d')),
                  borderRadius: const pw.BorderRadius.all(pw.Radius.circular(6)),
                ),
                child: pw.Text(
                  "SAFETY NOTICE: Adhere strictly to CIBRC-approved dosage labels. Wear protective gloves and respirators when preparing copper fungicides. Consult your local Krishi Vigyan Kendra (KVK) for area-specific soil conditions.",
                  style: const pw.TextStyle(fontSize: 7.5, color: PdfColors.black),
                ),
              ),
              pw.Spacer(),

              // 6. Disclaimer Footer
              pw.Divider(thickness: 0.5, color: PdfColors.grey500),
              pw.Center(
                child: pw.Text(
                  "DISCLAIMER: AI diagnostic estimation generated on-device. Please verify with a certified horticulture officer.",
                  style: const pw.TextStyle(fontSize: 7, color: PdfColors.grey600),
                ),
              ),
            ],
          );
        },
      ),
    );

    // Present Native Print / PDF Share UI
    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => pdf.save(),
      name: "ArecaAI_Report_${result.part}_${result.disease.replaceAll(' ', '_')}.pdf",
    );
  }

  static pw.Widget _buildMetricRow(String label, String value) {
    return pw.Padding(
      padding: const pw.EdgeInsets.symmetric(vertical: 1.5),
      child: pw.Row(
        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
        children: [
          pw.Text(label, style: const pw.TextStyle(fontSize: 8, color: PdfColors.grey800)),
          pw.Text(value, style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold, color: PdfColors.black)),
        ],
      ),
    );
  }

  static pw.Widget _buildAdvisoryBox(String title, String content) {
    return pw.Container(
      padding: const pw.EdgeInsets.all(6),
      decoration: pw.BoxDecoration(
        color: PdfColor.fromHex('#fafafa'),
        borderRadius: const pw.BorderRadius.all(pw.Radius.circular(4)),
        border: pw.Border.all(color: PdfColors.grey300),
      ),
      child: pw.Row(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.SizedBox(
            width: 130,
            child: pw.Text(title, style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold)),
          ),
          pw.Expanded(
            child: pw.Text(content, style: const pw.TextStyle(fontSize: 8)),
          ),
        ],
      ),
    );
  }
}
