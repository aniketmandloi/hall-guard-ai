"server only";

import { prisma } from "@/prisma/db";
import {
  AnalysisResultCreateInput,
  AnalysisResultUpdateInput,
  AnalysisResultQueryInput,
  FactCheckSourceCreateInput,
  AnalysisResultWithRelations,
  ConsensusResult,
  ApiResponse,
  PaginatedResponse,
  analysisResultCreateSchema,
  analysisResultUpdateSchema,
  analysisResultQuerySchema,
  factCheckSourceCreateSchema,
} from "@/lib/types/database";
import {
  AnalysisResult,
  FactCheckSource,
  AnalysisType,
  RiskLevel,
} from "@prisma/client";

/**
 * Create a new analysis result
 */
export const createAnalysisResult = async (
  input: AnalysisResultCreateInput
): Promise<ApiResponse<AnalysisResult>> => {
  try {
    console.log("Creating analysis result with data:", input);

    // Validate input
    const validatedInput = analysisResultCreateSchema.parse(input);

    const analysisResult = await prisma.analysisResult.create({
      data: validatedInput,
    });

    console.log("Analysis result created successfully:", analysisResult.id);
    return { success: true, data: analysisResult };
  } catch (error: any) {
    console.error("Error creating analysis result:", error);
    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }
};

/**
 * Create multiple analysis results in a transaction
 */
export const createAnalysisResults = async (
  inputs: AnalysisResultCreateInput[]
): Promise<ApiResponse<AnalysisResult[]>> => {
  try {
    console.log("Creating multiple analysis results:", inputs.length);

    // Validate all inputs
    const validatedInputs = inputs.map((input) =>
      analysisResultCreateSchema.parse(input)
    );

    const analysisResults = await prisma.$transaction(
      validatedInputs.map((input) =>
        prisma.analysisResult.create({
          data: input,
        })
      )
    );

    console.log(
      "Multiple analysis results created successfully:",
      analysisResults.length
    );
    return { success: true, data: analysisResults };
  } catch (error: any) {
    console.error("Error creating multiple analysis results:", error);
    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }
};

/**
 * Update an analysis result
 */
export const updateAnalysisResult = async (
  id: number,
  input: AnalysisResultUpdateInput
): Promise<ApiResponse<AnalysisResult>> => {
  try {
    console.log("Updating analysis result ID:", id, "with data:", input);

    // Validate input
    const validatedInput = analysisResultUpdateSchema.parse(input);

    const analysisResult = await prisma.analysisResult.update({
      where: { id },
      data: validatedInput,
    });

    console.log("Analysis result updated successfully:", analysisResult.id);
    return { success: true, data: analysisResult };
  } catch (error: any) {
    console.error("Error updating analysis result:", error);
    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }
};

/**
 * Get analysis result by ID with relations
 */
export const getAnalysisResultById = async (
  id: number,
  includeRelations = true
): Promise<ApiResponse<AnalysisResult | AnalysisResultWithRelations>> => {
  try {
    console.log("Fetching analysis result by ID:", id);

    const analysisResult = await prisma.analysisResult.findUnique({
      where: { id },
      include: includeRelations
        ? {
            document: true,
            chunk: true,
            factCheckSources: true,
            comments: {
              include: {
                user: {
                  select: {
                    userId: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                  },
                },
              },
              orderBy: { createdTime: "desc" },
            },
          }
        : undefined,
    });

    if (!analysisResult) {
      return {
        success: false,
        error: "Analysis result not found",
        code: "ANALYSIS_RESULT_NOT_FOUND",
      };
    }

    return { success: true, data: analysisResult };
  } catch (error: any) {
    console.error("Error fetching analysis result:", error);
    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }
};

/**
 * Query analysis results with filtering and pagination
 */
export const queryAnalysisResults = async (
  query: AnalysisResultQueryInput
): Promise<ApiResponse<PaginatedResponse<AnalysisResultWithRelations>>> => {
  try {
    console.log("Querying analysis results with parameters:", query);

    // Validate query parameters
    const validatedQuery = analysisResultQuerySchema.parse(query);

    // Build where clause
    const whereClause: any = {};

    if (validatedQuery.documentId) {
      whereClause.documentId = validatedQuery.documentId;
    }

    if (validatedQuery.chunkId) {
      whereClause.chunkId = validatedQuery.chunkId;
    }

    if (validatedQuery.analysisType) {
      whereClause.analysisType = validatedQuery.analysisType;
    }

    if (validatedQuery.isFlagged !== undefined) {
      whereClause.isFlagged = validatedQuery.isFlagged;
    }

    if (validatedQuery.riskLevel) {
      whereClause.riskLevel = validatedQuery.riskLevel;
    }

    if (
      validatedQuery.minConfidence !== undefined ||
      validatedQuery.maxConfidence !== undefined
    ) {
      whereClause.confidenceScore = {};
      if (validatedQuery.minConfidence !== undefined) {
        whereClause.confidenceScore.gte = validatedQuery.minConfidence;
      }
      if (validatedQuery.maxConfidence !== undefined) {
        whereClause.confidenceScore.lte = validatedQuery.maxConfidence;
      }
    }

    // Get total count
    const total = await prisma.analysisResult.count({
      where: whereClause,
    });

    // Get analysis results with pagination
    const analysisResults = await prisma.analysisResult.findMany({
      where: whereClause,
      include: {
        document: true,
        chunk: true,
        factCheckSources: true,
        comments: {
          take: 3,
          orderBy: { createdTime: "desc" },
        },
      },
      orderBy: [
        { isFlagged: "desc" },
        { riskLevel: "desc" },
        { createdTime: "desc" },
      ],
      take: validatedQuery.limit,
      skip: validatedQuery.offset,
    });

    const page = Math.floor(validatedQuery.offset / validatedQuery.limit) + 1;
    const hasNext = validatedQuery.offset + validatedQuery.limit < total;
    const hasPrevious = validatedQuery.offset > 0;

    const result: PaginatedResponse<AnalysisResultWithRelations> = {
      items: analysisResults as AnalysisResultWithRelations[],
      total,
      page,
      limit: validatedQuery.limit,
      hasNext,
      hasPrevious,
    };

    console.log(
      `Analysis results query completed: ${analysisResults.length} items, total: ${total}`
    );
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Error querying analysis results:", error);
    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }
};

/**
 * Get analysis results for a document
 */
export const getDocumentAnalysisResults = async (
  documentId: number,
  flaggedOnly = false,
  limit = 50,
  offset = 0
): Promise<ApiResponse<PaginatedResponse<AnalysisResultWithRelations>>> => {
  try {
    console.log("Fetching analysis results for document:", documentId);

    const queryParams: AnalysisResultQueryInput = {
      documentId,
      limit,
      offset,
    };

    if (flaggedOnly) {
      queryParams.isFlagged = true;
    }

    return await queryAnalysisResults(queryParams);
  } catch (error: any) {
    console.error("Error fetching document analysis results:", error);
    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }
};

/**
 * Get flagged analysis results by risk level
 */
export const getFlaggedAnalysisResultsByRisk = async (
  riskLevel?: RiskLevel,
  limit = 20,
  offset = 0
): Promise<ApiResponse<PaginatedResponse<AnalysisResultWithRelations>>> => {
  try {
    console.log("Fetching flagged analysis results by risk level:", riskLevel);

    const queryParams: AnalysisResultQueryInput = {
      isFlagged: true,
      riskLevel,
      limit,
      offset,
    };

    return await queryAnalysisResults(queryParams);
  } catch (error: any) {
    console.error("Error fetching flagged analysis results:", error);
    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }
};

/**
 * Create a fact check source
 */
export const createFactCheckSource = async (
  input: FactCheckSourceCreateInput
): Promise<ApiResponse<FactCheckSource>> => {
  try {
    console.log("Creating fact check source with data:", input);

    // Validate input
    const validatedInput = factCheckSourceCreateSchema.parse(input);

    const factCheckSource = await prisma.factCheckSource.create({
      data: validatedInput,
    });

    console.log("Fact check source created successfully:", factCheckSource.id);
    return { success: true, data: factCheckSource };
  } catch (error: any) {
    console.error("Error creating fact check source:", error);
    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }
};

/**
 * Create multiple fact check sources in a transaction
 */
export const createFactCheckSources = async (
  inputs: FactCheckSourceCreateInput[]
): Promise<ApiResponse<FactCheckSource[]>> => {
  try {
    console.log("Creating multiple fact check sources:", inputs.length);

    // Validate all inputs
    const validatedInputs = inputs.map((input) =>
      factCheckSourceCreateSchema.parse(input)
    );

    const factCheckSources = await prisma.$transaction(
      validatedInputs.map((input) =>
        prisma.factCheckSource.create({
          data: input,
        })
      )
    );

    console.log(
      "Multiple fact check sources created successfully:",
      factCheckSources.length
    );
    return { success: true, data: factCheckSources };
  } catch (error: any) {
    console.error("Error creating multiple fact check sources:", error);
    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }
};

/**
 * Get fact check sources for an analysis result
 */
export const getFactCheckSources = async (
  analysisResultId: number
): Promise<ApiResponse<FactCheckSource[]>> => {
  try {
    console.log(
      "Fetching fact check sources for analysis result:",
      analysisResultId
    );

    const sources = await prisma.factCheckSource.findMany({
      where: { analysisResultId },
      orderBy: [{ confidenceScore: "desc" }, { retrievedAt: "desc" }],
    });

    return { success: true, data: sources };
  } catch (error: any) {
    console.error("Error fetching fact check sources:", error);
    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }
};

/**
 * Calculate consensus from multiple analysis results
 */
export const calculateConsensus = async (
  documentId: number,
  analysisType?: AnalysisType
): Promise<ApiResponse<ConsensusResult>> => {
  try {
    console.log(
      "Calculating consensus for document:",
      documentId,
      "type:",
      analysisType
    );

    // Get analysis results for the document
    const whereClause: any = { documentId };
    if (analysisType) {
      whereClause.analysisType = analysisType;
    }

    const analysisResults = await prisma.analysisResult.findMany({
      where: whereClause,
      include: {
        factCheckSources: true,
      },
    });

    if (analysisResults.length === 0) {
      return {
        success: false,
        error: "No analysis results found",
        code: "NO_ANALYSIS_RESULTS",
      };
    }

    // Calculate consensus
    const flaggedResults = analysisResults.filter((result) => result.isFlagged);
    const totalResults = analysisResults.length;
    const flaggedCount = flaggedResults.length;

    // Calculate agreement percentage
    const agreement = flaggedCount / totalResults;

    // Calculate weighted confidence score
    const confidenceScores = analysisResults
      .map((result) => result.confidenceScore)
      .filter((score) => score !== null)
      .map((score) => Number(score));

    const avgConfidence =
      confidenceScores.length > 0
        ? confidenceScores.reduce((sum, score) => sum + score, 0) /
          confidenceScores.length
        : 0;

    // Determine if consensus is reached (majority agreement)
    const consensusReached = agreement >= 0.5;

    // Determine recommended action
    let recommendedAction: "approve" | "review" | "reject";
    if (agreement >= 0.75) {
      recommendedAction = "reject"; // High agreement on issues
    } else if (agreement >= 0.25) {
      recommendedAction = "review"; // Some disagreement
    } else {
      recommendedAction = "approve"; // Low agreement on issues
    }

    // Find conflicting results (where some flagged, some not)
    const conflictingResults = consensusReached ? [] : analysisResults;

    const consensusResult: ConsensusResult = {
      finalConfidence: avgConfidence,
      consensusReached,
      agreement,
      conflictingResults,
      recommendedAction,
    };

    console.log("Consensus calculation completed:", consensusResult);
    return { success: true, data: consensusResult };
  } catch (error: any) {
    console.error("Error calculating consensus:", error);
    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }
};

/**
 * Get analysis statistics for dashboard
 */
export const getAnalysisStatistics = async (
  documentId?: number,
  timeRange?: { start: Date; end: Date }
): Promise<
  ApiResponse<{
    total: number;
    flagged: number;
    byType: Record<AnalysisType, number>;
    byRiskLevel: Record<RiskLevel, number>;
    averageConfidence: number;
    averageProcessingTime: number;
  }>
> => {
  try {
    console.log("Fetching analysis statistics for document:", documentId);

    const whereClause: any = {};
    if (documentId) {
      whereClause.documentId = documentId;
    }
    if (timeRange) {
      whereClause.createdTime = {
        gte: timeRange.start,
        lte: timeRange.end,
      };
    }

    const [
      total,
      flagged,
      typeCounts,
      riskCounts,
      confidenceAvg,
      processingTimeAvg,
    ] = await Promise.all([
      prisma.analysisResult.count({ where: whereClause }),

      prisma.analysisResult.count({
        where: { ...whereClause, isFlagged: true },
      }),

      prisma.analysisResult.groupBy({
        by: ["analysisType"],
        where: whereClause,
        _count: { analysisType: true },
      }),

      prisma.analysisResult.groupBy({
        by: ["riskLevel"],
        where: { ...whereClause, riskLevel: { not: null } },
        _count: { riskLevel: true },
      }),

      prisma.analysisResult.aggregate({
        where: { ...whereClause, confidenceScore: { not: null } },
        _avg: { confidenceScore: true },
      }),

      prisma.analysisResult.aggregate({
        where: { ...whereClause, processingTimeMs: { not: null } },
        _avg: { processingTimeMs: true },
      }),
    ]);

    // Convert grouped results to record format
    const byType = Object.values(AnalysisType).reduce((acc, type) => {
      const found = typeCounts.find((item) => item.analysisType === type);
      acc[type] = found?._count.analysisType || 0;
      return acc;
    }, {} as Record<AnalysisType, number>);

    const byRiskLevel = Object.values(RiskLevel).reduce((acc, level) => {
      const found = riskCounts.find((item) => item.riskLevel === level);
      acc[level] = found?._count.riskLevel || 0;
      return acc;
    }, {} as Record<RiskLevel, number>);

    const statistics = {
      total,
      flagged,
      byType,
      byRiskLevel,
      averageConfidence: confidenceAvg._avg.confidenceScore
        ? Number(confidenceAvg._avg.confidenceScore)
        : 0,
      averageProcessingTime: processingTimeAvg._avg.processingTimeMs || 0,
    };

    console.log("Analysis statistics fetched successfully");
    return { success: true, data: statistics };
  } catch (error: any) {
    console.error("Error fetching analysis statistics:", error);
    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }
};

/**
 * Delete analysis result and related data
 */
export const deleteAnalysisResult = async (
  id: number
): Promise<ApiResponse<void>> => {
  try {
    console.log("Deleting analysis result ID:", id);

    await prisma.analysisResult.delete({
      where: { id },
    });

    console.log("Analysis result deleted successfully:", id);
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting analysis result:", error);
    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }
};
