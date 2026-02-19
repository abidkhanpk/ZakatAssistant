import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

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
        {children}
      </NextIntlClientProvider>
    </div>
  );
}
