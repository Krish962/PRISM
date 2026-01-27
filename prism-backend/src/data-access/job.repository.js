const jobs = new Map();

const createJob = (jobData) => {
  const jobId = `JOB_${Date.now()}`;

  jobs.set(jobId, {
    job_id: jobId,
    status: "PENDING",
    submitted_at: new Date(),
    ...jobData
  });

  return jobs.get(jobId);
};  

const getJobById = (jobId) => {
  return jobs.get(jobId);
};

const updateJobStatus = (jobId, status) => {
  const job = jobs.get(jobId);
  if (!job) throw new Error("Job not found");

  job.status = status;
  if (status === "COMPLETED") {
    job.completed_at = new Date();
  }
};

const saveJobResult = (jobId, result) => {
  const job = jobs.get(jobId);
  if (!job) throw new Error("Job not found");

  job.result = result;
};

const getNextPendingJob = () => {
  for (const job of jobs.values()) {
    if (job.status === "PENDING") {
      return job;
    }
  }
  return null;
};

module.exports = {
  createJob,
  getJobById,
  updateJobStatus,
  saveJobResult,
  getNextPendingJob
};
