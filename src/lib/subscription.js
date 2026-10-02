export const getPlan = (user) => {
  if (user?.plan === 'premium') return 'premium';
  if (user?.premium_until) {
    const until = new Date(user.premium_until);
    if (!isNaN(until.getTime()) && until > new Date()) return 'premium';
  }
  return 'free';
};
export const isPremium = (user) => getPlan(user) === 'premium';
export const planLabel = (user) => (isPremium(user) ? 'Plan Premium' : 'Plan Gratis');