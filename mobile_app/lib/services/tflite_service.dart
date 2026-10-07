import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/services.dart';
import 'package:image/image.dart' as img;
import 'package:tflite_flutter/tflite_flutter.dart';

class TfliteResult {
  final String disease;
  final double confidence;
  final Map<String, double> probabilities;
  final bool isLowConfidence;
  final String engineMode;

  TfliteResult({
    required this.disease,
    required this.confidence,
    required this.probabilities,
    required this.isLowConfidence,
    required this.engineMode,
  });
}

class TfliteService {
  static final TfliteService _instance = TfliteService._internal();
  factory TfliteService() => _instance;
  TfliteService._internal();

  Interpreter? _interpreter;
  List<String> _labels = [];
  bool _isModelLoaded = false;

  final List<String> defaultClasses = [
    "Healthy",
    "Koleroga (Fruit Rot)",
    "Yellow Leaf Disease",
    "Bud Rot",
    "Stem Bleeding",
    "Leaf Spot"
  ];

  Future<void> initialize() async {
    await _loadLabels();
    await _loadModel();
  }

  Future<void> _loadLabels() async {
    try {
      final labelData = await rootBundle.loadString('assets/labels.txt');
      _labels = labelData
          .split('\n')
          .map((s) => s.trim())
          .where((s) => s.isNotEmpty)
          .toList();
    } catch (e) {
      print("[WARN] Could not load labels.txt: $e");
      _labels = List.from(defaultClasses);
    }
  }

  Future<void> _loadModel() async {
    try {
      final options = InterpreterOptions()..threads = 2;
      _interpreter = await Interpreter.fromAsset('assets/model.tflite', options: options);
      _isModelLoaded = true;
      print("[INFO] TFLite model loaded successfully!");
    } catch (e) {
      print("[INFO] 'assets/model.tflite' not found yet or error loading: $e");
      print("[INFO] Fallback on-device feature analyzer will be used until model is placed.");
      _isModelLoaded = false;
    }
  }

  Future<TfliteResult> classifyImage(File imageFile) async {
    final imageBytes = await imageFile.readAsBytes();
    final img.Image? decodedImage = img.decodeImage(imageBytes);

    if (decodedImage == null) {
      throw Exception("Unable to decode image file.");
    }

    if (_isModelLoaded && _interpreter != null) {
      return _runTfliteInference(decodedImage);
    } else {
      return _runHeuristicAnalysis(decodedImage);
    }
  }

  TfliteResult _runTfliteInference(img.Image originalImage) {
    // 1. Resize to 224x224
    final resized = img.copyResize(originalImage, width: 224, height: 224);

    // 2. Normalize to [-1.0, 1.0] for MobileNetV2
    var input = Float32List(1 * 224 * 224 * 3);
    int pixelIndex = 0;

    for (int y = 0; y < 224; y++) {
      for (int x = 0; x < 224; x++) {
        final pixel = resized.getPixel(x, y);
        input[pixelIndex++] = (pixel.r / 127.5) - 1.0;
        input[pixelIndex++] = (pixel.g / 127.5) - 1.0;
        input[pixelIndex++] = (pixel.b / 127.5) - 1.0;
      }
    }

    var inputReshaped = input.reshape([1, 224, 224, 3]);
    var output = List.filled(1 * _labels.length, 0.0).reshape([1, _labels.length]);

    // 3. Execute TFLite Interpreter
    _interpreter!.run(inputReshaped, output);

    List<double> rawProbs = List<double>.from(output[0]);
    return _formatOutput(rawProbs, "On-Device MobileNetV2 (TFLite)");
  }

  TfliteResult _runHeuristicAnalysis(img.Image originalImage) {
    // Fallback on-device feature extraction when model.tflite asset is not yet compiled
    final resized = img.copyResize(originalImage, width: 128, height: 128);
    int totalPixels = 128 * 128;
    int greenCount = 0;
    int yellowCount = 0;
    int rustCount = 0;
    int darkRotCount = 0;

    for (int y = 0; y < 128; y++) {
      for (int x = 0; x < 128; x++) {
        final p = resized.getPixel(x, y);
        num r = p.r;
        num g = p.g;
        num b = p.b;

        if (g > r * 1.1 && g > b * 1.1) greenCount++;
        if (r > 130 && g > 130 && b < 100) yellowCount++;
        if (r > 90 && r < 180 && g < 100 && b < 70 && r > g * 1.2) rustCount++;
        if (r < 80 && g < 80 && b < 80) darkRotCount++;
      }
    }

    double greenRatio = greenCount / totalPixels;
    double yellowRatio = yellowCount / totalPixels;
    double rustRatio = rustCount / totalPixels;
    double darkRatio = darkRotCount / totalPixels;

    List<double> scores = [0.15, 0.15, 0.15, 0.15, 0.15, 0.15];

    if (greenRatio > 0.35 && yellowRatio < 0.15 && rustRatio < 0.10) {
      scores[0] += 2.2 + (greenRatio * 2.0);
    }
    if (darkRatio > 0.18) {
      scores[1] += 1.8 + (darkRatio * 3.0);
    }
    if (yellowRatio > 0.20) {
      scores[2] += 2.0 + (yellowRatio * 3.5);
    }
    if (darkRatio > 0.25) {
      scores[3] += 1.9 + (darkRatio * 2.5);
    }
    if (rustRatio > 0.15) {
      scores[4] += 2.1 + (rustRatio * 4.0);
    }
    if (greenRatio > 0.15 && yellowRatio > 0.10) {
      scores[5] += 1.7;
    }

    // Softmax
    double maxScore = scores.reduce((a, b) => a > b ? a : b);
    List<double> expScores = scores.map((s) => (s - maxScore).abs() < 10 ? (s - maxScore) : 0.0).toList();
    List<double> expVals = scores.map((s) => (s >= maxScore - 5) ? 1.0 + (s - maxScore) : 0.2).toList();
    double sum = expVals.reduce((a, b) => a + b);
    List<double> probs = expVals.map((v) => v / sum).toList();

    return _formatOutput(probs, "On-Device Feature Analyzer");
  }

  TfliteResult _formatOutput(List<double> probs, String engine) {
    int maxIdx = 0;
    double maxProb = probs[0];
    for (int i = 1; i < probs.length; i++) {
      if (probs[i] > maxProb) {
        maxProb = probs[i];
        maxIdx = i;
      }
    }

    double confidencePct = (maxProb * 100.0).clamp(0.0, 100.0);
    confidencePct = double.parse(confidencePct.toStringAsFixed(1));

    String diseaseName = (maxIdx < _labels.length) ? _labels[maxIdx] : defaultClasses[maxIdx];

    Map<String, double> probMap = {};
    for (int i = 0; i < defaultClasses.length; i++) {
      String label = (i < _labels.length) ? _labels[i] : defaultClasses[i];
      double p = (i < probs.length) ? (probs[i] * 100.0) : 0.0;
      probMap[label] = double.parse(p.toStringAsFixed(1));
    }

    return TfliteResult(
      disease: diseaseName,
      confidence: confidencePct,
      probabilities: probMap,
      isLowConfidence: confidencePct < 60.0,
      engineMode: engine,
    );
  }
}
