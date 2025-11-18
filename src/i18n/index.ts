import { createI18n } from 'vue-i18n';

// Example messages
const messages = {
  en: {
    hello: 'Hello world',
    chat: {
      no_messages: 'No messages yet',
      messages: 'Messages',
      search_placeholder: 'Search messages',
      new_chat: 'New chat',
      load_error: 'Failed to load conversations',
      load_error_message: 'There was an error loading your conversations. Please try again.',
      no_conversations: 'No conversations',
      start_conversation: 'Start a new conversation',
      coming_soon: 'Coming soon',
      type_message: 'Type your message here',
    },
    common: {
      retry: 'Try Again'
    },
    time: {
      yesterday: 'Yesterday'
    }
  },
};

const i18n = createI18n({
  legacy: false, // you must set `false`, to use Composition API
  locale: 'en', // set locale
  fallbackLocale: 'en', // set fallback locale
  messages, // set locale messages
});

export default i18n;
