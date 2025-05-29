const VoiceRecording = require('../models/VoiceRecording');
const audioStorageService = require('./audioStorage.service');
const { logger } = require('../utils/logger');

class RetentionService {
  constructor() {
    this.defaultRetentionDays = parseInt(process.env.DEFAULT_RETENTION_DAYS || '90');
    this.maxRetentionDays = parseInt(process.env.MAX_RETENTION_DAYS || '365');
    
    // Retention policies by reason
    this.retentionPolicies = {
      'clinical': 90,    // 3 months for clinical records
      'legal': 365,      // 1 year for legal requirements
      'research': 180,   // 6 months for research data
      'audit': 365       // 1 year for audit purposes
    };
  }

  /**
   * Calculate retention policy for a recording
   * @param {string} reason - Retention reason
   * @param {number} customDays - Custom retention days (optional)
   * @returns {Object} Retention policy
   */
  calculateRetentionPolicy(reason = 'clinical', customDays = null) {
    let retentionDays;

    if (customDays) {
      // Use custom retention days if provided
      retentionDays = Math.min(customDays, this.maxRetentionDays);
    } else {
      // Use predefined policy
      retentionDays = this.retentionPolicies[reason] || this.defaultRetentionDays;
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + retentionDays);

    return {
      expiresAt: expiresAt,
      retentionReason: reason,
      retentionDays: retentionDays
    };
  }

  /**
   * Find expired recordings
   * @returns {Promise<Array>} Array of expired recordings
   */
  async findExpiredRecordings() {
    try {
      const expiredRecordings = await VoiceRecording.findExpired();
      
      logger.info('Found expired recordings', {
        count: expiredRecordings.length
      });

      return expiredRecordings;
    } catch (error) {
      logger.error('Failed to find expired recordings:', error);
      throw error;
    }
  }

  /**
   * Clean up expired recordings
   * @param {boolean} dryRun - If true, only log what would be deleted
   * @returns {Promise<Object>} Cleanup results
   */
  async cleanupExpiredRecordings(dryRun = false) {
    try {
      const expiredRecordings = await this.findExpiredRecordings();
      const results = {
        total: expiredRecordings.length,
        deleted: 0,
        failed: 0,
        errors: []
      };

      if (expiredRecordings.length === 0) {
        logger.info('No expired recordings found for cleanup');
        return results;
      }

      logger.info(`Starting cleanup of ${expiredRecordings.length} expired recordings`, {
        dryRun: dryRun
      });

      for (const recording of expiredRecordings) {
        try {
          if (dryRun) {
            logger.info('Would delete expired recording', {
              recordingId: recording._id,
              encounterId: recording.encounterId,
              expiresAt: recording.retentionPolicy.expiresAt,
              retentionReason: recording.retentionPolicy.retentionReason
            });
          } else {
            // Delete audio file from storage
            await audioStorageService.deleteAudioFile(recording.fileId);
            
            // Mark recording as deleted
            recording.status = 'deleted';
            await recording.save();
            
            logger.info('Deleted expired recording', {
              recordingId: recording._id,
              encounterId: recording.encounterId
            });
          }
          
          results.deleted++;
        } catch (error) {
          logger.error('Failed to delete expired recording', {
            recordingId: recording._id,
            error: error.message
          });
          
          results.failed++;
          results.errors.push({
            recordingId: recording._id,
            error: error.message
          });
        }
      }

      logger.info('Cleanup completed', {
        total: results.total,
        deleted: results.deleted,
        failed: results.failed,
        dryRun: dryRun
      });

      return results;
    } catch (error) {
      logger.error('Cleanup process failed:', error);
      throw error;
    }
  }

  /**
   * Update retention policy for a recording
   * @param {string} recordingId - Recording ID
   * @param {string} reason - New retention reason
   * @param {number} customDays - Custom retention days
   * @returns {Promise<Object>} Updated recording
   */
  async updateRetentionPolicy(recordingId, reason, customDays = null) {
    try {
      const recording = await VoiceRecording.findById(recordingId);
      
      if (!recording) {
        throw new Error('Recording not found');
      }

      const newPolicy = this.calculateRetentionPolicy(reason, customDays);
      
      recording.retentionPolicy = newPolicy;
      await recording.save();

      logger.info('Retention policy updated', {
        recordingId: recordingId,
        oldExpiresAt: recording.retentionPolicy.expiresAt,
        newExpiresAt: newPolicy.expiresAt,
        reason: reason
      });

      return recording;
    } catch (error) {
      logger.error('Failed to update retention policy:', error);
      throw error;
    }
  }

  /**
   * Get retention statistics
   * @returns {Promise<Object>} Retention statistics
   */
  async getRetentionStatistics() {
    try {
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
      const sevenDaysFromNow = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));

      const [
        totalRecordings,
        expiredRecordings,
        expiringIn30Days,
        expiringIn7Days,
        retentionByReason
      ] = await Promise.all([
        VoiceRecording.countDocuments({ status: { $ne: 'deleted' } }),
        VoiceRecording.countDocuments({
          'retentionPolicy.expiresAt': { $lt: now },
          status: { $ne: 'deleted' }
        }),
        VoiceRecording.countDocuments({
          'retentionPolicy.expiresAt': { $lt: thirtyDaysFromNow, $gte: now },
          status: { $ne: 'deleted' }
        }),
        VoiceRecording.countDocuments({
          'retentionPolicy.expiresAt': { $lt: sevenDaysFromNow, $gte: now },
          status: { $ne: 'deleted' }
        }),
        VoiceRecording.aggregate([
          { $match: { status: { $ne: 'deleted' } } },
          { $group: {
            _id: '$retentionPolicy.retentionReason',
            count: { $sum: 1 },
            avgRetentionDays: { $avg: '$retentionPolicy.retentionDays' }
          }}
        ])
      ]);

      return {
        totalRecordings,
        expiredRecordings,
        expiringIn30Days,
        expiringIn7Days,
        retentionByReason: retentionByReason.reduce((acc, item) => {
          acc[item._id] = {
            count: item.count,
            avgRetentionDays: Math.round(item.avgRetentionDays)
          };
          return acc;
        }, {}),
        policies: this.retentionPolicies,
        defaultRetentionDays: this.defaultRetentionDays,
        maxRetentionDays: this.maxRetentionDays
      };
    } catch (error) {
      logger.error('Failed to get retention statistics:', error);
      throw error;
    }
  }

  /**
   * Schedule automatic cleanup
   * @param {number} intervalHours - Cleanup interval in hours
   */
  scheduleCleanup(intervalHours = 24) {
    const intervalMs = intervalHours * 60 * 60 * 1000;
    
    logger.info('Scheduling automatic retention cleanup', {
      intervalHours: intervalHours
    });

    setInterval(async () => {
      try {
        logger.info('Starting scheduled retention cleanup');
        await this.cleanupExpiredRecordings(false);
      } catch (error) {
        logger.error('Scheduled cleanup failed:', error);
      }
    }, intervalMs);
  }

  /**
   * Extend retention period for a recording
   * @param {string} recordingId - Recording ID
   * @param {number} additionalDays - Additional days to extend
   * @returns {Promise<Object>} Updated recording
   */
  async extendRetention(recordingId, additionalDays) {
    try {
      const recording = await VoiceRecording.findById(recordingId);
      
      if (!recording) {
        throw new Error('Recording not found');
      }

      const currentExpiresAt = recording.retentionPolicy.expiresAt;
      const newExpiresAt = new Date(currentExpiresAt.getTime() + (additionalDays * 24 * 60 * 60 * 1000));
      
      // Check if new expiration date exceeds maximum retention
      const maxExpiresAt = new Date();
      maxExpiresAt.setDate(maxExpiresAt.getDate() + this.maxRetentionDays);
      
      if (newExpiresAt > maxExpiresAt) {
        throw new Error(`Extended retention period exceeds maximum allowed (${this.maxRetentionDays} days)`);
      }

      recording.retentionPolicy.expiresAt = newExpiresAt;
      recording.retentionPolicy.retentionDays += additionalDays;
      await recording.save();

      logger.info('Retention period extended', {
        recordingId: recordingId,
        oldExpiresAt: currentExpiresAt,
        newExpiresAt: newExpiresAt,
        additionalDays: additionalDays
      });

      return recording;
    } catch (error) {
      logger.error('Failed to extend retention:', error);
      throw error;
    }
  }
}

module.exports = new RetentionService();
