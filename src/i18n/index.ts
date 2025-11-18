import { createI18n } from 'vue-i18n';

// Example messages
const messages = {
  en: {
    message: {
      hello: 'Hello world',
      chat: {
        no_messages: 'No messages yet',
        // Add more chat-related translations here
      }
    }
  },
  // Add more languages as needed
};

const i18n = createI18n({
  legacy: false, // you must set `false`, to use Composition API
  locale: 'en', // set locale
  fallbackLocale: 'en', // set fallback locale
  messages, // set locale messages
});

export default i18n;
