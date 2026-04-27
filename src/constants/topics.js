// ============================================================
//  topics.js  —  Preset Legal Query Examples by Category
// ============================================================

export const TOPICS = {
  employment: [
    "Do I have a case for wrongful termination after being fired without notice?",
    "My employer is not paying overtime — do I have a valid labour law claim?",
    "Can I sue my employer for workplace harassment under Indian law?",
  ],
  tenancy: [
    "My landlord is refusing to return my security deposit — do I have a legal remedy?",
    "Can my landlord evict me without a court order under Indian tenancy law?",
    "My landlord entered my rented property without notice — is this illegal?",
  ],
  consumer: [
    "The company delivered a defective product and refuses a refund — do I have a case under Consumer Protection Act?",
    "An e-commerce platform debited my account but never delivered my order — what are my legal options?",
    "A service provider charged hidden fees not disclosed in the contract — can I claim compensation?",
  ],
  family: [
    "Can I claim maintenance from my spouse after separation under Section 125 CrPC?",
    "Do I have grounds to challenge a will that I believe was made under undue influence?",
    "My employer denied maternity leave as guaranteed under the Maternity Benefit Act — do I have a case?",
  ],
};

export const ALL_TOPICS = Object.values(TOPICS).flat();
export const TOPIC_CATEGORIES = Object.keys(TOPICS);