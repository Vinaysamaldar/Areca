"""
Keras to TensorFlow Lite Dual-Model Converter Script
Converts:
  1. 'part_model.h5' -> 'assets/part_model.tflite' (Model A: Leaf, Nut, Stem, Root, Not-Areca)
  2. 'disease_model.h5' -> 'assets/disease_model.tflite' (Model B: 10 Disease & Health Classes)
Applies Float16 dynamic range quantization to keep models small (~12-14 MB).
"""

import os
import argparse

try:
    import tensorflow as tf
except ImportError:
    print("[ERROR] TensorFlow is required for model conversion.")
    print("Please install: pip install tensorflow")
    exit(1)

def build_part_model():
    """Builds MobileNetV2 architecture for Part classification (5 classes)"""
    base = tf.keras.applications.MobileNetV2(
        input_shape=(224, 224, 3), include_top=False, weights='imagenet'
    )
    x = tf.keras.layers.GlobalAveragePooling2D()(base.output)
    x = tf.keras.layers.Dense(128, activation='relu')(x)
    x = tf.keras.layers.Dropout(0.3)(x)
    output = tf.keras.layers.Dense(5, activation='softmax', name='part_output')(x)
    return tf.keras.Model(inputs=base.input, outputs=output, name='Arecanut_Part_Classifier')

def build_disease_model():
    """Builds MobileNetV2 architecture for Disease classification (10 classes)"""
    base = tf.keras.applications.MobileNetV2(
        input_shape=(224, 224, 3), include_top=False, weights='imagenet'
    )
    x = tf.keras.layers.GlobalAveragePooling2D()(base.output)
    x = tf.keras.layers.Dense(256, activation='relu')(x)
    x = tf.keras.layers.Dropout(0.3)(x)
    output = tf.keras.layers.Dense(10, activation='softmax', name='disease_output')(x)
    return tf.keras.Model(inputs=base.input, outputs=output, name='Arecanut_Disease_Classifier')

def convert_model_to_tflite(model, output_path, quantize=True):
    print(f"[CONVERT] Converting {model.name} to {output_path}...")
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    if quantize:
        converter.optimizations = [tf.lite.Optimize.DEFAULT]
        converter.target_spec.supported_types = [tf.float16]
    
    tflite_bytes = converter.convert()
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    with open(output_path, 'wb') as f:
        f.write(tflite_bytes)
    
    size_mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f"[SUCCESS] Saved {output_path} ({size_mb:.2f} MB)")

def convert_all(assets_dir="assets", quantize=True):
    # 1. Part Model
    part_h5 = "part_model.h5" if os.path.exists("part_model.h5") else "../part_model.h5"
    if os.path.exists(part_h5):
        print(f"Loading {part_h5}...")
        model_part = tf.keras.models.load_model(part_h5)
    else:
        print("[INFO] Creating MobileNetV2 Part Classifier architecture...")
        model_part = build_part_model()
    convert_model_to_tflite(model_part, os.path.join(assets_dir, "part_model.tflite"), quantize)

    # 2. Disease Model
    dis_h5 = "disease_model.h5" if os.path.exists("disease_model.h5") else ("model.h5" if os.path.exists("model.h5") else "../disease_model.h5")
    if os.path.exists(dis_h5):
        print(f"Loading {dis_h5}...")
        model_disease = tf.keras.models.load_model(dis_h5)
    else:
        print("[INFO] Creating MobileNetV2 Disease Classifier architecture...")
        model_disease = build_disease_model()
    convert_model_to_tflite(model_disease, os.path.join(assets_dir, "disease_model.tflite"), quantize)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Convert Dual Models to TFLite")
    parser.add_argument("--assets", default="assets", help="Assets destination folder")
    parser.add_argument("--no-quant", action="store_true", help="Disable FP16 quantization")
    args = parser.parse_args()

    convert_all(assets_dir=args.assets, quantize=not args.no_quant)
