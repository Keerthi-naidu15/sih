import json
import os
import sys

import numpy as np
import torch
import torch.nn as nn
from PIL import Image

os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(_DIR, "final_model.pth")
CLASS_PATH = os.path.join(_DIR, "class_indices.json")
IMG_SIZE = (128, 128)


class CNNClassifier(nn.Module):
    def __init__(self, num_classes: int):
        super().__init__()

        self.conv_layers = nn.Sequential(
            nn.Conv2d(3, 32, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.BatchNorm2d(32),
            nn.MaxPool2d(2),
            nn.Conv2d(32, 64, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.BatchNorm2d(64),
            nn.MaxPool2d(2),
            nn.Conv2d(64, 128, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.BatchNorm2d(128),
            nn.MaxPool2d(2),
            nn.Conv2d(128, 256, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.BatchNorm2d(256),
            nn.MaxPool2d(2),
        )

        self.fc_layers = nn.Sequential(
            nn.Dropout(0.5),
            nn.Linear(256 * 8 * 8, 512),
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(512, num_classes),
        )

    def forward(self, x):
        x = self.conv_layers(x)
        x = x.view(x.size(0), -1)
        x = self.fc_layers(x)
        return x

TREATMENTS = {
    "healthy": "Your plant looks healthy. Keep up regular watering, balanced nutrition, and routine pest checks.",
    "bacterial_spot": "Remove badly affected leaves, avoid overhead watering, and use a copper-based spray if the spread continues.",
    "early_blight": "Prune infected leaves, improve airflow, and apply a recommended fungicide before the infection spreads.",
    "late_blight": "Isolate the plant, remove infected foliage quickly, and use a blight-targeted fungicide as soon as possible.",
    "leaf_mold": "Reduce humidity around the crop, improve ventilation, and remove infected leaves.",
    "powdery_mildew": "Trim affected areas, reduce excess moisture, and apply a mildew treatment suitable for the crop.",
    "rust": "Remove infected leaves and monitor the crop closely. A fungicide may be needed if symptoms expand.",
    "scab": "Clear infected debris, avoid splashing water on leaves, and use preventive fungicide support if needed.",
    "mosaic_virus": "Remove infected plants where possible and disinfect tools to reduce virus spread between crops.",
    "yellow_leaf_curl_virus": "Control whiteflies, isolate infected plants, and remove heavily affected leaves promptly.",
    "default": "Consult a local agricultural expert for a crop-specific treatment plan and monitor the plant over the next few days."
}


def load_assets():
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            f"Model file not found at {MODEL_PATH}. Place your trained PyTorch checkpoint there as final_model.pth."
        )
    if not os.path.exists(CLASS_PATH):
        raise FileNotFoundError(f"Class index file not found at {CLASS_PATH}")

    with open(CLASS_PATH, "r", encoding="utf-8") as file:
        class_indices = json.load(file)

    num_classes = len(class_indices)
    model = CNNClassifier(num_classes=num_classes)

    checkpoint = torch.load(MODEL_PATH, map_location="cpu")
    if isinstance(checkpoint, dict) and "state_dict" in checkpoint:
        checkpoint = checkpoint["state_dict"]

    model.load_state_dict(checkpoint)
    model.eval()

    return model, class_indices


try:
    MODEL, CLASS_INDICES = load_assets()
except Exception as exc:
    print(json.dumps({"error": f"Model initialization failed: {str(exc)}"}))
    sys.exit(1)


def load_and_preprocess_image(image_path: str):
    image = Image.open(image_path).convert("RGB")
    image = image.resize(IMG_SIZE)
    image_array = np.array(image).astype("float32") / 255.0
    image_array = np.transpose(image_array, (2, 0, 1))
    image_array = np.expand_dims(image_array, axis=0)
    return torch.from_numpy(image_array)


def split_label(raw_class: str):
    try:
        plant, disease = raw_class.split("___", 1)
    except ValueError:
        humanized = raw_class.replace("_", " ").strip()
        return humanized, ""

    return plant.replace("_", " "), disease.replace("_", " ")


def format_name(raw_class: str) -> str:
    plant, disease = split_label(raw_class)
    if not disease:
        return plant.title()
    if disease.lower() == "healthy":
        return f"{plant.title()} (Healthy)"
    return f"{plant} - {disease}"


def get_treatment(raw_class: str) -> str:
    normalized = raw_class.lower()
    if "healthy" in normalized:
        return TREATMENTS["healthy"]

    for key, message in TREATMENTS.items():
        if key != "default" and key in normalized:
            return message

    return TREATMENTS["default"]


def predict(image_path: str) -> dict:
    try:
        preprocessed_image = load_and_preprocess_image(image_path)
        with torch.no_grad():
            logits = MODEL(preprocessed_image)
            probabilities = torch.softmax(logits, dim=1).cpu().numpy()[0]

        predicted_index = int(np.argmax(probabilities))
        raw_class = CLASS_INDICES[str(predicted_index)]
        plant, _ = split_label(raw_class)

        return {
            "plant": plant,
            "disease": format_name(raw_class),
            "raw_class": raw_class,
            "confidence": round(float(np.max(probabilities)) * 100, 2),
            "treatment": get_treatment(raw_class)
        }
    except Exception as exc:
        return {"error": f"Prediction error: {str(exc)}"}


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No image path provided"}))
        sys.exit(1)

    image_path = sys.argv[1]
    if not os.path.exists(image_path):
        print(json.dumps({"error": f"Image not found: {image_path}"}))
        sys.exit(1)

    print(json.dumps(predict(image_path)))
