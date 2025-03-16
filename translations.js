export const lang = 'en';
export const translations = {
  QUESTION_TEXT: { de: 'Text/Frage', en: 'Text/Question'},
  ANSWER_ACTION_CONTINUE: { de: 'Video Fortsetzen', en: 'Continue video'},
  ANSWER_ACTION_GOTO_TIME: { de: 'Gehe zu Zeitpunkt ...', en: 'Go to time'},
  ANSWER_ACTION_GOTO_ANSWER: { de: 'Gehe zu Antwort', en: 'Go to answer'},
  ANSWER_DELETE: { de: 'Frage löschen', en: 'Delete question' },
  ANSWER_ADD: { de: 'Frage hinzufügen', en: 'Add Question' },
  CHOOSE_VIDEO_POSITION: { de: 'Wähle eine neue Position im Video Player', en: 'Choose offset position in video player'}
}

export function t(key) {
  return translations[key][lang];
}