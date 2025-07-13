use serde::{Deserialize, Serialize};
use std::fs::{self, File, OpenOptions};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::collections::HashMap;
use tauri::{AppHandle, command, Manager};
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};
use audiotags::Tag;
use base64::{Engine as _, engine::general_purpose};
use id3::{self, Tag as ID3Tag, TagLike};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MusicMetadata {
    id: String,
    title: String,
    artist: String,
    path: String,
    favorite: bool,
    genre: Option<String>,
    album: Option<String>,
    album_art: Option<String>, // Base64 encoded image data
    duration: Option<u64>, // Duration in seconds
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct MusicDatabase {
    tracks: HashMap<String, MusicMetadata>,
}

impl MusicDatabase {
    pub fn new() -> Self {
        Self {
            tracks: HashMap::new(),
        }
    }

    pub fn add_track(&mut self, metadata: MusicMetadata) {
        self.tracks.insert(metadata.id.clone(), metadata);
    }

    pub fn remove_track(&mut self, id: &str) -> Option<MusicMetadata> {
        self.tracks.remove(id)
    }

    pub fn get_track(&self, id: &str) -> Option<&MusicMetadata> {
        self.tracks.get(id)
    }

    pub fn set_favorite(&mut self, id: &str, favorite: bool) -> bool {
        if let Some(track) = self.tracks.get_mut(id) {
            track.favorite = favorite;
            true
        } else {
            false
        }
    }

    pub fn get_all_tracks(&self) -> Vec<&MusicMetadata> {
        self.tracks.values().collect()
    }
}

pub struct MusicState(pub Mutex<MusicDatabase>);

fn get_music_dir(app: &AppHandle) -> PathBuf {
    app.path().app_data_dir().unwrap().join("music")
}

fn get_db_path(app: &AppHandle) -> PathBuf {
    app.path().app_data_dir().unwrap().join("music_db.json")
}

fn load_database(app: &AppHandle) -> MusicDatabase {
    let db_path = get_db_path(app);
    
    if !db_path.exists() {
        return MusicDatabase::new();
    }

    let mut file = File::open(&db_path).unwrap_or_else(|_| {
        panic!("Failed to open database file: {:?}", db_path)
    });

    let mut contents = String::new();
    file.read_to_string(&mut contents).unwrap_or_else(|_| {
        panic!("Failed to read database file: {:?}", db_path)
    });

    serde_json::from_str(&contents).unwrap_or_else(|_| {
        MusicDatabase::new()
    })
}

fn save_database(app: &AppHandle, db: &MusicDatabase) -> Result<(), String> {
    let db_path = get_db_path(app);
    let db_dir = db_path.parent().unwrap();
    
    if !db_dir.exists() {
        fs::create_dir_all(db_dir).map_err(|e| format!("Failed to create directory: {}", e))?;
    }
    
    let json = serde_json::to_string_pretty(db).map_err(|e| format!("Failed to serialize database: {}", e))?;
    
    let mut file = OpenOptions::new()
        .write(true)
        .truncate(true)
        .create(true)
        .open(&db_path)
        .map_err(|e| format!("Failed to open database file for writing: {}", e))?;
    
    file.write_all(json.as_bytes()).map_err(|e| format!("Failed to write database: {}", e))?;
    
    Ok(())
}

fn ensure_music_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let music_dir = get_music_dir(app);
    
    if !music_dir.exists() {
        fs::create_dir_all(&music_dir)
            .map_err(|e| format!("Failed to create music directory: {}", e))?;
    }
    
    Ok(music_dir)
}

fn generate_id() -> String {
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_millis();
    
    format!("music_{}", timestamp)
}

fn extract_metadata(file_path: &Path) -> Result<(String, String, Option<String>, Option<String>, Option<String>, Option<u64>), String> {
    // Try with audiotags first
    let result = extract_with_audiotags(file_path);
    
    // If audiotags failed to get album art, try with id3
    if let Ok((title, artist, genre, album, album_art, duration)) = result {
        if album_art.is_none() {
            if let Ok(id3_album_art) = extract_album_art_with_id3(file_path) {
                return Ok((title, artist, genre, album, Some(id3_album_art), duration));
            }
        }
        return Ok((title, artist, genre, album, album_art, duration));
    }
    
    // If audiotags completely failed, try with id3
    let id3_result = extract_with_id3(file_path);
    
    id3_result
}

fn extract_with_audiotags(file_path: &Path) -> Result<(String, String, Option<String>, Option<String>, Option<String>, Option<u64>), String> {
    let tag = Tag::new().read_from_path(file_path)
        .map_err(|e| format!("Failed to extract metadata with audiotags: {}", e))?;
    
    // Extract title, defaulting to filename if not found
    let title = tag.title().map(|s| s.to_string())
        .unwrap_or_else(|| {
            file_path.file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("Unknown Title")
                .to_string()
        });
    
    // Extract artist
    let artist = tag.artist().map(|s| s.to_string()).unwrap_or_else(|| "Unknown Artist".to_string());
    
    // Extract genre
    let genre = tag.genre().map(|s| s.to_string());
    
    // Extract album
    let album = tag.album_title().map(|s| s.to_string());
    
    // Extract album art
    let album_art = if let Some(picture) = tag.album_cover() {
        let base64_image = general_purpose::STANDARD.encode(&picture.data);
        
        // Handle the mime type correctly for the enum
        let format = match picture.mime_type {
            audiotags::MimeType::Jpeg => "jpeg",
            audiotags::MimeType::Png => "png",
            audiotags::MimeType::Tiff => "tiff",
            audiotags::MimeType::Bmp => "bmp",
            audiotags::MimeType::Gif => "gif",
        };
        
        Some(format!("data:image/{};base64,{}", format, base64_image))
    } else {
        None
    };

    // Extract duration
    let duration = tag.duration().map(|d| d as u64);
    
    Ok((title, artist, genre, album, album_art, duration))
}

fn extract_with_id3(file_path: &Path) -> Result<(String, String, Option<String>, Option<String>, Option<String>, Option<u64>), String> {
    let tag = ID3Tag::read_from_path(file_path)
        .map_err(|e| format!("Failed to extract metadata with id3: {}", e))?;
    
    // Extract title, defaulting to filename if not found
    let title = tag.title().map(|s| s.to_string())
        .unwrap_or_else(|| {
            file_path.file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("Unknown Title")
                .to_string()
        });
    
    // Extract artist
    let artist = tag.artist().map(|s| s.to_string()).unwrap_or_else(|| "Unknown Artist".to_string());
    
    // Extract genre
    let genre = tag.genre().map(|s| s.to_string());
    
    // Extract album
    let album = tag.album().map(|s| s.to_string());
    
    // Extract album art
    let album_art = extract_album_art_with_id3(file_path).ok();

    // Extract duration using symphonia if ID3 doesn't provide it
    let duration = extract_duration_with_symphonia(file_path).ok();
    
    Ok((title, artist, genre, album, album_art, duration))
}

fn extract_album_art_with_id3(file_path: &Path) -> Result<String, String> {
    let tag = ID3Tag::read_from_path(file_path)
        .map_err(|e| format!("Failed to read id3 tag: {}", e))?;
    
    // Collect pictures to avoid lifetime issues
    let pictures: Vec<_> = tag.pictures().collect();
    
    if let Some(picture) = pictures.first() {
        let mime_type = picture.mime_type.split('/').nth(1).unwrap_or("jpeg");
        let base64_image = general_purpose::STANDARD.encode(&picture.data);
        Ok(format!("data:image/{};base64,{}", mime_type, base64_image))
    } else {
        Err("No album art found with id3".to_string())
    }
}

// New function to extract duration using symphonia
fn extract_duration_with_symphonia(file_path: &Path) -> Result<u64, String> {
    // Using mp3_duration crate instead of symphonia for more reliable duration extraction
    match mp3_duration::from_path(file_path) {
        Ok(duration) => {
            // Convert std::time::Duration to seconds
            let seconds = duration.as_secs();
            Ok(seconds)
        },
        Err(err) => {
            // If mp3_duration fails, try with symphonia as fallback
            match try_extract_with_symphonia(file_path) {
                Ok(duration) => Ok(duration),
                Err(_) => Err(format!("Failed to extract duration: {}", err))
            }
        }
    }
}

// Fallback method using symphonia
fn try_extract_with_symphonia(file_path: &Path) -> Result<u64, String> {
    use symphonia::core::formats::FormatOptions;
    use symphonia::core::io::MediaSourceStream;
    use symphonia::core::probe::Hint;
    
    // Open the file
    let file = std::fs::File::open(file_path)
        .map_err(|e| format!("Failed to open file: {}", e))?;
    
    // Create the media source
    let mss = MediaSourceStream::new(Box::new(file), Default::default());
    
    // Create a hint to help the format registry decide what format reader to use
    let mut hint = Hint::new();
    
    // If we know the extension, provide it to the format registry
    if let Some(extension) = file_path.extension().and_then(|e| e.to_str()) {
        hint.with_extension(extension);
    }
    
    // Use the default options for format readers
    let format_opts = FormatOptions {
        enable_gapless: true,
        ..Default::default()
    };
    
    // Probe the media source to identify the container format
    let probed = symphonia::default::get_probe()
        .format(&hint, mss, &format_opts, &Default::default())
        .map_err(|e| format!("Error while probing media: {}", e))?;
    
    // Get tracks and estimate duration
    let mut duration_seconds = 0;
    
    for track in probed.format.tracks() {
        if let Some(n_frames) = track.codec_params.n_frames {
            if let Some(sample_rate) = track.codec_params.sample_rate {
                // Calculate duration in seconds
                duration_seconds = n_frames / u64::from(sample_rate);
                break;
            }
        }
        
        // Try to use time_base if available
        if let Some(tb) = track.codec_params.time_base {
            if let Some(n_frames) = track.codec_params.n_frames {
                if tb.denom > 0 {
                    let num = u64::from(tb.numer) * n_frames;
                    let denom = u64::from(tb.denom);
                    duration_seconds = num / denom;
                    break;
                }
            }
        }
    }
    
    // If we got any duration, return it
    if duration_seconds > 0 {
        return Ok(duration_seconds);
    }
    
    Err("Could not determine duration".to_string())
}

#[command]
pub async fn upload_music_file(app: AppHandle, file_path: &str) -> Result<MusicMetadata, String> {
    let music_dir = ensure_music_dir(&app)?;
    
    // Extract filename from path
    let path = Path::new(file_path);
    let file_name = path.file_name()
        .ok_or_else(|| "Invalid file path".to_string())?
        .to_str()
        .ok_or_else(|| "Invalid file name".to_string())?;

    // Create destination path
    let dest_path = music_dir.join(file_name);
    
    // Read source file
    let mut source_file = File::open(path)
        .map_err(|e| format!("Failed to open source file: {}", e))?;
    let mut buffer = Vec::new();
    source_file.read_to_end(&mut buffer)
        .map_err(|e| format!("Failed to read source file: {}", e))?;
    
    // Write to destination
    let mut dest_file = File::create(&dest_path)
        .map_err(|e| format!("Failed to create destination file: {}", e))?;
    dest_file.write_all(&buffer)
        .map_err(|e| format!("Failed to write destination file: {}", e))?;
    
    // Extract metadata from the audio file
    let (title, artist, genre, album, album_art, _) = extract_metadata(path)?;
    
    // Get duration using mp3-duration directly
    let duration = match mp3_duration::from_path(path) {
        Ok(duration) => Some(duration.as_secs()),
        Err(_) => None,
    };
    
    // Create metadata with the extracted duration
    let metadata = MusicMetadata {
        id: generate_id(),
        title,
        artist,
        path: dest_path.to_string_lossy().to_string(),
        favorite: false,
        genre,
        album,
        album_art,
        duration, // Use the extracted duration
    };
    
    // Update database
    let state = app.state::<MusicState>();
    let mut db = state.0.lock().unwrap();
    db.add_track(metadata.clone());
    save_database(&app, &db).map_err(|e| format!("Failed to save database: {}", e))?;
    
    Ok(metadata)
}

#[command]
pub fn get_music_metadata(app: AppHandle, id: &str) -> Result<MusicMetadata, String> {
    let state = app.state::<MusicState>();
    let db = state.0.lock().unwrap();
    
    db.get_track(id)
        .cloned()
        .ok_or_else(|| format!("Track with id {} not found", id))
}

#[command]
pub fn delete_music(app: AppHandle, id: &str) -> Result<(), String> {
    let state = app.state::<MusicState>();
    let mut db = state.0.lock().unwrap();
    
    if let Some(track) = db.remove_track(id) {
        // Delete the file
        fs::remove_file(&track.path)
            .map_err(|e| format!("Failed to delete file: {}", e))?;
        
        // Save the updated database
        save_database(&app, &db)?;
        
        Ok(())
    } else {
        Err(format!("Track with id {} not found", id))
    }
}

#[command]
pub fn set_favorite(app: AppHandle, id: &str, favorite: bool) -> Result<(), String> {
    let state = app.state::<MusicState>();
    let mut db = state.0.lock().unwrap();
    
    if db.set_favorite(id, favorite) {
        save_database(&app, &db)?;
        Ok(())
    } else {
        Err(format!("Track with id {} not found", id))
    }
}

#[command]
pub fn get_all_music(app: AppHandle) -> Vec<MusicMetadata> {
    let state = app.state::<MusicState>();
    let db = state.0.lock().unwrap();
    
    db.get_all_tracks().into_iter().cloned().collect()
} 

pub fn init_music_state(app: &AppHandle) -> MusicState {
    // Ensure music directory exists
    let _ = ensure_music_dir(app);
    
    // Load database from disk or create a new one
    let db = load_database(app);
    
    MusicState(Mutex::new(db))
} 