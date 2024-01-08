import { App } from '@slack/bolt';
import { handleMessage } from './modules/messageHandler';
import loadChannelConfigs from './modules/configLoader';
import * as dotenv from 'dotenv';

dotenv.config();
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
const isDebugMode = process.env.NODE_ENV !== 'production';
console.log(`Running in ${process.env.NODE_ENV} mode`);

const app = new App({
  socketMode: true,
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
});

const channelConfigs = loadChannelConfigs();
console.log('Loaded channel configurations');

if (isDebugMode) {
  console.log(JSON.stringify(channelConfigs, null, 2)); // 2 here represents the number of spaces for indentation
}

// Log the loaded channel configurations

(async () => {
  await app.start(process.env.PORT || 3000);
  console.log('Slack ⚡️ Bolt app is alive!!');
})();

app.message(async ({ message, say, client }) => {
  const customMessage = message as {
    thread_ts?: string;
    user: string;
    ts: string;
    channel: string;
    text: string;
    subtype?: string; // Additional property
  };

  if (
    typeof customMessage.thread_ts === 'undefined' &&
    channelConfigs.hasOwnProperty(customMessage.channel)
  ) {
    // Fetch user information
    const userInfo = await client.users.info({ user: customMessage.user });
    const username = userInfo.user.name; // Username of the user
    console.log(
      `Received message from user ${username} at ${customMessage.ts}`,
    ); // Log received message
    const priorityGroups = channelConfigs[customMessage.channel];

    if (priorityGroups) {
      for (const [_, configs] of Object.entries(priorityGroups).sort(
        ([a], [b]) => Number(a) - Number(b),
      )) {
        for (const [
          configName,
          { pattern, message: patternMessage },
        ] of Object.entries(configs)) {
          const regex = new RegExp(pattern, 'i');
          if (regex.test(customMessage.text)) {
            if (isDebugMode) {
              console.log(`[DEBUG] Pattern matched: ${pattern}`);
            }
            const subs = { __USER__: `<@${username}>` }; // Replace user ID with username
            await handleMessage(
              message,
              say,
              { pattern: regex.toString(), message: patternMessage },
              subs,
            );
            return;
          }
        }
      }
    }
  }
});
