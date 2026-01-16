export interface Virtue {
  id: string;
  name: string;
  description: string;
  fullDescription: string;
  context: string;
  quote: string;
}

export const VIRTUES: Virtue[] = [
  {
    id: 'temperance',
    name: 'Temperance',
    description: 'Eat not to dullness; drink not to elevation.',
    fullDescription: 'Eat not to dullness; drink not to elevation.',
    context: 'Franklin placed Temperance first as it cultivates the clearness of head necessary for constant vigilance against vice. By avoiding excess in food and drink, one maintains the mental clarity required to practice all other virtues.',
    quote: 'To lengthen thy life, lessen thy meals.',
  },
  {
    id: 'silence',
    name: 'Silence',
    description: 'Speak not but what may benefit others or yourself.',
    fullDescription: 'Speak not but what may benefit others or yourself; avoid trifling conversation.',
    context: 'Franklin sought to break his habit of prattling and jesting, which made him vulgar company. Silence prevents hasty words and allows one to gain knowledge by listening rather than always speaking.',
    quote: 'Remember not only to say the right thing in the right place, but far more difficult still, to leave unsaid the wrong thing at the tempting moment.',
  },
  {
    id: 'order',
    name: 'Order',
    description: 'Let all your things have their places.',
    fullDescription: 'Let all your things have their places; let each part of your business have its time.',
    context: 'This was the virtue Franklin found most difficult. As a busy tradesman and writer, he struggled with systematic arrangement. Yet he recognized that order in physical space and time creates efficiency and peace of mind.',
    quote: 'A place for everything, everything in its place.',
  },
  {
    id: 'resolution',
    name: 'Resolution',
    description: 'Resolve to perform what you ought.',
    fullDescription: 'Resolve to perform what you ought; perform without fail what you resolve.',
    context: 'Resolution bridges intention and action. Franklin emphasized that promises made must be kept, especially those made to oneself. This virtue strengthens the will and builds self-trust.',
    quote: 'Be at war with your vices, at peace with your neighbors, and let every new year find you a better man.',
  },
  {
    id: 'frugality',
    name: 'Frugality',
    description: 'Make no expense but to do good to others or yourself.',
    fullDescription: 'Make no expense but to do good to others or yourself; waste nothing.',
    context: 'Franklin understood frugality not as miserliness but as wise stewardship. Every expense should serve a purpose—whether benefiting oneself, others, or society. This principle enabled his financial independence.',
    quote: 'Beware of little expenses; a small leak will sink a great ship.',
  },
  {
    id: 'industry',
    name: 'Industry',
    description: 'Lose no time; be always employed in something useful.',
    fullDescription: 'Lose no time; be always employed in something useful; cut off all unnecessary actions.',
    context: 'Industry is the active complement to frugality. Franklin believed that time is the stuff life is made of, and wasting time is wasting life itself. Purposeful employment of every hour was his standard.',
    quote: 'Lost time is never found again.',
  },
  {
    id: 'sincerity',
    name: 'Sincerity',
    description: 'Use no hurtful deceit.',
    fullDescription: 'Use no hurtful deceit; think innocently and justly, and, if you speak, speak accordingly.',
    context: 'Sincerity requires alignment between thought, word, and deed. Franklin insisted on honest thinking before honest speaking. This virtue guards against self-deception as much as deceiving others.',
    quote: 'Honesty is the best policy.',
  },
  {
    id: 'justice',
    name: 'Justice',
    description: 'Wrong none by doing injuries.',
    fullDescription: 'Wrong none by doing injuries, or omitting the benefits that are your duty.',
    context: 'Justice encompasses both avoiding harm and fulfilling positive obligations. Franklin recognized that neglecting duties owed to others is as unjust as actively harming them. Both commission and omission matter.',
    quote: 'Justice will not be served until those who are unaffected are as outraged as those who are.',
  },
  {
    id: 'moderation',
    name: 'Moderation',
    description: 'Avoid extremes.',
    fullDescription: 'Avoid extremes; forbear resenting injuries so much as you think they deserve.',
    context: 'Moderation guards against zealotry and disproportionate response. Franklin counseled restraint even when wronged, recognizing that excessive resentment harms the bearer more than the offender.',
    quote: 'The best doctor gives the least medicines.',
  },
  {
    id: 'cleanliness',
    name: 'Cleanliness',
    description: 'Tolerate no uncleanliness in body, clothes, or habitation.',
    fullDescription: 'Tolerate no uncleanliness in body, clothes, or habitation.',
    context: 'Franklin believed cleanliness reflects and reinforces internal discipline. A clean person, living in clean surroundings, maintains dignity and self-respect while showing respect for others.',
    quote: 'Cleanliness is next to godliness.',
  },
  {
    id: 'tranquility',
    name: 'Tranquility',
    description: 'Be not disturbed at trifles.',
    fullDescription: 'Be not disturbed at trifles, or at accidents common or unavoidable.',
    context: 'Tranquility preserves mental peace by distinguishing what deserves emotional response from what does not. Small annoyances and inevitable misfortunes should not disturb the rational mind.',
    quote: 'He that can have patience can have what he will.',
  },
  {
    id: 'chastity',
    name: 'Chastity',
    description: 'Rarely use venery but for health or offspring.',
    fullDescription: 'Rarely use venery but for health or offspring, never to dullness, weakness, or the injury of your own or another\'s peace or reputation.',
    context: 'Franklin approached this virtue with practicality rather than puritanism. The concern was avoiding excess that dulls the mind, weakens the body, or causes harm to oneself or others.',
    quote: 'Keep your eyes wide open before marriage, half shut afterwards.',
  },
  {
    id: 'humility',
    name: 'Humility',
    description: 'Imitate Jesus and Socrates.',
    fullDescription: 'Imitate Jesus and Socrates.',
    context: 'Franklin added this virtue last, after a Quaker friend told him he was generally thought proud. He never mastered it fully but valued the appearance of humility, understanding pride as the hardest passion to subdue.',
    quote: 'In reality, there is, perhaps, no one of our natural passions so hard to subdue as pride.',
  },
];

export const FRANKLIN_QUOTES = [
  'I did not aim for perfection, but for fewer faults.',
  'In reality, there is, perhaps, no one of our natural passions so hard to subdue as pride.',
  'The best investment is in the tools of one\'s own trade.',
  'Without continual growth and progress, such words as improvement, achievement, and success have no meaning.',
  'Lost time is never found again.',
  'Well done is better than well said.',
];
