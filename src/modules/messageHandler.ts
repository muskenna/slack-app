// messageHandler.ts
import { MessageEvent, SayFn } from '@slack/bolt';

interface PatternInfo {
    pattern: string;
    message: string;
}

/**
 * Handles incoming Slack messages based on predefined patterns.
 *
 * This function is triggered for each message that matches a specific pattern. It generates a response
 * text by substituting variables in the pattern's message template with actual values from the `subs` object
 * and then sends this response back to the Slack channel.
 *
 * @param {string} key - The key identifying the matched pattern.
 * @param {MessageEvent} message - The Slack message event object, containing details of the received message.
 * @param {SayFn} say - The Bolt framework's function for sending messages.
 * @param {PatternInfo} patternInfo - Contains the regular expression pattern and the associated message template.
 * @param {object} subs - An object containing key-value pairs used for substituting variables in the message template.
 */
export const handleMessage = async (message: MessageEvent, say: SayFn, patternInfo: PatternInfo, subs: { [key: string]: string }) => {
    // Replace placeholders in the template with actual values from subs
    // Updated regex to match the entire placeholder including double underscores
    let text = patternInfo.message.replace(/(__[A-Z_]+__)/g, (match) => subs[match] || match);
    console.log(`Sending message to channel ${message.channel} under parent message id ${message.ts}`);

    // Send the response to the Slack channel
    await say({
        channel: message.channel,
        text: text,
        thread_ts: message.ts // Timestamp of the parent message for responding in the thread of the received message
    });
};
