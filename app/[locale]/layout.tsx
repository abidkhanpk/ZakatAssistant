import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { getCurrentUser } from '@/lib/auth';
import { TopRightControls } from '@/components/top-right-controls';
import { Breadcrumbs } from '@/components/breadcrumbs';

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: { locale: string } }) {
  const messages = await getMessages();
  const isUr = params.locale === 'ur';
  const user = await getCurrentUser();

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
        <TopRightControls
          locale={isUr ? 'ur' : 'en'}
          user={
            user
              ? {
                  name: user.name,
                  username: user.username,
                  role: user.role
                }
              : null
          }
        />
        <div className="mx-auto max-w-6xl px-4 pt-14">
          <Breadcrumbs locale={isUr ? 'ur' : 'en'} />
        </div>
        {children}
      </NextIntlClientProvider>
    </div>
  );
}
