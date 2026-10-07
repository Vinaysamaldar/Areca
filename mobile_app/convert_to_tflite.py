"""
Keras to TensorFlow Lite Model Converter Script
Converts trained 'model.h5' (MobileNetV2) into an optimized 'model.tflite' for Android on-device inference.
"""

import os
import argparse

try:
    import tensorflow as tf
except ImportError:
    print("[ERROR] TensorFlow is required for model conversion.")
    print("Please install: pip install tensorflow")
    exit(1)

def convert_h5_to_tflite(input_model_path="model.h5", output_tflite_path="assets/model.tflite", quantize=True):
    if not os.path.exists(input_model_path):
        print(f"[ERROR] Source model not found: {input_model_path}")
        print("Please train your model using train_model.py or generate it first.")
        return False

    print(f"[1/4] Loading Keras model from: {input_model_path}...")
    model = tf.keras.models.load_model(input_model_path)
    print("      Model loaded successfully!")

    print("[2/4] Initializing TensorFlow Lite Converter...")
    converter = tf.lite.TFLiteConverter.from_keras_model(model)

    if quantize:
        print("[3/4] Applying Float16 / Dynamic Range Optimization (Quantization)...")
        converter.optimizations = [tf.lite.Optimize.DEFAULT]
        # Optional: converter.target_spec.supported_types = [tf.float16]

    print("[4/4] Converting to TFLite FlatBuffer format...")
    tflite_model = converter.convert()

    os.makedirs(os.path.dirname(os.path.abspath(output_tflite_path)), exist_ok=True)
    with open(output_tflite_path, "wb") as f:
        f.write(tflite_model)

    size_mb = os.path.getsize(output_tflite_path) / (1024 * 1024)
    print(f"\n[SUCCESS] Saved TFLite model to: {output_tflite_path}")
    print(f"          Model File Size: {size_mb:.2f} MB")

    # Verify input & output details
    interpreter = tf.lite.Interpreter(model_path=output_tflite_path)
    interpreter.allocate_tensors()
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()

    print("\n--- Model Verification ---")
    print(f"Input Tensor Shape:  {input_details[0]['shape']}  (Expected: [1, 224, 224, 3])")
    print(f"Input Data Type:     {input_details[0]['dtype']}")
    print(f"Output Tensor Shape: {output_details[0]['shape']} (Expected: [1, 6])")
    print(f"Output Data Type:    {output_details[0]['dtype']}")
    print("--------------------------\n")
    return True

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Convert Keras model.h5 to TFLite")
    parser.add_argument("--input", default="../model.h5", help="Path to input .h5 model file")
    parser.add_argument("--output", default="assets/model.tflite", help="Path to save .tflite model")
    parser.add_argument("--no-quant", action="store_true", help="Disable quantization optimization")
    args = parser.parse_args()

    # Look for model in current directory, parent directory or specified path
    candidate_paths = [args.input, "model.h5", "../model.h5"]
    model_to_use = None
    for p in candidate_paths:
        if os.path.exists(p):
            model_to_use = p
            break

    if not model_to_use:
        model_to_use = args.input

    convert_h5_to_tflite(model_to_use, args.output, quantize=not args.no_quant)
