import { useAppData } from '../context/AppDataContext';

export default function LanguageToggle() {
  const { lang, setLang } = useAppData();

  return (
    <div className="language-toggle-wrapper">
      <button
        type="button"
        className={`lang-switch-btn ${lang === 'en' ? 'lang-switch-btn--active' : ''}`}
        onClick={() => setLang('en')}
        title="Switch to English"
      >
        EN
      </button>
      <span className="lang-switch-sep">/</span>
      <button
        type="button"
        className={`lang-switch-btn ${lang === 'ur' ? 'lang-switch-btn--active' : ''}`}
        onClick={() => setLang('ur')}
        title="اردو میں دیکھیں"
      >
        اردو
      </button>
    </div>
  );
}
