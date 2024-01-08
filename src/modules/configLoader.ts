import * as path from 'path';
import * as fs from 'fs';
import channelConfigMap from './channelConfigMap';

// Defines the structure of an individual configuration.
export interface PatternConfig {
    pattern: string;   // The regex pattern to match messages.
    message: string;   // The response message associated with the pattern.
    priority: number;  // Priority level of the configuration (pattern to match).
}

// Represents a collection of PatternConfig, keyed by a unique identifier.
export interface ChannelPatternConfig {
    [key: string]: PatternConfig;
}

/**
 * Loads and organizes Slack channel configurations from files.
 *
 * Each channel's configurations are sorted and grouped by their priority levels.
 * The function expects a mapping of channel IDs to configuration file paths.
 *
 * @returns {Object} An object where each key is a channel ID and its value is
 * another object mapping priorities to their respective configurations.
 */
const loadChannelConfigs = (): { [channelId: string]: { [priority: number]: ChannelPatternConfig } } => {
    let configs: { [channelId: string]: { [priority: number]: ChannelPatternConfig } } = {};
    const env = process.env.NODE_ENV || 'production';

    for (const configKey in channelConfigMap) {
        const channelId = channelConfigMap[configKey][env]; // Select channel ID based on environment

        console.log(`Loading configuration for channelId ${channelId}`);

        try {
            // Constructing the file path for the configuration file.
            const configFile = path.join(__dirname, '..', 'config', `${configKey}.json`);

            // Reading and parsing the configuration file.
            const channelConfig: ChannelPatternConfig = JSON.parse(fs.readFileSync(configFile, 'utf-8'));

            // Grouping configurations by their priority levels.
            const groupedConfigs = Object.entries(channelConfig).reduce((acc, [configName, config]) => {
                const priority = config.priority;

                if (!acc[priority]) {
                    acc[priority] = {};
                }

                acc[priority][configName] = config;
                return acc;
            }, {} as { [priority: number]: ChannelPatternConfig });

            // Assigning the grouped configurations to the respective channel ID.
            // configs[channelId] = groupedConfigs;

            if (!configs[channelId]) {
                configs[channelId] = groupedConfigs;
            } else {
                for (const [priority, configGroup] of Object.entries(groupedConfigs)) {
                    if (!configs[channelId][priority]) {
                        configs[channelId][priority] = configGroup;
                    } else {
                        // Merge configurations at the same priority level
                        configs[channelId][priority] = { ...configs[channelId][priority], ...configGroup };
                    }
                }
            }


        } catch (error) {
            // Logging errors encountered while loading a configuration.
            console.error(`Error loading configuration for ${configKey}:`, error);
        }
    }

    return configs;
};

export default loadChannelConfigs;
