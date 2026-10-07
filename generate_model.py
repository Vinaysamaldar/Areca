"""
Quick Model Generator Script
Constructs a MobileNetV2 architecture with the 6 Arecanut classes and saves it as model.h5
"""
import os
try:
    import tensorflow as tf
    from tensorflow.keras import layers, models
    from tensorflow.keras.applications import MobileNetV2

    def create_and_save():
        print("[INFO] Building MobileNetV2 model architecture...")
        base = MobileNetV2(input_shape=(224, 224, 3), include_top=False, weights='imagenet')
        base.trainable = False

        inputs = layers.Input(shape=(224, 224, 3))
        x = base(inputs, training=False)
        x = layers.GlobalAveragePooling2D()(x)
        x = layers.Dense(128, activation='relu')(x)
        outputs = layers.Dense(6, activation='softmax')(x)

        model = models.Model(inputs, outputs, name="Arecanut_QuickModel")
        model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])

        out_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'model.h5')
        model.save(out_path)
        print(f"[SUCCESS] Generated model.h5 saved at: {out_path}")

    if __name__ == '__main__':
        create_and_save()
except ImportError:
    print("[NOTE] TensorFlow is not installed in current environment.")
    print("app.py will automatically run its built-in Computer Vision heuristic engine until TensorFlow and model.h5 are ready.")
