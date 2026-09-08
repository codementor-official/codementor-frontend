export const MINI_CHAT_SETTING_CHANGED = 'codementor:mini-chat-setting-changed';

export function announceMiniChatSetting(enabled: boolean) {
  window.dispatchEvent(new CustomEvent(MINI_CHAT_SETTING_CHANGED, { detail: { enabled } }));
}
