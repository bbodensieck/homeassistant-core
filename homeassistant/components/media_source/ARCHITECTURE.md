# Select All Files Feature - Architecture

## Overview

This feature adds backend API support to enable frontend implementations of "select all files" functionality in Home Assistant's media browser.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Browser)                      │
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │         Media Browser Component                     │   │
│  │                                                      │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │   │
│  │  │ ☐ File1  │  │ ☐ File2  │  │ ☐ File3  │  ...    │   │
│  │  └──────────┘  └──────────┘  └──────────┘         │   │
│  │                                                      │   │
│  │  [Select All Files]  [Deselect All]                │   │
│  │         ▲                                            │   │
│  │         │ Click                                      │   │
│  └─────────┼──────────────────────────────────────────┘   │
│            │                                                │
└────────────┼────────────────────────────────────────────────┘
             │
             │ WebSocket: media_source/get_all_files
             │ { media_content_id: "media-source://..." }
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│            Home Assistant Backend (Python)                   │
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │    media_source/__init__.py                         │   │
│  │                                                      │   │
│  │    websocket_get_all_files()                        │   │
│  │         ▼                                            │   │
│  │    async_browse_media(folder_id)                    │   │
│  │         ▼                                            │   │
│  │    Filter for playable items (files only)          │   │
│  │         ▼                                            │   │
│  │    Return { files: [...], count: N }               │   │
│  │                                                      │   │
│  └────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │    local_source.py                                  │   │
│  │                                                      │   │
│  │    Reads files from:                                │   │
│  │    /config/media/                                   │   │
│  │      ├── music/                                     │   │
│  │      ├── videos/                                    │   │
│  │      └── ...                                        │   │
│  └────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. User Clicks "Select All"

```javascript
// Frontend sends WebSocket message
{
  "id": 1,
  "type": "media_source/get_all_files",
  "media_content_id": "media-source://media_source/local/music"
}
```

### 2. Backend Processes Request

```python
# Backend (media_source/__init__.py)
async def websocket_get_all_files(hass, connection, msg):
    # 1. Browse the folder
    media = await async_browse_media(hass, msg["media_content_id"])
    
    # 2. Filter for files only (not directories)
    files = [
        child for child in media.children 
        if child.can_play  # Files have can_play=True
    ]
    
    # 3. Extract relevant info
    result = [
        {
            "media_content_id": file.media_content_id,
            "title": file.title,
            "media_content_type": file.media_content_type,
            "media_class": file.media_class
        }
        for file in files
    ]
    
    # 4. Send response
    connection.send_result(msg["id"], {
        "files": result,
        "count": len(result)
    })
```

### 3. Frontend Receives Response

```javascript
// Response from backend
{
  "id": 1,
  "type": "result",
  "success": true,
  "result": {
    "files": [
      {
        "media_content_id": "media-source://media_source/local/music/song1.mp3",
        "title": "song1.mp3",
        "media_content_type": "audio/mpeg",
        "media_class": "music"
      },
      {
        "media_content_id": "media-source://media_source/local/music/song2.mp3",
        "title": "song2.mp3",
        "media_content_type": "audio/mpeg",
        "media_class": "music"
      }
      // ... more files
    ],
    "count": 2
  }
}
```

### 4. Frontend Updates UI

```javascript
// Frontend marks all checkboxes as selected
response.files.forEach(file => {
    const checkbox = document.querySelector(
        `[data-content-id="${file.media_content_id}"]`
    );
    if (checkbox) {
        checkbox.checked = true;
    }
});
```

## Key Benefits

1. **Single Request**: Gets all file info in one WebSocket call instead of multiple requests
2. **Efficient**: Reuses existing browse_media infrastructure
3. **Selective**: Only returns playable items (files), excludes directories
4. **Secure**: Respects existing permissions - users can only get files they can already browse
5. **Frontend-Agnostic**: Backend API works with any frontend implementation

## Use Cases

- **Select All**: Select all files in a folder for bulk operations
- **Bulk Download**: Download all media files from a folder
- **Bulk Add to Playlist**: Add all songs in a folder to a playlist
- **Bulk Delete**: Delete all files in a folder (with confirmation)
- **File Type Filtering**: Select all audio files, or all video files, etc.

## Integration Points

### Backend
- `homeassistant/components/media_source/__init__.py` - Main API implementation
- `homeassistant/components/media_source/local_source.py` - Local file source
- `homeassistant/components/media_source/models.py` - Data models

### Testing
- `tests/components/media_source/test_init.py` - WebSocket API tests

### Documentation
- `homeassistant/components/media_source/README.md` - API documentation
- `homeassistant/components/media_source/FRONTEND_EXAMPLE.js` - Frontend examples
