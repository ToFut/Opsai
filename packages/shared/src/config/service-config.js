"use strict";
/**
 * CORE Platform Service Configuration
 * Handles both shared infrastructure and BYOI (Bring Your Own Infrastructure) modes
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceConfigValidator = exports.DEFAULT_SERVICE_CONFIGS = void 0;
/**
 * Default service configurations for different modes
 */
exports.DEFAULT_SERVICE_CONFIGS = {
    shared: {
        mode: 'shared',
        database: {
            provider: 'core-managed'
        },
        auth: {
            provider: 'core-supabase'
        },
        storage: {
            provider: 'core-supabase'
        }
    },
    byoi: {
        mode: 'byoi',
        database: {
            provider: 'user-postgresql'
        },
        auth: {
            provider: 'user-supabase'
        },
        storage: {
            provider: 'user-s3'
        }
    },
    hybrid: {
        mode: 'hybrid',
        database: {
            provider: 'core-managed' // Development
        },
        auth: {
            provider: 'core-supabase' // Development
        },
        storage: {
            provider: 'core-supabase' // Development
        }
    }
};
/**
 * Validation functions for service configurations
 */
class ServiceConfigValidator {
    static validate(config) {
        const errors = [];
        // Validate database configuration
        if (config.database.provider !== 'core-managed' && !config.database.url) {
            errors.push('Database URL is required for user-provided database');
        }
        // Validate auth configuration
        if (config.auth.provider === 'user-supabase') {
            if (!config.auth.supabaseUrl || !config.auth.supabaseAnonKey) {
                errors.push('Supabase URL and anon key are required for user-provided Supabase');
            }
        }
        // Validate integrations
        config.integrations.forEach((integration, index) => {
            if (integration.mode === 'user-api-key' && !integration.credentials) {
                // Allow integrations without credentials if they're expected to be provided via environment variables
                console.warn(`Integration '${integration.name}' will require credentials via environment variables`);
            }
        });
        return {
            valid: errors.length === 0,
            errors
        };
    }
}
exports.ServiceConfigValidator = ServiceConfigValidator;
//# sourceMappingURL=service-config.js.map