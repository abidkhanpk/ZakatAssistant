import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { LanguageSwitcher } from '@/components/language-switcher';

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: { locale: string } }) {
  const messages = await getMessages();
  const isUr = params.locale === 'ur';

  return (
    <div
      dir={isUr ? 'rtl' : 'ltr'}
      style={{
        fontFamily: isUr
          ? '"Gulzar", "Noto Nastaliq Urdu", "Noto Naskh Arabic", Georgia, serif'
          : 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif'
      }}
    >
      <NextIntlClientProvider locale={params.locale} messages={messages}>
        <LanguageSwitcher locale={isUr ? 'ur' : 'en'} />
        {children}
      </NextIntlClientProvider>
    </div>
  );
}
