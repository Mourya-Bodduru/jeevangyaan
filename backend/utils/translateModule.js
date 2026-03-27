import translate from 'google-translate-api-x';

/**
 * Translates a module object's translatable fields.
 * @param {Object} moduleObj - The module object to translate.
 * @param {string} lang - The target language code.
 * @returns {Promise<Object>} The translated module object.
 */
export const translateModule = async (moduleObj, lang) => {
    if (!lang || lang === 'en') return moduleObj;

    try {
        moduleObj.title = (await translate(moduleObj.title, { to: lang })).text;
        moduleObj.description = (await translate(moduleObj.description, { to: lang })).text;
        
        if (moduleObj.content) {
            moduleObj.content = (await translate(moduleObj.content, { to: lang })).text;
        }

        if (moduleObj.category) {
            moduleObj.originalCategory = moduleObj.category;
            moduleObj.category = (await translate(moduleObj.category, { to: lang })).text;
        }

        if (moduleObj.quiz && moduleObj.quiz.length > 0) {
            moduleObj.quiz = await Promise.all(moduleObj.quiz.map(async (q) => {
                q.question = (await translate(q.question, { to: lang })).text;
                q.options = await Promise.all(q.options.map(async (opt) => {
                    return (await translate(opt, { to: lang })).text;
                }));
                // CRITICAL: Translate correctAnswer so comparison in frontend/backend works for translated strings
                q.correctAnswer = (await translate(q.correctAnswer, { to: lang })).text;
                return q;
            }));
        }
    } catch (error) {
        console.error("Translation utility error:", error);
    }

    return moduleObj;
};
