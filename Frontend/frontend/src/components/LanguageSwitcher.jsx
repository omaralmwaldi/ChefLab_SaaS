import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/useAuth';
import client from '../api/client';

function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const { token } = useAuth();
  const current = i18n.language === 'ar' ? 'ar' : 'en';

  async function switchTo(lang) {
    if (current === lang) return;
    await i18n.changeLanguage(lang);
    if (token) {
      client.patch('/auth/language', { preferredLanguage: lang }).catch(() => {});
    }
  }

  return (
    <div className="flex rounded-lg border border-stone-200 bg-stone-50 p-0.5">
      {['en', 'ar'].map((lang) => (
        <button
          key={lang}
          onClick={() => switchTo(lang)}
          className={`cursor-pointer rounded-md px-3 py-1 text-sm font-medium transition-colors ${
            current === lang
              ? 'bg-white text-stone-800 shadow-sm'
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          {lang === 'en' ? 'EN' : 'AR'}
        </button>
      ))}
    </div>
  );
}

export default LanguageSwitcher;
