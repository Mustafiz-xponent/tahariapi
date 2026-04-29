"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startSubscriptionRenewalJob = exports.renewSubscriptions = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const prismaClient_1 = __importDefault(require("../prisma-client/prismaClient"));
const logger_1 = __importDefault(require("../utils/logger"));
const processSubscription_1 = require("../utils/processSubscription");
// Configuration
const CONFIG = {
    BATCH_SIZE: 100, // Number of subscriptions to process per batch
    TIMEZONE: "Asia/Dhaka",
    CRON_SCHEDULE: "0 2 * * *", // Run at 2 AM every day
    // CRON_SCHEDULE: "* * * * *", // Run at every minute for testing
    MAX_RETRIES: 3,
    CONCURRENT_BATCHES: 5, // Process multiple batches concurrently
};
// Batch processing functions
const fetchSubscriptionBatch = async (skip, batchSize, today) => {
    return prismaClient_1.default.subscription.findMany({
        where: {
            status: "ACTIVE",
            renewalDate: { lte: today },
            isProcessing: false,
        },
        include: {
            customer: {
                include: {
                    wallet: {
                        select: {
                            walletId: true,
                            balance: true,
                            lockedBalance: true,
                            customerId: true,
                        },
                    },
                },
            },
            subscriptionPlan: {
                select: {
                    planId: true,
                    price: true,
                    frequency: true,
                    productId: true,
                },
            },
        },
        take: batchSize,
        skip,
        orderBy: { renewalDate: "asc" },
    });
};
const processSubscriptionBatch = async (subscriptions, today) => {
    const processWithRetry = async (subscription, retries = 0) => {
        try {
            await (0, processSubscription_1.updateSubscriptionProcessing)(subscription.subscriptionId, true);
            await processSingleSubscription(subscription, today);
            return {
                success: true,
                subscriptionId: subscription.subscriptionId,
            };
        }
        catch (error) {
            console.log(error);
            if (retries < CONFIG.MAX_RETRIES) {
                logger_1.default.warn(`Retrying subscription ${subscription.subscriptionId}, attempt ${retries + 1}`);
                return processWithRetry(subscription, retries + 1);
            }
            await (0, processSubscription_1.updateSubscriptionProcessing)(subscription.subscriptionId, false);
            return {
                success: false,
                subscriptionId: subscription.subscriptionId,
                error: error,
            };
        }
    };
    return Promise.allSettled(subscriptions.map((subscription) => processWithRetry(subscription))).then((results) => results.map((result) => result.status === "fulfilled"
        ? result.value
        : {
            success: false,
            subscriptionId: BigInt(0),
            error: new Error("Promise rejected"),
        }));
};
// Main processing functions
const processSingleSubscription = async (subscription, today) => {
    const paymentMethod = subscription.paymentMethod;
    const processors = {
        WALLET: () => (0, processSubscription_1.handleWalletPayment)(subscription, today),
        COD: () => (0, processSubscription_1.handleCODPayment)(subscription, today),
    };
    const processor = processors[paymentMethod];
    if (!processor) {
        throw new Error(`Unsupported payment method: ${paymentMethod}`);
    }
    await processor();
};
// Main renewal function
const renewSubscriptions = async (today = new Date()) => {
    logger_1.default.info(`Starting subscription renewal for ${today.toISOString()}`);
    const processAllBatches = async () => {
        let skip = 0;
        let totalProcessed = 0;
        let totalSuccessful = 0;
        let totalFailed = 0;
        while (true) {
            const batches = await Promise.all(Array.from({ length: CONFIG.CONCURRENT_BATCHES }, (_, i) => fetchSubscriptionBatch(skip + i * CONFIG.BATCH_SIZE, CONFIG.BATCH_SIZE, today)));
            const allSubscriptions = batches.flat();
            if (allSubscriptions.length === 0) {
                break;
            }
            // Process batches concurrently
            const batchResults = await Promise.all(batches
                .filter((batch) => batch.length > 0)
                .map((batch) => processSubscriptionBatch(batch, today)));
            // Collect results
            const results = batchResults.flat();
            const successful = results.filter((r) => r.success).length;
            const failed = results.filter((r) => !r.success).length;
            totalProcessed += results.length;
            totalSuccessful += successful;
            totalFailed += failed;
            // Log failed subscriptions
            results
                .filter((r) => !r.success)
                .forEach((r) => logger_1.default.error(`Failed to process subscription ${r.subscriptionId}:`, r.error));
            skip += CONFIG.CONCURRENT_BATCHES * CONFIG.BATCH_SIZE;
            logger_1.default.info(`Processed batch: ${results.length} subscriptions (${successful} successful, ${failed} failed)`);
        }
        logger_1.default.info(`Subscription renewal completed: ${totalProcessed} total, ${totalSuccessful} successful, ${totalFailed} failed`);
    };
    try {
        await processAllBatches();
    }
    catch (error) {
        logger_1.default.error("Critical error in subscription renewal:", error);
        throw error;
    }
};
exports.renewSubscriptions = renewSubscriptions;
// Cron job starter
const startSubscriptionRenewalJob = () => {
    node_cron_1.default.schedule(CONFIG.CRON_SCHEDULE, async () => {
        try {
            await (0, exports.renewSubscriptions)();
        }
        catch (error) {
            logger_1.default.error("Subscription cron failed:", error);
            // TODO: send notification to admin if needed
        }
    }, {
        timezone: CONFIG.TIMEZONE,
    });
};
exports.startSubscriptionRenewalJob = startSubscriptionRenewalJob;
