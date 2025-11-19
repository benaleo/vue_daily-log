import { createI18n } from 'vue-i18n';

// Example messages
const messages = {
  en: {
    hello: 'Hello world',
    chat: {
      no_messages: 'No messages yet',
      messages: 'Messages',
      search_placeholder: 'Search messages',
      search_people_placeholder: 'Search people',
      search_people_instructions: 'Find people to chat with',
      no_results: 'No results',
      type_min_chars: 'Type at least {count} characters to search for people',
      new_chat: 'New chat',
      load_error: 'Failed to load conversations',
      load_error_message: 'There was an error loading your conversations. Please try again.',
      no_conversations: 'No conversations',
      start_conversation: 'Start a new conversation',
      coming_soon: 'Coming soon',
      type_message: 'Type your message here',
      unknown_user: 'unknown',
      menu: {
        view_profile: 'Detail',
        clear_chat: 'Clear Chat',
        end_chat: 'Delete'
      }
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
