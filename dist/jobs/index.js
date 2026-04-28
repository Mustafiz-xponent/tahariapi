"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initJobs = initJobs;
const subscription_job_1 = require("../jobs/subscription.job");
function initJobs() {
    (0, subscription_job_1.startSubscriptionRenewalJob)();
}
