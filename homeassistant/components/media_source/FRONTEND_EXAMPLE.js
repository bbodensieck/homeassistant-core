/**
 * Example: Frontend implementation of "Select All Files" using the new API
 * 
 * This example demonstrates how to use the media_source/get_all_files
 * websocket API to implement a "select all" feature in a media browser UI.
 */

// Example 1: Basic usage - Get all files from a folder
async function getAllFilesExample(hass, mediaContentId) {
    const response = await hass.callWS({
        type: "media_source/get_all_files",
        media_content_id: mediaContentId
    });
    
    console.log(`Found ${response.count} files`);
    console.log('Files:', response.files);
    
    return response.files;
}

// Example 2: Implementing "Select All" in a media browser component
class MediaBrowser {
    constructor(hass) {
        this.hass = hass;
        this.selectedFiles = new Set();
        this.currentFolder = "media-source://media_source/local";
    }
    
    async selectAllFiles() {
        try {
            const response = await this.hass.callWS({
                type: "media_source/get_all_files",
                media_content_id: this.currentFolder
            });
            
            // Clear existing selection
            this.selectedFiles.clear();
            
            // Add all files to selection
            response.files.forEach(file => {
                this.selectedFiles.add(file.media_content_id);
            });
            
            console.log(`Selected ${response.count} files`);
            this.updateUI();
            
            return response.count;
        } catch (error) {
            console.error('Error selecting all files:', error);
            return 0;
        }
    }
    
    async deselectAllFiles() {
        this.selectedFiles.clear();
        this.updateUI();
    }
    
    toggleSelectAll() {
        if (this.selectedFiles.size > 0) {
            this.deselectAllFiles();
        } else {
            this.selectAllFiles();
        }
    }
    
    updateUI() {
        // Update checkboxes, buttons, etc.
        // Implementation depends on your UI framework
    }
}

// Example 3: Filtering files by type before selection
async function selectAllAudioFiles(hass, mediaContentId) {
    const response = await hass.callWS({
        type: "media_source/get_all_files",
        media_content_id: mediaContentId
    });
    
    const audioFiles = response.files.filter(file => 
        file.media_content_type.startsWith('audio/')
    );
    
    console.log(`Found ${audioFiles.length} audio files out of ${response.count} total files`);
    return audioFiles;
}

// Example 4: Bulk operations on selected files
async function bulkAddToPlaylist(hass, mediaContentId, playlistId) {
    // Get all files
    const response = await hass.callWS({
        type: "media_source/get_all_files",
        media_content_id: mediaContentId
    });
    
    // Add each file to the playlist
    const promises = response.files.map(file =>
        hass.callService('media_player', 'play_media', {
            entity_id: playlistId,
            media_content_id: file.media_content_id,
            media_content_type: file.media_content_type,
            enqueue: 'add'
        })
    );
    
    await Promise.all(promises);
    console.log(`Added ${response.count} files to playlist`);
}

// Example 5: React/LitElement component example
class SelectAllButton extends LitElement {
    static get properties() {
        return {
            hass: { type: Object },
            currentFolder: { type: String },
            onSelectionChange: { type: Function }
        };
    }
    
    async handleSelectAll() {
        try {
            const response = await this.hass.callWS({
                type: "media_source/get_all_files",
                media_content_id: this.currentFolder
            });
            
            // Notify parent component of selection
            if (this.onSelectionChange) {
                this.onSelectionChange(response.files);
            }
            
            // Show notification
            this.dispatchEvent(new CustomEvent('show-notification', {
                detail: {
                    message: `Selected ${response.count} files`,
                    duration: 3000
                },
                bubbles: true,
                composed: true
            }));
        } catch (error) {
            console.error('Error:', error);
            this.dispatchEvent(new CustomEvent('show-notification', {
                detail: {
                    message: 'Failed to select files',
                    type: 'error'
                },
                bubbles: true,
                composed: true
            }));
        }
    }
    
    render() {
        return html`
            <ha-button @click="${this.handleSelectAll}">
                <ha-icon icon="mdi:checkbox-multiple-marked"></ha-icon>
                Select All Files
            </ha-button>
        `;
    }
}

/**
 * Example 6: Error handling
 */
async function robustGetAllFiles(hass, mediaContentId) {
    try {
        const response = await hass.callWS({
            type: "media_source/get_all_files",
            media_content_id: mediaContentId
        });
        
        if (!response || !response.files) {
            throw new Error('Invalid response from server');
        }
        
        return {
            success: true,
            files: response.files,
            count: response.count
        };
    } catch (error) {
        console.error('Error getting all files:', error);
        return {
            success: false,
            files: [],
            count: 0,
            error: error.message
        };
    }
}

/**
 * Example 7: Integration with existing browse_media
 * 
 * Use get_all_files in conjunction with browse_media to provide
 * both browsing and bulk selection capabilities.
 */
async function mediaBrowserWithSelectAll(hass, mediaContentId) {
    // First, browse to get folder structure
    const browseResult = await hass.callWS({
        type: "media_source/browse_media",
        media_content_id: mediaContentId
    });
    
    console.log('Folder:', browseResult.title);
    console.log('Can expand:', browseResult.can_expand);
    
    // If it's a folder, get all files for "select all" functionality
    if (browseResult.can_expand) {
        const allFiles = await hass.callWS({
            type: "media_source/get_all_files",
            media_content_id: mediaContentId
        });
        
        console.log(`Folder contains ${allFiles.count} files`);
        
        return {
            folder: browseResult,
            selectableFiles: allFiles.files
        };
    }
    
    return {
        folder: browseResult,
        selectableFiles: []
    };
}
