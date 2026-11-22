export type Locale = 'en' | 'bn';

export const messages = {
  en: {
    appName: 'PRAPTI',
    tagline: 'Your Benefits. Your Rights. Your Claim.',
    signIn: 'Sign in',
    signUp: 'Sign up',
    forgotPassword: 'Forgot password?',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm password',
    fullName: 'Full name',
    notConfigured:
      'Supabase is not configured. Set the required environment variables to continue.',
    errorGeneric: 'Something went wrong. Please try again.',
  },
  bn: {
    appName: 'PRAPTI',
    tagline: 'আপনার সুবিধা। আপনার অধিকার। আপনার দাবি।',
    signIn: 'সাইন ইন করুন',
    signUp: 'নিবন্ধন করুন',
    forgotPassword: 'পাসওয়ার্ড ভুলে গেছেন?',
    email: 'ইমেল',
    password: 'পাসওয়ার্ড',
    confirmPassword: 'পাসওয়ার্ড নিশ্চিত করুন',
    fullName: 'পুরো নাম',
    notConfigured:
      'Supabase কনফিগার করা নেই। এগিয়ে যেতে প্রয়োজনীয় পরিবেশ চলক সেট করুন।',
    errorGeneric: 'কিছু একটা ভুল হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
  },
} as const satisfies Record<Locale, Record<string, string>>;

export type MessageKey = keyof (typeof messages)['en'];

export function t(locale: Locale, key: MessageKey): string {
  return messages[locale][key];
}
