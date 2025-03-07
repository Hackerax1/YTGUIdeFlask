/**
 * Unit tests for Channel Operations module
 * 
 * These tests verify that core functions in channelOperations.js work correctly
 */

// Import the functions to test
import { validateChannelData } from '../../static/js/modules/channelOperations.js';

describe('Channel Operations - validateChannelData', () => {
    test('should validate a correct channel object', () => {
        const validChannel = {
            name: 'Test Channel',
            stationId: 123,
            youtubeLinks: ['https://www.youtube.com/channel/UC123456']
        };
        
        const errors = validateChannelData(validChannel);
        expect(errors).toEqual([]);
    });
    
    test('should return error for empty name', () => {
        const channelWithEmptyName = {
            name: '',
            stationId: 123,
            youtubeLinks: ['https://www.youtube.com/channel/UC123456']
        };
        
        const errors = validateChannelData(channelWithEmptyName);
        expect(errors).toContain('Channel name is required');
    });
    
    test('should return error for invalid station ID', () => {
        const channelWithInvalidId = {
            name: 'Test Channel',
            stationId: -5,
            youtubeLinks: ['https://www.youtube.com/channel/UC123456']
        };
        
        const errors = validateChannelData(channelWithInvalidId);
        expect(errors).toContain('Station ID must be a positive number');
    });
    
    test('should return error for empty YouTube links', () => {
        const channelWithNoLinks = {
            name: 'Test Channel',
            stationId: 123,
            youtubeLinks: []
        };
        
        const errors = validateChannelData(channelWithNoLinks);
        expect(errors).toContain('At least one YouTube channel link is required');
    });
    
    test('should return error for invalid YouTube links', () => {
        const channelWithInvalidLinks = {
            name: 'Test Channel',
            stationId: 123,
            youtubeLinks: ['https://www.invalid-site.com/channel']
        };
        
        const errors = validateChannelData(channelWithInvalidLinks);
        expect(errors).toContain('One or more YouTube links are invalid');
    });
    
    test('should validate multiple YouTube links', () => {
        const channelWithMultipleLinks = {
            name: 'Test Channel',
            stationId: 123,
            youtubeLinks: [
                'https://www.youtube.com/channel/UC123456',
                'https://www.youtube.com/c/CustomName',
                'https://youtu.be/abcdefg'
            ]
        };
        
        const errors = validateChannelData(channelWithMultipleLinks);
        expect(errors).toEqual([]);
    });
});