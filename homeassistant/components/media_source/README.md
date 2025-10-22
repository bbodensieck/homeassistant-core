# Media Source Component

The Media Source component provides a unified interface for browsing and playing media from various sources in Home Assistant.

## WebSocket API

### Browse Media

Browse available media content.

**Type:** `media_source/browse_media`

**Parameters:**
- `media_content_id` (optional): The media content ID to browse. Defaults to root.

**Example:**
```json
{
  "id": 1,
  "type": "media_source/browse_media",
  "media_content_id": "media-source://media_source/local"
}
```

### Resolve Media

Resolve a media content ID to a playable URL.

**Type:** `media_source/resolve_media`

**Parameters:**
- `media_content_id` (required): The media content ID to resolve.
- `expires` (optional): Expiration time in seconds. Default: 30 seconds.

**Example:**
```json
{
  "id": 1,
  "type": "media_source/resolve_media",
  "media_content_id": "media-source://media_source/local/test.mp3"
}
```

### Get All Files

Get all playable files in a media folder. This is useful for implementing "select all" functionality in media browsers.

**Type:** `media_source/get_all_files`

**Parameters:**
- `media_content_id` (required): The media folder content ID to get files from.

**Returns:**
- `files`: Array of file objects with properties:
  - `media_content_id`: The content ID of the file
  - `title`: The display title of the file
  - `media_content_type`: The MIME type of the file
  - `media_class`: The media class (e.g., MUSIC, VIDEO, etc.)
- `count`: Total number of files found

**Example:**
```json
{
  "id": 1,
  "type": "media_source/get_all_files",
  "media_content_id": "media-source://media_source/local"
}
```

**Response:**
```json
{
  "id": 1,
  "type": "result",
  "success": true,
  "result": {
    "files": [
      {
        "media_content_id": "media-source://media_source/local/song1.mp3",
        "title": "song1.mp3",
        "media_content_type": "audio/mpeg",
        "media_class": "music"
      },
      {
        "media_content_id": "media-source://media_source/local/song2.mp3",
        "title": "song2.mp3",
        "media_content_type": "audio/mpeg",
        "media_class": "music"
      }
    ],
    "count": 2
  }
}
```

**Note:** This endpoint only returns files (playable media items) and excludes directories.

## Frontend Integration

The `get_all_files` websocket command enables frontend implementations to provide a "select all files" feature in media browser interfaces. Instead of manually checking each file checkbox, users can select all files at once using the returned list of file content IDs.
