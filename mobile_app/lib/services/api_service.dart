import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'tflite_service.dart';

class ApiService {
  static Future<TfliteResult> predictOnline(File imageFile, String baseUrl) async {
    final cleanUrl = baseUrl.endsWith('/') ? baseUrl.substring(0, baseUrl.length - 1) : baseUrl;
    final uri = Uri.parse('$cleanUrl/predict');

    var request = http.MultipartRequest('POST', uri);
    request.files.add(await http.MultipartFile.fromPath('image', imageFile.path));

    final streamedResponse = await request.send().timeout(const Duration(seconds: 15));
    final response = await http.Response.fromStream(streamedResponse);

    if (response.statusCode == 200) {
      final Map<String, dynamic> data = json.decode(response.body);
      if (data['success'] == true) {
        final Map<String, dynamic> rawProbMap = data['probabilities'] ?? {};
        final Map<String, double> probMap = {};
        rawProbMap.forEach((k, v) {
          probMap[k] = (v as num).toDouble();
        });

        return TfliteResult(
          disease: data['disease'] ?? 'Healthy',
          confidence: (data['confidence'] as num).toDouble(),
          probabilities: probMap,
          isLowConfidence: data['low_confidence'] ?? false,
          engineMode: 'Cloud API (REST)',
        );
      } else {
        throw Exception(data['error'] ?? 'Prediction failed.');
      }
    } else {
      throw Exception('Server returned status: ${response.statusCode}');
    }
  }
}
