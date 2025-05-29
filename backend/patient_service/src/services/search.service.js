/**
 * Search Service
 * Handles advanced search operations for patients and medical history
 */

const { Op } = require('sequelize');
const { Patient, MedicalHistory } = require('../models');
const { logger } = require('../utils/logger');

class SearchService {
  /**
   * Search patients with advanced filtering
   * @param {Object} filters - Search filters
   * @param {Object} options - Search options (pagination, sorting)
   * @returns {Promise<Object>} Search results
   */
  async searchPatients(filters = {}, options = {}) {
    try {
      const {
        query,
        ageRange,
        gender,
        bloodGroup,
        status,
        hasChronicCondition,
        hasAllergy,
        lastVisitDate,
        sortBy = 'created_at',
        sortOrder = 'DESC',
        page = 1,
        limit = 10
      } = filters;

      const whereClause = {};
      const includeClause = [];

      // Text search
      if (query) {
        whereClause[Op.or] = [
          { first_name: { [Op.iLike]: `%${query}%` } },
          { last_name: { [Op.iLike]: `%${query}%` } },
          { mrn: { [Op.iLike]: `%${query}%` } },
          { abha_id: { [Op.iLike]: `%${query}%` } },
          { email: { [Op.iLike]: `%${query}%` } }
        ];
      }

      // Age range filter
      if (ageRange) {
        const { min, max } = ageRange;
        const now = new Date();
        const minDate = new Date(now.getFullYear() - max, now.getMonth(), now.getDate());
        const maxDate = new Date(now.getFullYear() - min, now.getMonth(), now.getDate());
        whereClause.date_of_birth = {
          [Op.between]: [minDate, maxDate]
        };
      }

      // Other filters
      if (gender) whereClause.gender = gender;
      if (bloodGroup) whereClause.blood_group = bloodGroup;
      if (status) whereClause.status = status;

      // Medical history filters
      if (hasChronicCondition || hasAllergy || lastVisitDate) {
        includeClause.push({
          model: MedicalHistory,
          as: 'medicalHistory',
          required: true,
          where: {
            ...(hasChronicCondition && {
              chronic_conditions: {
                [Op.not]: []
              }
            }),
            ...(hasAllergy && {
              allergies: {
                [Op.not]: []
              }
            }),
            ...(lastVisitDate && {
              created_at: {
                [Op.gte]: lastVisitDate
              }
            })
          }
        });
      }

      // Execute search
      const { count, rows } = await Patient.findAndCountAll({
        where: whereClause,
        include: includeClause,
        order: [[sortBy, sortOrder]],
        limit,
        offset: (page - 1) * limit
      });

      // Calculate search result ranking
      const rankedResults = this._rankSearchResults(rows, query);

      return {
        total: count,
        page,
        limit,
        results: rankedResults
      };
    } catch (error) {
      logger.error('Failed to search patients:', error);
      throw new Error('Failed to search patients');
    }
  }

  /**
   * Search medical history with advanced filtering
   * @param {Object} filters - Search filters
   * @param {Object} options - Search options (pagination, sorting)
   * @returns {Promise<Object>} Search results
   */
  async searchMedicalHistory(filters = {}, options = {}) {
    try {
      const {
        patientId,
        condition,
        medication,
        dateRange,
        sortBy = 'created_at',
        sortOrder = 'DESC',
        page = 1,
        limit = 10
      } = filters;

      const whereClause = {};

      // Patient filter
      if (patientId) {
        whereClause.patient_id = patientId;
      }

      // Condition search
      if (condition) {
        whereClause.chronic_conditions = {
          [Op.contains]: [{ condition: { [Op.iLike]: `%${condition}%` } }]
        };
      }

      // Medication search
      if (medication) {
        whereClause.medication_history = {
          [Op.contains]: [{ medication: { [Op.iLike]: `%${medication}%` } }]
        };
      }

      // Date range filter
      if (dateRange) {
        whereClause.created_at = {
          [Op.between]: [dateRange.start, dateRange.end]
        };
      }

      // Execute search
      const { count, rows } = await MedicalHistory.findAndCountAll({
        where: whereClause,
        include: [{
          model: Patient,
          as: 'patient',
          attributes: ['first_name', 'last_name', 'mrn']
        }],
        order: [[sortBy, sortOrder]],
        limit,
        offset: (page - 1) * limit
      });

      return {
        total: count,
        page,
        limit,
        results: rows
      };
    } catch (error) {
      logger.error('Failed to search medical history:', error);
      throw new Error('Failed to search medical history');
    }
  }

  /**
   * Rank search results based on relevance
   * @private
   */
  _rankSearchResults(results, query) {
    if (!query) return results;

    return results.map(result => {
      const score = this._calculateRelevanceScore(result, query);
      return {
        ...result.toJSON(),
        relevanceScore: score
      };
    }).sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Calculate relevance score for a result
   * @private
   */
  _calculateRelevanceScore(result, query) {
    let score = 0;
    const queryLower = query.toLowerCase();

    // Exact matches get higher scores
    if (result.first_name.toLowerCase() === queryLower) score += 10;
    if (result.last_name.toLowerCase() === queryLower) score += 10;
    if (result.mrn.toLowerCase() === queryLower) score += 15;
    if (result.abha_id.toLowerCase() === queryLower) score += 15;

    // Partial matches get lower scores
    if (result.first_name.toLowerCase().includes(queryLower)) score += 5;
    if (result.last_name.toLowerCase().includes(queryLower)) score += 5;
    if (result.mrn.toLowerCase().includes(queryLower)) score += 7;
    if (result.abha_id.toLowerCase().includes(queryLower)) score += 7;
    if (result.email.toLowerCase().includes(queryLower)) score += 3;

    return score;
  }
}

module.exports = new SearchService(); 