import { SchedulerConfig } from '../types';
export declare class SchedulerService {
    /**
     * Schedule a workflow
     */
    scheduleWorkflow(config: SchedulerConfig): Promise<void>;
    /**
     * Get scheduled workflows
     */
    getScheduledWorkflows(tenantId: string): Promise<SchedulerConfig[]>;
    /**
     * Update schedule
     */
    updateSchedule(scheduleId: string, config: Partial<SchedulerConfig>): Promise<void>;
    /**
     * Delete schedule
     */
    deleteSchedule(scheduleId: string): Promise<void>;
}
//# sourceMappingURL=scheduler-service.d.ts.map