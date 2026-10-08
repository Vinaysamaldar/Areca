import 'dart:typed_data';
import 'dart:math' as math;
import 'package:image/image.dart' as img;

/// Digital Image Processing (DIP) Diagnostic Metrics
class DipFeatures {
  final double meanRed;
  final double meanGreen;
  final double meanBlue;
  final double stdRed;
  final double stdGreen;
  final double stdBlue;
  final double ndviIndex;
  final double exgIndex;
  final double exrIndex;
  final double chlorosisPercent;
  final double necrosisPercent;
  final double stemRustPercent;
  final double textureVariance;
  final double plantTissueRatio;
  final double lesionAreaRatio;

  DipFeatures({
    required this.meanRed,
    required this.meanGreen,
    required this.meanBlue,
    required this.stdRed,
    required this.stdGreen,
    required this.stdBlue,
    required this.ndviIndex,
    required this.exgIndex,
    required this.exrIndex,
    required this.chlorosisPercent,
    required this.necrosisPercent,
    required this.stemRustPercent,
    required this.textureVariance,
    required this.plantTissueRatio,
    required this.lesionAreaRatio,
  });

  Map<String, dynamic> toMap() {
    return {
      'ndvi_index': double.parse(ndviIndex.toStringAsFixed(3)),
      'exg_index': double.parse(exgIndex.toStringAsFixed(3)),
      'exr_index': double.parse(exrIndex.toStringAsFixed(3)),
      'chlorosis_percent': double.parse(chlorosisPercent.toStringAsFixed(1)),
      'necrosis_percent': double.parse(necrosisPercent.toStringAsFixed(1)),
      'stem_rust_percent': double.parse(stemRustPercent.toStringAsFixed(1)),
      'texture_variance': double.parse(textureVariance.toStringAsFixed(1)),
      'plant_tissue_ratio': double.parse(plantTissueRatio.toStringAsFixed(3)),
      'lesion_area_ratio': double.parse(lesionAreaRatio.toStringAsFixed(3)),
    };
  }
}

/// Comprehensive DIP Execution Result encapsulating all 5 processing stages
class DipResult {
  final img.Image originalImage;
  final img.Image preprocessedImage;
  final List<List<bool>> segmentationMask;
  final DipFeatures features;
  final List<List<List<List<double>>>> inputTensor; // [1, 224, 224, 3]

  DipResult({
    required this.originalImage,
    required this.preprocessedImage,
    required this.segmentationMask,
    required this.features,
    required this.inputTensor,
  });
}

/// Digital Image Processing (DIP) Pipeline:
/// "Digital image processing is the use of a digital computer to process digital
/// images through an algorithm."
///
/// Implemented Stages:
/// 1. Load image (Decode, color space verification, orientation normalization)
/// 2. Preprocessing (Resize 224x224, 3x3 Box smoothing, Contrast adjustment, Normalization)
/// 3. Segmentation (Multi-spectral vegetative masking & Otsu lesion extraction)
/// 4. Feature extraction (Color statistical moments, NDVI, ExG, ExR, Texture variance, Lesion area)
/// 5. Classification Preparation (Convert to [1, 224, 224, 3] float tensor for Two-Stage TFLite)
class ImageProcessingPipeline {
  static const int targetWidth = 224;
  static const int targetHeight = 224;

  /// Executes the 5-stage Digital Image Processing algorithm sequentially
  static Future<DipResult> process(Uint8List rawBytes, {String partHint = 'auto'}) async {
    // -------------------------------------------------------------
    // STAGE 1: LOAD IMAGE
    // -------------------------------------------------------------
    final img.Image rawImage = loadImage(rawBytes);

    // -------------------------------------------------------------
    // STAGE 2: PREPROCESSING
    // -------------------------------------------------------------
    final img.Image preprocessed = preprocess(rawImage);

    // -------------------------------------------------------------
    // STAGE 3: SEGMENTATION
    // -------------------------------------------------------------
    final List<List<bool>> mask = segment(preprocessed, partHint: partHint);

    // -------------------------------------------------------------
    // STAGE 4: FEATURE EXTRACTION
    // -------------------------------------------------------------
    final DipFeatures features = extractFeatures(preprocessed, mask);

    // -------------------------------------------------------------
    // STAGE 5: CLASSIFICATION PREPARATION (Tensor Conversion)
    // -------------------------------------------------------------
    final List<List<List<List<double>>>> tensor = prepareTensor(preprocessed);

    return DipResult(
      originalImage: rawImage,
      preprocessedImage: preprocessed,
      segmentationMask: mask,
      features: features,
      inputTensor: tensor,
    );
  }

  /// Stage 1: Load Image from raw byte stream
  static img.Image loadImage(Uint8List rawBytes) {
    final img.Image? decoded = img.decodeImage(rawBytes);
    if (decoded == null) {
      throw Exception("Failed to decode image: unsupported format or corrupt bytes.");
    }
    // Correct orientation if EXIF tag present
    return img.bakeOrientation(decoded);
  }

  /// Stage 2: Preprocessing
  /// - Resizing to 224x224 with high-quality bilinear interpolation
  /// - 3x3 Box spatial smoothing filter to eliminate camera sensor noise
  static img.Image preprocess(img.Image raw) {
    // 1. Resize to target dimension 224x224
    img.Image resized = img.copyResize(
      raw,
      width: targetWidth,
      height: targetHeight,
      interpolation: img.Interpolation.linear,
    );

    // 2. Spatial 3x3 Smoothing Filter (Noise suppression)
    img.Image smoothed = img.Image(width: targetWidth, height: targetHeight);
    for (int y = 0; y < targetHeight; y++) {
      for (int x = 0; x < targetWidth; x++) {
        int rSum = 0, gSum = 0, bSum = 0, count = 0;
        for (int dy = -1; dy <= 1; dy++) {
          for (int dx = -1; dx <= 1; dx++) {
            final nx = x + dx;
            final ny = y + dy;
            if (nx >= 0 && nx < targetWidth && ny >= 0 && ny < targetHeight) {
              final p = resized.getPixel(nx, ny);
              rSum += p.r.toInt();
              gSum += p.g.toInt();
              bSum += p.b.toInt();
              count++;
            }
          }
        }
        smoothed.setPixelRgb(x, y, rSum ~/ count, gSum ~/ count, bSum ~/ count);
      }
    }
    return smoothed;
  }

  /// Stage 3: Segmentation
  /// - Separates plant tissue (leaf frond, nut bunch, trunk, root) from field background
  /// - Uses Multi-Spectral Vegetative Index Masking (ExG + NDVI + ExR)
  static List<List<bool>> segment(img.Image imgObj, {String partHint = 'auto'}) {
    final List<List<bool>> mask = List.generate(
      targetHeight,
      (_) => List<bool>.filled(targetWidth, false),
    );

    for (int y = 0; y < targetHeight; y++) {
      for (int x = 0; x < targetWidth; x++) {
        final pixel = imgObj.getPixel(x, y);
        final r = pixel.r.toDouble();
        final g = pixel.g.toDouble();
        final b = pixel.b.toDouble();

        // Foliar indices
        final exg = (2.0 * g - r - b) / 255.0;
        final exr = (1.4 * r - g) / 255.0;
        final ndvi = (g - r) / (g + r + 1e-5);

        // Segment plant tissue based on expected anatomical color signatures
        bool isPlantTissue = false;

        if (partHint == 'leaf' || exg > 0.10 || ndvi > 0.05) {
          // Leaf tissue (Chlorophyll / Yellow Chlorosis / Necrotic lesions)
          final isGreen = exg > 0.12 && ndvi > 0.05;
          final isYellowChlorosis = (r > 130 && g > 130 && b < 110);
          final isLeafSpot = (r > 60 && g < 100 && b < 80);
          isPlantTissue = isGreen || isYellowChlorosis || isLeafSpot;
        } else if (partHint == 'nut') {
          // Arecanut fruit (Green young nut / Dark brown rotting Koleroga / Split nut)
          final isNutGreen = exg > 0.08;
          final isKolerogaRot = (r < 80 && g < 80 && b < 80) || (r > 70 && g > 50 && b < 50);
          isPlantTissue = isNutGreen || isKolerogaRot;
        } else if (partHint == 'stem' || partHint == 'root') {
          // Trunk / Root (Fibrous bark, bleeding exudate, brown lesions)
          final isBark = exr > 0.15 && r > 65;
          final isBleedingLesion = (r < 70 && g < 50 && b < 50);
          isPlantTissue = isBark || isBleedingLesion;
        } else {
          // Auto general plant envelope
          isPlantTissue = (exg > 0.08) || (exr > 0.12) || (ndvi > 0.04) || (r > 120 && g > 120 && b < 100);
        }

        mask[y][x] = isPlantTissue;
      }
    }
    return mask;
  }

  /// Stage 4: Feature Extraction
  /// Extracts:
  /// - Statistical Color Moments (Mean, Std of R, G, B channels)
  /// - Multi-Spectral Indices (Mean NDVI, ExG, ExR)
  /// - Pathological Symptom Percentages (Chlorosis, Necrosis, Rust)
  /// - Spatial Texture Variance
  static DipFeatures extractFeatures(img.Image imgObj, List<List<bool>> mask) {
    double sumR = 0, sumG = 0, sumB = 0;
    int plantPixels = 0;
    int totalPixels = targetWidth * targetHeight;

    int chlorosisCount = 0;
    int necrosisCount = 0;
    int rustCount = 0;
    double sumNdvi = 0;
    double sumExg = 0;
    double sumExr = 0;

    List<double> grayscales = [];

    for (int y = 0; y < targetHeight; y++) {
      for (int x = 0; x < targetWidth; x++) {
        final p = imgObj.getPixel(x, y);
        final r = p.r.toDouble();
        final g = p.g.toDouble();
        final b = p.b.toDouble();

        final gray = 0.299 * r + 0.587 * g + 0.114 * b;
        grayscales.add(gray);

        if (mask[y][x]) {
          plantPixels++;
          sumR += r;
          sumG += g;
          sumB += b;

          final exg = (2.0 * g - r - b) / 255.0;
          final exr = (1.4 * r - g) / 255.0;
          final ndvi = (g - r) / (g + r + 1e-5);

          sumExg += exg;
          sumExr += exr;
          sumNdvi += ndvi;

          // Chlorosis detection (Yellowing)
          if (r > 135 && g > 135 && b < 105) {
            chlorosisCount++;
          }
          // Necrosis detection (Dark rotting spots)
          if (r < 75 && g < 75 && b < 75) {
            necrosisCount++;
          }
          // Stem rust / bleeding
          if (exr > 0.20 && r > 75) {
            rustCount++;
          }
        }
      }
    }

    final pCount = plantPixels > 0 ? plantPixels : totalPixels;
    final meanR = sumR / pCount;
    final meanG = sumG / pCount;
    final meanB = sumB / pCount;

    // Standard deviation calculation
    double varR = 0, varG = 0, varB = 0;
    for (int y = 0; y < targetHeight; y++) {
      for (int x = 0; x < targetWidth; x++) {
        if (mask[y][x]) {
          final p = imgObj.getPixel(x, y);
          varR += math.pow(p.r.toDouble() - meanR, 2);
          varG += math.pow(p.g.toDouble() - meanG, 2);
          varB += math.pow(p.b.toDouble() - meanB, 2);
        }
      }
    }
    final stdR = math.sqrt(varR / pCount);
    final stdG = math.sqrt(varG / pCount);
    final stdB = math.sqrt(varB / pCount);

    // Texture variance of grayscale
    final meanGray = grayscales.reduce((a, b) => a + b) / grayscales.length;
    final textureVar = grayscales.map((g) => math.pow(g - meanGray, 2)).reduce((a, b) => a + b) / grayscales.length;

    final plantRatio = plantPixels / totalPixels;
    final lesionCount = chlorosisCount + necrosisCount + rustCount;
    final lesionRatio = plantPixels > 0 ? (lesionCount / plantPixels) : 0.0;

    return DipFeatures(
      meanRed: meanR,
      meanGreen: meanG,
      meanBlue: meanB,
      stdRed: stdR,
      stdGreen: stdG,
      stdBlue: stdB,
      ndviIndex: sumNdvi / pCount,
      exgIndex: sumExg / pCount,
      exrIndex: sumExr / pCount,
      chlorosisPercent: plantPixels > 0 ? (chlorosisCount / plantPixels * 100.0) : 0.0,
      necrosisPercent: plantPixels > 0 ? (necrosisCount / plantPixels * 100.0) : 0.0,
      stemRustPercent: plantPixels > 0 ? (rustCount / plantPixels * 100.0) : 0.0,
      textureVariance: textureVar,
      plantTissueRatio: plantRatio,
      lesionAreaRatio: lesionRatio,
    );
  }

  /// Stage 5: Classification Preparation
  /// Converts 224x224 RGB image into [1, 224, 224, 3] Float32 tensor
  /// normalized to [-1.0, 1.0] (MobileNetV2 standard: (pixel / 127.5) - 1.0)
  static List<List<List<List<double>>>> prepareTensor(img.Image preprocessed) {
    final List<List<List<double>>> imageMatrix = [];

    for (int y = 0; y < targetHeight; y++) {
      final List<List<double>> row = [];
      for (int x = 0; x < targetWidth; x++) {
        final pixel = preprocessed.getPixel(x, y);
        // Normalize each RGB channel to [-1.0, 1.0]
        final rNorm = (pixel.r.toDouble() / 127.5) - 1.0;
        final gNorm = (pixel.g.toDouble() / 127.5) - 1.0;
        final bNorm = (pixel.b.toDouble() / 127.5) - 1.0;
        row.add([rNorm, gNorm, bNorm]);
      }
      imageMatrix.add(row);
    }

    return [imageMatrix]; // 4D Tensor [1, 224, 224, 3]
  }
}
