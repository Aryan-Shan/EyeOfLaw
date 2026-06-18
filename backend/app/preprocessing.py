import cv2
import numpy as np
import logging

logger = logging.getLogger("preprocessing")
logger.setLevel(logging.INFO)

def apply_clahe(img, clip_limit=2.0, grid_size=(8, 8)):
    """Applies Contrast Limited Adaptive Histogram Equalization to the L channel of LAB color space."""
    try:
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=grid_size)
        cl = clahe.apply(l)
        lab_enhanced = cv2.merge((cl, a, b))
        return cv2.cvtColor(lab_enhanced, cv2.COLOR_LAB2BGR)
    except Exception as e:
        logger.error(f"CLAHE failed: {e}")
        return img

def apply_gamma(img, gamma=1.0):
    """Applies gamma correction to adjust the luminance of the image."""
    try:
        inv_gamma = 1.0 / gamma
        table = np.array([((i / 255.0) ** inv_gamma) * 255 for i in np.arange(0, 256)]).astype("uint8")
        return cv2.LUT(img, table)
    except Exception as e:
        logger.error(f"Gamma correction failed: {e}")
        return img

def apply_adaptive_histogram_equalization(img):
    """Applies standard Adaptive Histogram Equalization by splitting channels or equalizing the Y/L channel."""
    try:
        # We can use a different CLAHE with a high clip limit to act as standard AHE
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=4.0, tileGridSize=(16, 16))
        cl = clahe.apply(l)
        lab_enhanced = cv2.merge((cl, a, b))
        return cv2.cvtColor(lab_enhanced, cv2.COLOR_LAB2BGR)
    except Exception as e:
        logger.error(f"Adaptive Histogram Equalization failed: {e}")
        return img

def apply_denoising(img, diameter=9, sigma_color=75, sigma_space=75):
    """Applies bilateral filtering to remove noise while preserving sharp edges."""
    try:
        return cv2.bilateralFilter(img, diameter, sigma_color, sigma_space)
    except Exception as e:
        logger.error(f"Denoising failed: {e}")
        return img

def apply_sharpening(img, kernel_type="standard"):
    """Applies a sharpening filter to highlight edges and mitigate motion blur."""
    try:
        if kernel_type == "strong":
            kernel = np.array([[-1, -1, -1],
                               [-1,  9, -1],
                               [-1, -1, -1]])
        else:
            kernel = np.array([[0, -1, 0],
                               [-1, 5, -1],
                               [0, -1, 0]])
        return cv2.filter2D(img, -1, kernel)
    except Exception as e:
        logger.error(f"Sharpening failed: {e}")
        return img

def apply_normalization(img):
    """Normalizes the image dynamic range to fill the [0, 255] range."""
    try:
        norm_img = np.zeros(img.shape, dtype=img.dtype)
        return cv2.normalize(img, norm_img, 0, 255, cv2.NORM_MINMAX)
    except Exception as e:
        logger.error(f"Normalization failed: {e}")
        return img

def preprocess_image_pipeline(img, mode="Auto"):
    """
    Applies the full Theme 3 Preprocessing Pipeline:
    Input Image -> CLAHE -> Gamma -> Adaptive Histogram Equalization -> Denoising -> Sharpening -> Normalization -> Output
    
    Selectable profiles:
    - Auto: Balanced defaults.
    - Low Light: High Gamma boost + CLAHE + noise reduction.
    - Rain: Stronger denoising (bilateral) + sharpening.
    - Shadow: Shadow region correction (high gamma + adaptive equalization).
    - Motion Blur: Strong sharpening + normalization.
    """
    logger.info(f"Executing Preprocessing Pipeline in mode: {mode}")
    if img is None:
        return None
        
    out = img.copy()
    
    # Configure parameters based on selected profile mode
    if mode == "Low Light":
        # Boost brightness significantly
        out = apply_clahe(out, clip_limit=3.0, grid_size=(8, 8))
        out = apply_gamma(out, gamma=1.8)
        out = apply_adaptive_histogram_equalization(out)
        out = apply_denoising(out, diameter=7, sigma_color=60, sigma_space=60)
        out = apply_sharpening(out, kernel_type="standard")
        out = apply_normalization(out)
        
    elif mode == "Rain":
        # Heavy noise filter, then sharpening to restore details
        out = apply_clahe(out, clip_limit=2.0, grid_size=(8, 8))
        out = apply_gamma(out, gamma=1.1)
        out = apply_adaptive_histogram_equalization(out)
        out = apply_denoising(out, diameter=11, sigma_color=85, sigma_space=85)
        out = apply_sharpening(out, kernel_type="strong")
        out = apply_normalization(out)
        
    elif mode == "Shadow":
        # Smooth out dynamic range, pull up shadows
        out = apply_clahe(out, clip_limit=3.5, grid_size=(16, 16))
        out = apply_gamma(out, gamma=1.4)
        out = apply_adaptive_histogram_equalization(out)
        out = apply_denoising(out, diameter=5, sigma_color=40, sigma_space=40)
        out = apply_sharpening(out, kernel_type="standard")
        out = apply_normalization(out)
        
    elif mode == "Motion Blur":
        # Heavy sharpening with edge preservation
        out = apply_clahe(out, clip_limit=1.5, grid_size=(8, 8))
        out = apply_gamma(out, gamma=1.0)
        out = apply_adaptive_histogram_equalization(out)
        out = apply_denoising(out, diameter=5, sigma_color=30, sigma_space=30)
        out = apply_sharpening(out, kernel_type="strong")
        out = apply_normalization(out)
        
    else:  # "Auto" or others
        # Standard balanced pipeline
        out = apply_clahe(out, clip_limit=2.0, grid_size=(8, 8))
        out = apply_gamma(out, gamma=1.3)
        out = apply_adaptive_histogram_equalization(out)
        out = apply_denoising(out, diameter=9, sigma_color=50, sigma_space=50)
        out = apply_sharpening(out, kernel_type="standard")
        out = apply_normalization(out)
        
    return out
