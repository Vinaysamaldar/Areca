"""
Arecanut Plant Disease Detection - MobileNetV2 Transfer Learning Training Script
Project: Engineering Mini Project
Classes:
  0: Healthy
  1: Koleroga (Fruit Rot)
  2: Yellow Leaf Disease
  3: Bud Rot
  4: Stem Bleeding
  5: Leaf Spot
"""

import os
import argparse
import matplotlib.pyplot as plt

try:
    import tensorflow as tf
    from tensorflow.keras import layers, models, optimizers, callbacks
    from tensorflow.keras.applications import MobileNetV2
    from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
except ImportError:
    print("[ERROR] TensorFlow is required to run train_model.py.")
    print("Please install TensorFlow: pip install tensorflow")
    exit(1)

CLASSES = [
    "Healthy",
    "Koleroga (Fruit Rot)",
    "Yellow Leaf Disease",
    "Bud Rot",
    "Stem Bleeding",
    "Leaf Spot"
]

IMG_SIZE = (224, 224)
BATCH_SIZE = 32
INITIAL_EPOCHS = 15
FINE_TUNE_EPOCHS = 10
NUM_CLASSES = len(CLASSES)

def build_model(num_classes=6):
    """Builds MobileNetV2 Transfer Learning Model."""
    # Data Augmentation pipeline
    data_augmentation = tf.keras.Sequential([
        layers.RandomFlip("horizontal_and_vertical"),
        layers.RandomRotation(0.2),
        layers.RandomZoom(0.15),
        layers.RandomContrast(0.1)
    ], name="data_augmentation")

    # Base pretrained model
    base_model = MobileNetV2(
        input_shape=(224, 224, 3),
        include_top=False,
        weights='imagenet'
    )
    base_model.trainable = False  # Freeze base layers initially

    # Assemble architecture
    inputs = layers.Input(shape=(224, 224, 3))
    x = data_augmentation(inputs)
    x = preprocess_input(x)
    x = base_model(x, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dense(256, activation='relu')(x)
    x = layers.Dropout(0.4)(x)
    outputs = layers.Dense(num_classes, activation='softmax', name="predictions")(x)

    model = models.Model(inputs=inputs, outputs=outputs, name="Arecanut_MobileNetV2")
    return model, base_model

def plot_history(history, fine_history=None, output_path="training_history.png"):
    acc = history.history.get('accuracy', [])
    val_acc = history.history.get('val_accuracy', [])
    loss = history.history.get('loss', [])
    val_loss = history.history.get('val_loss', [])

    if fine_history:
        acc += fine_history.history.get('accuracy', [])
        val_acc += fine_history.history.get('val_accuracy', [])
        loss += fine_history.history.get('loss', [])
        val_loss += fine_history.history.get('val_loss', [])

    plt.figure(figsize=(12, 5))

    plt.subplot(1, 2, 1)
    plt.plot(acc, label='Training Accuracy', color='#15803d')
    plt.plot(val_acc, label='Validation Accuracy', color='#2563eb')
    plt.title('Model Accuracy')
    plt.xlabel('Epoch')
    plt.ylabel('Accuracy')
    plt.legend()
    plt.grid(True)

    plt.subplot(1, 2, 2)
    plt.plot(loss, label='Training Loss', color='#b91c1c')
    plt.plot(val_loss, label='Validation Loss', color='#d97706')
    plt.title('Model Loss')
    plt.xlabel('Epoch')
    plt.ylabel('Loss')
    plt.legend()
    plt.grid(True)

    plt.tight_layout()
    plt.savefig(output_path, dpi=300)
    print(f"[INFO] Training plots saved to {output_path}")

def main():
    parser = argparse.ArgumentParser(description="Train MobileNetV2 on Arecanut disease dataset")
    parser.add_argument("--data_dir", type=str, default="./dataset", help="Path to dataset root folder containing subfolders for each class")
    parser.add_argument("--epochs", type=int, default=15, help="Number of initial epochs")
    parser.add_argument("--output_model", type=str, default="model.h5", help="Output model filename")
    args = parser.parse_args()

    if not os.path.exists(args.data_dir):
        print(f"[ERROR] Dataset directory '{args.data_dir}' not found.")
        print("Please structure your dataset as:")
        print("  dataset/")
        for c in CLASSES:
            print(f"    {c}/ (contains .jpg / .png images)")
        return

    print("[INFO] Loading datasets from directory...")
    train_ds = tf.keras.preprocessing.image_dataset_from_directory(
        args.data_dir,
        validation_split=0.2,
        subset="training",
        seed=123,
        image_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        label_mode='categorical'
    )

    val_ds = tf.keras.preprocessing.image_dataset_from_directory(
        args.data_dir,
        validation_split=0.2,
        subset="validation",
        seed=123,
        image_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        label_mode='categorical'
    )

    # Prefetch for performance
    AUTOTUNE = tf.data.AUTOTUNE
    train_ds = train_ds.cache().shuffle(1000).prefetch(buffer_size=AUTOTUNE)
    val_ds = val_ds.cache().prefetch(buffer_size=AUTOTUNE)

    # Build model
    model, base_model = build_model(num_classes=NUM_CLASSES)
    model.summary()

    # Compile phase 1: Transfer learning feature extraction
    model.compile(
        optimizer=optimizers.Adam(learning_rate=1e-3),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )

    cb_list = [
        callbacks.EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True),
        callbacks.ReduceLROnPlateau(monitor='val_loss', factor=0.2, patience=3, min_lr=1e-6),
        callbacks.ModelCheckpoint(args.output_model, monitor='val_accuracy', save_best_only=True)
    ]

    print(f"\n[INFO] Starting Phase 1 Training for {args.epochs} epochs...")
    history = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=args.epochs,
        callbacks=cb_list
    )

    # Phase 2: Fine-Tuning top layers of MobileNetV2
    print("\n[INFO] Starting Phase 2: Fine-tuning top 30 layers...")
    base_model.trainable = True
    for layer in base_model.layers[:-30]:
        layer.trainable = False

    model.compile(
        optimizer=optimizers.Adam(learning_rate=1e-5),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )

    fine_history = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=FINE_TUNE_EPOCHS,
        callbacks=cb_list
    )

    # Save final model
    model.save(args.output_model)
    print(f"\n[SUCCESS] Final model successfully saved to '{args.output_model}'!")

    plot_history(history, fine_history)

if __name__ == '__main__':
    main()
