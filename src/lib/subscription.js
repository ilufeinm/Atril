export const getPlan = (user) => (user?.plan === 'premium' ? 'premium' : 'free');
export const isPremium = (user) => getPlan(user) === 'premium';
export const planLabel = (user) => (isPremium(user) ? 'Plan Premium' : 'Plan Gratis');