import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Gulzar, Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });
const gulzar = Gulzar({ weight: '400', subsets: ['arabic'] });

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: { locale: string } }) {
  const messages = await getMessages();
  const isUr = params.locale === 'ur';
  return (
    <div dir={isUr ? 'rtl' : 'ltr'} className={isUr ? gulzar.className : inter.className}>
      <NextIntlClientProvider locale={params.locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    </div>
  );
}
