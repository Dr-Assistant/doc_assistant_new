/**
 * Health Record Controller
 * Handles HTTP requests for health record management
 */

const healthRecordService = require('../services/health-record.service');
const fhirProcessorService = require('../services/fhir-processor.service');
const { HealthRecordFetchRequest } = require('../models');
const { logger } = require('../utils/logger');

/**
 * Fetch health records using consent
 * @route POST /api/abdm/health-records/fetch
 */
exports.fetchHealthRecords = async (req, res, next) => {
  try {
    const fetchData = req.body;
    const user = req.user;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    const result = await healthRecordService.fetchHealthRecords(
      fetchData,
      user,
      ipAddress,
      userAgent
    );

    res.status(201).json({
      success: true,
      data: result,
      message: 'Health record fetch request submitted successfully'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get fetch request status
 * @route GET /api/abdm/health-records/status/:requestId
 */
exports.getFetchStatus = async (req, res, next) => {
  try {
    const { requestId } = req.params;

    const result = await healthRecordService.getFetchStatus(requestId);

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get health records for a patient
 * @route GET /api/abdm/health-records/patient/:patientId
 */
exports.getPatientHealthRecords = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const { type, source, from, to, limit, offset } = req.query;

    const options = {
      type,
      source,
      from,
      to,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    };

    const result = await healthRecordService.getHealthRecords(patientId, options);

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get detailed health record
 * @route GET /api/abdm/health-records/:recordId
 */
exports.getHealthRecordDetails = async (req, res, next) => {
  try {
    const { recordId } = req.params;
    const user = req.user;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    const result = await healthRecordService.getHealthRecordDetails(
      recordId,
      user,
      ipAddress,
      userAgent
    );

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Handle health information callback from ABDM
 * @route POST /api/abdm/health-records/callback
 */
exports.handleHealthInfoCallback = async (req, res, next) => {
  try {
    const callbackData = req.body;

    logger.info('Received health information callback from ABDM', { 
      requestId: callbackData.requestId,
      bundleCount: callbackData.hiRequest?.entries?.length || 0
    });

    // Find the fetch request
    const fetchRequest = await HealthRecordFetchRequest.findByAbdmRequestId(
      callbackData.requestId
    );

    if (!fetchRequest) {
      logger.warn('Received callback for unknown fetch request', { 
        requestId: callbackData.requestId 
      });
      return res.status(200).json({
        success: false,
        message: 'Fetch request not found'
      });
    }

    // Process health information entries
    let totalProcessed = 0;
    let totalFailed = 0;

    if (callbackData.hiRequest?.entries) {
      for (const entry of callbackData.hiRequest.entries) {
        try {
          // Decrypt and process the health information bundle
          const decryptedBundle = await decryptHealthInfoEntry(entry);
          
          const result = await fhirProcessorService.processHealthInfoBundle(
            decryptedBundle,
            fetchRequest.id
          );

          totalProcessed += result.processedCount;
          totalFailed += result.failedCount;

        } catch (error) {
          totalFailed++;
          logger.error('Failed to process health info entry', {
            fetchRequestId: fetchRequest.id,
            entryId: entry.careContextReference,
            error: error.message
          });
        }
      }
    }

    // Update fetch request progress
    await fetchRequest.updateProgress(
      totalProcessed,
      totalFailed,
      totalProcessed + totalFailed
    );

    logger.info('Health information callback processed', {
      fetchRequestId: fetchRequest.id,
      totalProcessed,
      totalFailed,
      status: fetchRequest.status
    });

    res.status(200).json({
      success: true,
      message: 'Health information processed successfully',
      data: {
        processedCount: totalProcessed,
        failedCount: totalFailed
      }
    });

  } catch (error) {
    logger.error('Error processing health information callback:', error);
    next(error);
  }
};

/**
 * Get fetch request processing logs
 * @route GET /api/abdm/health-records/status/:requestId/logs
 */
exports.getFetchProcessingLogs = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { HealthRecordProcessingLog } = require('../models');

    const logs = await HealthRecordProcessingLog.findAll({
      where: { fetchRequestId: requestId },
      order: [['created_at', 'DESC']],
      limit: 100
    });

    const stats = await HealthRecordProcessingLog.getProcessingStats(requestId);

    res.status(200).json({
      success: true,
      data: {
        logs,
        stats
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Cancel fetch request
 * @route POST /api/abdm/health-records/status/:requestId/cancel
 */
exports.cancelFetchRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;

    const fetchRequest = await HealthRecordFetchRequest.findByPk(requestId);

    if (!fetchRequest) {
      return res.status(404).json({
        success: false,
        error: { message: 'Fetch request not found' }
      });
    }

    if (fetchRequest.isCompleted()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Cannot cancel completed fetch request' }
      });
    }

    await fetchRequest.update({
      status: 'CANCELLED',
      errorMessage: reason || 'Cancelled by user'
    });

    res.status(200).json({
      success: true,
      message: 'Fetch request cancelled successfully'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Decrypt health information entry (placeholder implementation)
 * @param {Object} entry - Encrypted health information entry
 * @returns {Promise<Object>} Decrypted FHIR bundle
 */
async function decryptHealthInfoEntry(entry) {
  // In a real implementation, this would:
  // 1. Decrypt the entry.content using the key material
  // 2. Verify the digital signature
  // 3. Parse the decrypted JSON to get the FHIR bundle
  
  // For now, we'll assume the content is already decrypted or in plain text
  try {
    if (typeof entry.content === 'string') {
      return JSON.parse(entry.content);
    }
    return entry.content;
  } catch (error) {
    logger.error('Failed to decrypt/parse health info entry', {
      entryId: entry.careContextReference,
      error: error.message
    });
    throw new Error('Failed to decrypt health information entry');
  }
}
