import 'dart:async';
import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:provider/provider.dart';
import '../services/tflite_service.dart';
import '../services/database_service.dart';
import '../providers/app_settings_provider.dart';
import '../models/prediction_record.dart';
import 'result_screen.dart';

class LiveCameraScreen extends StatefulWidget {
  const LiveCameraScreen({Key? key}) : super(key: key);

  @override
  State<LiveCameraScreen> createState() => _LiveCameraScreenState();
}

class _LiveCameraScreenState extends State<LiveCameraScreen> with WidgetsBindingObserver {
  CameraController? _controller;
  List<CameraDescription> _cameras = [];
  int _selectedCameraIndex = 0;
  bool _isCameraInitialized = false;
  bool _isProcessingFrame = false;
  bool _isPermissionDenied = false;

  Timer? _inferenceTimer;
  String _selectedPart = 'auto'; // 'auto', 'leaf', 'nut', 'stem', 'root'

  // 5-Frame Smoothing Buffer
  final int _smoothWindow = 5;
  final List<TfliteResult> _frameBuffer = [];
  TfliteResult? _currentSmoothedResult;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _initCamera();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _inferenceTimer?.cancel();
    _controller?.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (_controller == null || !_controller!.value.isInitialized) return;
    if (state == AppLifecycleState.inactive) {
      _controller?.dispose();
    } else if (state == AppLifecycleState.resumed) {
      _initCamera();
    }
  }

  Future<void> _initCamera() async {
    try {
      _cameras = await availableCameras();
      if (_cameras.isEmpty) {
        setState(() => _isPermissionDenied = true);
        return;
      }

      // Prefer rear camera
      _selectedCameraIndex = _cameras.indexWhere(
        (c) => c.lensDirection == CameraLensDirection.back,
      );
      if (_selectedCameraIndex == -1) _selectedCameraIndex = 0;

      await _setupCameraController(_cameras[_selectedCameraIndex]);
    } catch (e) {
      setState(() => _isPermissionDenied = true);
    }
  }

  Future<void> _setupCameraController(CameraDescription description) async {
    final controller = CameraController(
      description,
      ResolutionPreset.medium,
      enableAudio: false,
      imageFormatGroup: ImageFormatGroup.jpeg,
    );

    _controller = controller;

    try {
      await controller.initialize();
      if (!mounted) return;

      setState(() {
        _isCameraInitialized = true;
        _isPermissionDenied = false;
      });

      // Start 1 frame/sec inference loop
      _startInferenceLoop();
    } catch (e) {
      setState(() => _isPermissionDenied = true);
    }
  }

  void _startInferenceLoop() {
    _inferenceTimer?.cancel();
    _inferenceTimer = Timer.periodic(const Duration(seconds: 1), (_) async {
      if (!_isCameraInitialized || _controller == null || !_controller!.value.isInitialized) return;
      if (_isProcessingFrame) return; // Skip frame if previous inference is still in-flight

      _isProcessingFrame = true;
      try {
        final XFile picture = await _controller!.takePicture();
        final Uint8List bytes = await picture.readAsBytes();

        final result = await TfliteService().classifyFrame(bytes, selectedPart: _selectedPart);

        if (mounted) {
          _applySmoothing(result);
        }

        // Clean up temporary photo
        final tmpFile = File(picture.path);
        if (await tmpFile.exists()) {
          await tmpFile.delete();
        }
      } catch (_) {
        // Frame dropped or busy
      } finally {
        _isProcessingFrame = false;
      }
    });
  }

  void _applySmoothing(TfliteResult raw) {
    _frameBuffer.add(raw);
    if (_frameBuffer.length > _smoothWindow) {
      _frameBuffer.removeAt(0);
    }

    // Majority vote on disease & part
    final Map<String, int> diseaseVotes = {};
    final Map<String, int> partVotes = {};
    double totalConf = 0;

    for (final f in _frameBuffer) {
      diseaseVotes[f.disease] = (diseaseVotes[f.disease] ?? 0) + 1;
      partVotes[f.part] = (partVotes[f.part] ?? 0) + 1;
      totalConf += f.confidence;
    }

    String topDisease = raw.disease;
    int maxDVotes = 0;
    diseaseVotes.forEach((k, v) {
      if (v > maxDVotes) {
        maxDVotes = v;
        topDisease = k;
      }
    });

    String topPart = raw.part;
    int maxPVotes = 0;
    partVotes.forEach((k, v) {
      if (v > maxPVotes) {
        maxPVotes = v;
        topPart = k;
      }
    });

    final smoothedConf = _frameBuffer.isNotEmpty ? (totalConf / _frameBuffer.length) : raw.confidence;

    setState(() {
      _currentSmoothedResult = TfliteResult(
        part: topPart,
        partConfidence: raw.partConfidence,
        disease: topDisease,
        confidence: double.parse(smoothedConf.toStringAsFixed(1)),
        probabilities: raw.probabilities,
        isLowConfidence: raw.isLowConfidence,
        severity: raw.severity,
        badgeColor: raw.badgeColor,
        dipFeatures: raw.dipFeatures,
        engineMode: raw.engineMode,
        statusMessage: '$topPart: $topDisease (${smoothedConf.toStringAsFixed(1)}%)',
      );
    });
  }

  Future<void> _switchCamera() async {
    if (_cameras.length <= 1) return;
    _selectedCameraIndex = (_selectedCameraIndex + 1) % _cameras.length;
    _isCameraInitialized = false;
    _inferenceTimer?.cancel();
    await _controller?.dispose();
    await _setupCameraController(_cameras[_selectedCameraIndex]);
  }

  Future<void> _captureAndSave() async {
    if (!_isCameraInitialized || _controller == null) return;
    _inferenceTimer?.cancel();

    try {
      final XFile picture = await _controller!.takePicture();
      final File savedImage = File(picture.path);

      // Run full DIP Pipeline classification on snapshot
      final result = await TfliteService().classifyImage(savedImage, selectedPart: _selectedPart);

      // Save to SQLite
      final record = PredictionRecord(
        imagePath: savedImage.path,
        disease: result.disease,
        confidence: result.confidence,
        timestamp: DateTime.now().toIso8601String(),
        notes: "Live Camera Snapshot (${result.part.toUpperCase()})",
      );
      await DatabaseService().insertPrediction(record);

      if (!mounted) return;
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => ResultScreen(imageFile: savedImage, tfliteResult: result),
        ),
      ).then((_) => _startInferenceLoop());
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Capture failed: $e")),
      );
      _startInferenceLoop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final settings = Provider.of<AppSettingsProvider>(context);
    final isKn = settings.languageCode == 'kn';

    if (_isPermissionDenied) {
      return Scaffold(
        appBar: AppBar(title: Text(isKn ? "ಲೈವ್ ಕ್ಯಾಮೆರಾ ಸ್ಕ್ಯಾನ್" : "Live Camera Scan")),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.videocam_off, size: 64, color: Colors.red),
                const SizedBox(height: 16),
                Text(
                  isKn ? "ಕ್ಯಾಮೆರಾ ಪ್ರವೇಶ ನಿರಾಕರಿಸಲಾಗಿದೆ" : "Camera Permission Denied",
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Text(
                  isKn
                      ? "ಲೈವ್ ರೋಗ ಪತ್ತೆ ಮಾಡಲು ದಯವಿಟ್ಟು ಆಪ್ ಸೆಟ್ಟಿಂಗ್ಸ್‌ನಲ್ಲಿ ಕ್ಯಾಮೆರಾ ಅನುಮತಿ ನೀಡಿ."
                      : "Please grant camera permission in your phone settings to enable live inspection.",
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.grey),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black.withOpacity(0.8),
        elevation: 0,
        title: Text(
          isKn ? "ಲೈವ್ ರೋಗ ಪತ್ತೆ (1 FPS)" : "Live Disease Scan (1 FPS)",
          style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.cameraswitch, color: Colors.white),
            tooltip: isKn ? "ಕ್ಯಾಮೆರಾ ಬದಲಿಸಿ" : "Flip Camera",
            onPressed: _switchCamera,
          ),
        ],
      ),
      body: Stack(
        fit: StackFit.expand,
        children: [
          // 1. Live Camera Preview
          if (_isCameraInitialized && _controller != null)
            CameraPreview(_controller!)
          else
            const Center(child: CircularProgressIndicator(color: Colors.green)),

          // 2. Targeting HUD Frame
          Center(
            child: Container(
              width: 250,
              height: 250,
              decoration: BoxDecoration(
                border: Border.all(color: Colors.greenAccent.withOpacity(0.6), width: 2),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Stack(
                children: [
                  Positioned(
                    top: 8,
                    left: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: Colors.black54,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        "DIP Frame: 224x224",
                        style: TextStyle(color: Colors.greenAccent[100], fontSize: 10, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // 3. Top Plant Part Selector Bar
          Positioned(
            top: 10,
            left: 0,
            right: 0,
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  _buildPartChip('auto', isKn ? 'ಆಟೋ' : 'Auto'),
                  _buildPartChip('leaf', isKn ? '🍃 ಎಲೆ' : '🍃 Leaf'),
                  _buildPartChip('nut', isKn ? '🥥 ಕಾಯಿ' : '🥥 Nut'),
                  _buildPartChip('stem', isKn ? '🪵 ಕಾಂಡ' : '🪵 Stem'),
                  _buildPartChip('root', isKn ? '🌱 ಬೇರು' : '🌱 Root'),
                ],
              ),
            ),
          ),

          // 4. Real-Time Diagnosis HUD Overlay Badge
          if (_currentSmoothedResult != null)
            Positioned(
              top: 65,
              left: 16,
              right: 16,
              child: _buildResultOverlayBadge(_currentSmoothedResult!, isKn),
            ),

          // 5. Bottom Control Dock (Capture Snapshot)
          Positioned(
            bottom: 24,
            left: 0,
            right: 0,
            child: Center(
              child: FloatingActionButton.extended(
                backgroundColor: Colors.green[700],
                onPressed: _captureAndSave,
                icon: const Icon(Icons.camera_alt, color: Colors.white),
                label: Text(
                  isKn ? "ಸೆರೆಹಿಡಿದು ಉಳಿಸಿ" : "Capture & Save",
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPartChip(String partKey, String label) {
    final isSelected = _selectedPart == partKey;
    return Padding(
      padding: const EdgeInsets.only(right: 8.0),
      child: ChoiceChip(
        label: Text(label),
        selected: isSelected,
        selectedColor: Colors.green[700],
        backgroundColor: Colors.black54,
        labelStyle: TextStyle(
          color: isSelected ? Colors.white : Colors.white70,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          fontSize: 12,
        ),
        onSelected: (val) {
          if (val) {
            setState(() {
              _selectedPart = partKey;
              _frameBuffer.clear();
            });
          }
        },
      ),
    );
  }

  Widget _buildResultOverlayBadge(TfliteResult res, bool isKn) {
    // If not arecanut or low confidence
    if (!res.isValidArecanut) {
      return Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.amber[900]?.withOpacity(0.85),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.amberAccent),
        ),
        child: Row(
          children: [
            const Icon(Icons.warning_amber_rounded, color: Colors.white, size: 24),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                isKn ? "ಅಡಿಕೆ ಭಾಗ ಪತ್ತೆಯಾಗಿಲ್ಲ, ದಯವಿಟ್ಟು ಹತ್ತಿರ ತೋರಿಸಿ" : "No arecanut part detected, move closer or improve lighting",
                style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
      );
    }

    Color badgeColor = Colors.green;
    if (res.badgeColor == 'orange') badgeColor = Colors.orange;
    if (res.badgeColor == 'red') badgeColor = Colors.red;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.85),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: badgeColor, width: 1.5),
        boxShadow: [
          BoxShadow(color: badgeColor.withOpacity(0.3), blurRadius: 10),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: badgeColor.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        res.part.toUpperCase(),
                        style: TextStyle(color: badgeColor, fontSize: 10, fontWeight: FontWeight.bold),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      "${res.confidence}%",
                      style: const TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  res.disease,
                  style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold),
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: badgeColor,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              res.severity.toUpperCase(),
              style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.extrabold),
            ),
          ),
        ],
      ),
    );
  }
}
