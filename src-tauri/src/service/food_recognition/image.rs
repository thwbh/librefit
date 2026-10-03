//! In-memory image hygiene (add-food-recognition, FR).
//!
//! EXIF/metadata is stripped before any upload (FR-009). Bytes never leave
//! memory and are never written to disk; nothing here logs image content.

use little_exif::filetype::FileExtension;
use little_exif::metadata::Metadata;

use super::analysis::AnalysisError;

/// Map an image MIME type to the little_exif file type, if supported.
pub fn file_extension_for(mime: &str) -> Option<FileExtension> {
    match mime.trim().to_ascii_lowercase().as_str() {
        "image/jpeg" | "image/jpg" => Some(FileExtension::JPEG),
        "image/png" => Some(FileExtension::PNG {
            as_zTXt_chunk: false,
        }),
        "image/webp" => Some(FileExtension::WEBP),
        "image/heic" | "image/heif" => Some(FileExtension::HEIF),
        _ => None,
    }
}

/// Strip all metadata from the image in place. Returns an error for unsupported
/// types so an un-stripped image is never uploaded.
pub fn strip_exif(image: &mut Vec<u8>, mime: &str) -> Result<(), AnalysisError> {
    let ext = file_extension_for(mime)
        .ok_or_else(|| AnalysisError::Other(format!("unsupported image type: {}", mime)))?;
    Metadata::clear_metadata(image, ext)
        .map_err(|e| AnalysisError::Other(format!("exif strip failed: {}", e)))
}
